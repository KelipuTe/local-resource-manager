const { getNowDateTime } = require('../util/time.cjs');

const { config } = require('./config.cjs');
const { logSqlLog } = require('../util/log.cjs');

let dbConn;

function dbSetDbConn(conn) {
    dbConn = conn;
}

// 【resource 表】的模型
const dbResourceModelDefault = {
    id: 0,
    filename: config.dbTextDefaultValue,
    filetype: config.dbTextDefaultValue,
    source: config.dbTextDefaultValue,
    resource_id: config.dbTextDefaultValue,
    resource_index: 1,
    user_id: config.dbTextDefaultValue,
    resource_name: config.dbTextDefaultValue,
    ext_info: config.dbTextDefaultValue,
    publish_at: config.dbTextDefaultValue,
    key_point: config.dbTextDefaultValue,
    summary: config.dbTextDefaultValue,
    status: 1,
    visit_at: config.dbTextDefaultValueNowTime,
    visit_times: 1,
    create_at: config.dbTextDefaultValueNowTime,
    update_at: config.dbTextDefaultValueNowTime,
};

/** 
 * 查询资源信息（通过，文件名）
 * @param dbModel dbResourceModelDefault
 * @returns
 * reject(Object) dbResourceModelDefault
 * resolve(string) 报错信息
 */
async function dbResourceSelect(dbModel) {
    const thisFuncName = 'dbResourceSelect';

    const sql = `SELECT * FROM \`resource\` WHERE filename = ? LIMIT 1;`;

    const filename = dbModel.filename;
    const basename = filename.split('.').slice(0, -1).join('.');
    const valueList = [basename];

    logSqlLog(thisFuncName, sql, valueList)

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
 * 查询资源的数据（通过：来源、资源的id）
 * @param dbModel dbResourceModelDefault
 * @returns
 * reject(Object) dbResourceModelDefault
 * resolve(string) 报错信息
 */
async function dbResourceSelectV2(dbModel) {
    const thisFuncName = 'dbResourceSelectV2';

    const sql = `SELECT * FROM \`resource\` WHERE resource_id = ? AND source = ? LIMIT 1;`;

    const { resource_id, source } = dbModel;
    const valueList = [resource_id, source];

    logSqlLog(thisFuncName, sql, valueList)

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
 * 新增资源的数据
 * @param dbMixModel dbResourceModelDefault
 * @returns
 * reject(Object) {id: int}
 * resolve(string) 报错信息
 */
function dbResourceInsert(dbMixModel) {
    const thisFuncName = 'dbResourceInsert';

    // 排除【不需要更新的字段】
    const { id, visit_at, visit_times, create_at, update_at, ...insertData } = dbMixModel;

    const keyList = Object.keys(insertData);
    const keyStr = keyList.join(', ');
    const placeholderList = keyList.map(() => { return '?'; });
    const placeholderStr = placeholderList.join(', ');
    const sql = `INSERT INTO \`resource\` (${keyStr}) VALUES (${placeholderStr});`;

    const valueList = [...Object.values(insertData)];

    logSqlLog(thisFuncName, sql, valueList)

    return new Promise((resolve, reject) => {
        dbConn.run(sql, valueList, function (err) {
            if (err != null) {
                console.error(thisFuncName, err.message);
                reject(err.message);
                return;
            }
            resolve({ id: this.lastID });
        });
    });
}

/** 
 * 修改资源的数据
 * @param dbModel dbResourceModelDefault
 * @returns
 * reject(Object) {id: int}
 * resolve(string) 报错信息
 */
function dbResourceUpdate(dbModel) {
    const thisFuncName = 'dbResourceUpdate';

    // 排除【不需要更新的字段】
    const { id, visit_at, visit_times, create_at, update_at, ...updateData } = dbModel;

    dbModel.update_at = getNowDateTime();

    const keyList = Object.keys(updateData);
    const setClause = keyList.map(key => `${key} = ?`).join(', ');
    const sql = `UPDATE \`resource\` SET ${setClause} WHERE id = ?;`;

    const valueList = [...Object.values(updateData), id];

    logSqlLog(thisFuncName, sql, valueList)

    return new Promise((resolve, reject) => {
        dbConn.run(sql, valueList, (err) => {
            if (err != null) {
                console.error(thisFuncName, err.message);
                reject(err.message);
                return;
            }
            resolve({ id: id });
        });
    });
}

/**
 * 查询资源的数据（通过：文件名）
 * @param dbModel dbResourceModelDefault
 * @returns
 * reject(Object) dbResourceModelDefault
 * resolve(string) 报错信息
 */
async function dbResourceQuery(dbModel) {
    let returnData = { ...dbResourceModelDefault };
    result = await dbResourceSelect(dbModel);
    if (result != null) {
        returnData = { ...returnData, ...result };
    }
    return returnData;
}

/**
 * 查询资源的数据（通过：来源、资源的id）
 * @param dbModel dbResourceModelDefault
 * @returns
 * reject(Object) dbResourceModelDefault
 * resolve(string) 报错信息
 */
async function dbResourceQueryV2(dbModel) {
    let returnData = { ...dbResourceModelDefault };
    result = await dbResourceSelectV2(dbModel);
    if (result != null) {
        returnData = { ...returnData, ...result };
    }
    return returnData;
}

/**
 * 保存资源信息（不存在就插入，存在就修改）
 * @param dbModel dbResourceModelDefault
 * @returns
 * reject(Object) {id: int}
 * resolve(string) 报错信息
 */
async function dbResourceSave(dbModel) {
    let returnData = { id: 0 };
    if (dbModel.id == 0) {
        returnData = await dbResourceInsert(dbModel);
    } else {
        returnData = await dbResourceUpdate(dbModel);
    }
    return returnData;
}

module.exports = {
    dbResourceModelDefault,
    dbSetDbConn,
    dbResourceQuery,
    dbResourceQueryV2,
    dbResourceSave,
};