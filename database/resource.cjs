const { getNowDateTime } = require('../util/time.cjs');
const { dbTextDefaultValue, dbTextDefaultValueNowTime } = require('./config.cjs');
const { dbCreateBySave } = require('./create_by.cjs');

let dbConn;

function dbSetDbConn(conn) {
    dbConn = conn;
}

const dbResourceModelDefault = {
    id: 0,
    filename: dbTextDefaultValue,
    filetype: dbTextDefaultValue,
    source: dbTextDefaultValue,
    resource_id: dbTextDefaultValue,
    resource_index: 1,
    user_id: dbTextDefaultValue,
    resource_name: dbTextDefaultValue,
    ext_info: dbTextDefaultValue,
    publish_at: dbTextDefaultValue,
    key_point: dbTextDefaultValue,
    summary: dbTextDefaultValue,
    status: 1,
    visit_at: dbTextDefaultValueNowTime,
    visit_times: 1,
    create_at: dbTextDefaultValueNowTime,
    update_at: dbTextDefaultValueNowTime,
};

const dbResourceAndCreateByModelDefault = {
    ...dbResourceModelDefault,
    username: dbTextDefaultValue,
    user_ext_info: dbTextDefaultValue,
};

/** 
 * 查询资源信息（通过，文件名）
 * @param dbModel dbResourceModelDefault
 * @returns
 * reject(Object)。dbResourceAndCreateByModelDefault。
 * resolve(string)。报错信息。
 */
async function dbResourceSelect(dbModel) {
    const thisFuncName = 'dbResourceSelect';

    const sql = `
SELECT r.*, c.username AS username, c.ext_info AS user_ext_info
FROM \`resource\` AS r LEFT JOIN \`create_by\` AS c 
ON r.user_id = c.user_id AND r.source = c.source
WHERE r.filename = ? 
LIMIT 1;`;

    const filename = dbModel.filename;
    const basename = filename.split('.').slice(0, -1).join('.');
    const valueList = [basename];

    console.log(thisFuncName, sql, valueList);

    return new Promise((resolve, reject) => {
        dbConn.get(sql, valueList, (err, row) => {
            if (err != null) {
                console.error(thisFuncName, err.message);
                reject(err.message);
            } else {
                resolve(row);
            }
        });
    });
}

/** 
 * 查询资源信息（通过，资源id、资源所属用户的id、资源的来源）
 * @param dbModel dbResourceModelDefault
 * @returns
 * reject(Object)。dbResourceAndCreateByModelDefault。
 * resolve(string)。报错信息。
 */
async function dbResourceSelectV2(dbModel) {
    const thisFuncName = 'dbResourceSelectV2';

    const sql = `
SELECT r.*, c.username AS username, c.ext_info AS user_ext_info 
FROM \`resource\` AS r LEFT JOIN \`create_by\` AS c 
ON r.user_id = c.user_id AND r.source = c.source 
WHERE r.resource_id = ? AND r.user_id = ? AND r.source = ? 
LIMIT 1;`;
    const { resource_id, user_id, source } = dbModel;
    const valueList = [resource_id, user_id, source];

    console.log(thisFuncName, sql, valueList);

    return new Promise((resolve, reject) => {
        dbConn.get(sql, valueList, (err, row) => {
            if (err != null) {
                console.error(thisFuncName, err.message);
                reject(err.message);
            } else {
                resolve(row);
            }
        });
    });
}

/** 
 * 新增资源信息
 * 会更新【resource 表】和【create_by 表】
 * @param dbMixModel dbResourceAndCreateByModelDefault
 * @returns
 * reject(Object)。{resourceId: int, createById: int}。
 * resolve(string)。报错信息。
 */
function dbResourceInsert(dbMixModel) {
    const thisFuncName = 'dbResourceInsert';

    // 排除【不需要更新的字段】和【【create_by 表】的字段】
    const { id, visit_at, visit_times, create_at, update_at,
        username, user_ext_info, ...insertData } = dbMixModel;

    const keyList = Object.keys(insertData);
    const placeholderList = keyList.map(() => {
        return '?';
    });
    const keyStr = keyList.join(', ');
    const placeholderStr = placeholderList.join(', ');
    const sql = `INSERT INTO \`resource\` (${keyStr}) VALUES (${placeholderStr});`;
    const values = [...Object.values(insertData)];

    console.log(thisFuncName, sql, values);

    return new Promise((resolve, reject) => {
        dbConn.serialize(() => {
            dbConn.run('BEGIN TRANSACTION');
            dbConn.run(sql, values, function (err) {
                if (err != null) {
                    console.error(thisFuncName, err.message);
                    dbConn.run('ROLLBACK');
                    reject(err.message);
                    return;
                }

                const resourceId = this.lastID;

                dbCreateBySave(dbMixModel)
                    .then(() => {
                        dbConn.run('COMMIT');
                        resolve({ id: resourceId });
                    })
                    .catch(saveErr => {
                        console.error(thisFuncName, saveErr);
                        dbConn.run('ROLLBACK');
                        reject(saveErr);
                    });
            });
        });
    });
}

/** 
 * 更新资源信息
 * 会更新【resource 表】和【create_by 表】
 * @param dbMixModel dbResourceAndCreateByModelDefault
 * @returns
 * reject(Object)。{resourceId: int, createById: int}。
 * resolve(string)。报错信息。
 */
function dbResourceUpdate(dbMixModel) {
    const thisFuncName = 'dbResourceUpdate';

    // 排除【不需要更新的字段】和【【create_by 表】的字段】
    const { id, visit_at, visit_times, create_at, update_at,
        username, user_ext_info, ...updateData } = dbMixModel;

    dbMixModel.update_at = getNowDateTime();
    const keyList = Object.keys(updateData);
    const setClause = keyList.map(key => `${key} = ?`).join(', ');
    const sql = `UPDATE \`resource\` SET ${setClause} WHERE id = ?;`;
    const values = [...Object.values(updateData), id];

    console.log(thisFuncName, sql, values);

    return new Promise((resolve, reject) => {
        dbConn.serialize(() => {
            dbConn.run('BEGIN TRANSACTION');
            dbConn.run(sql, values, function (err) {
                if (err != null) {
                    console.error(thisFuncName, err.message);
                    dbConn.run('ROLLBACK');
                    reject(err.message);
                    return;
                }

                dbCreateBySave(dbMixModel)
                    .then(() => {
                        dbConn.run('COMMIT');
                        resolve({ changes: this.changes });
                    })
                    .catch(saveErr => {
                        console.error(thisFuncName, saveErr);
                        dbConn.run('ROLLBACK');
                        reject(saveErr);
                    });
            });
        });
    });
}

/**
 * 查询资源信息（通过文件名）
 * @param dbModel dbResourceModelDefault
 * @returns
 * reject(Object)。dbResourceAndCreateByModelDefault。
 * resolve(string)。报错信息。
 */
async function dbResourceQuery(dbModel) {
    let returnData = { ...dbResourceAndCreateByModelDefault };
    result = await dbResourceSelect(dbModel);
    if (result != null) {
        returnData = { ...returnData, ...result };
    }
    return returnData;
}

/**
 * 查询资源信息（通过资源信息）
 * @param dbModel dbResourceModelDefault
 * @returns
 * reject(Object)。dbResourceAndCreateByModelDefault。
 * resolve(string)。报错信息。
 */
async function dbResourceQueryV2(dbModel) {
    let returnData = { ...dbResourceAndCreateByModelDefault };
    result = await dbResourceSelectV2(dbModel);
    if (result != null) {
        returnData = { ...returnData, ...result };
    }
    return returnData;
}

/**
 * 保存资源信息（不存在就插入，存在就修改）
 * @param dbMixModel dbResourceAndCreateByModelDefault
 * @returns
 * reject(Object)。{resourceId: int, createById: int}。
 * resolve(string)。报错信息。
 */
async function dbResourceSave(dbMixModel) {
    let returnData = { ...dbResourceAndCreateByModelDefault };
    if (dbMixModel.id == 0) {
        returnData = await dbResourceInsert(dbMixModel);
    } else {
        returnData = await dbResourceUpdate(dbMixModel);
    }
    return returnData;
}

module.exports = {
    dbResourceAndCreateByModelDefault,
    dbSetDbConn,
    dbResourceQuery,
    dbResourceQueryV2,
    dbResourceSave,
};