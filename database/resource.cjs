const path = require('path');

const dbConfig = require('./config.cjs');
const utilLog = require('../util/log.cjs');
const utilTime = require('../util/time.cjs');
const utilType = require('../util/type.cjs');

let dbConn;

function fnSetDbConn(conn) {
    dbConn = conn;
}

// 【resource 表】的模型
const defaultModel = {
    id: 0,
    filename: dbConfig.textValueDefault,
    filetype: dbConfig.textValueDefault,
    source: dbConfig.textValueDefault,
    resourceId: dbConfig.textValueDefault,
    resourceIndex: 1,
    userId: dbConfig.textValueDefault,
    resourceName: dbConfig.textValueDefault,
    extInfo: dbConfig.textValueDefault,
    publishAt: dbConfig.textValueDefault,
    keyPoint: dbConfig.textValueDefault,
    summary: dbConfig.textValueDefault,
    status: 1,
    visitAt: dbConfig.textValueNowTime,
    visitTimes: 1,
    createAt: dbConfig.textValueNowTime,
    updateAt: dbConfig.textValueNowTime,
};

/** 
 * 查询资源信息（通过，文件名）
 * @param dbModel dbResourceModelDefault
 * @returns
 * reject(Object) dbResourceModelDefault
 * resolve(string) 报错信息
 */
async function fnSelectByFilename(dbModel) {
    const sql = `SELECT * FROM \`resource\` WHERE filename = ? LIMIT 1;`;

    const filename = dbModel.filename;
    const basename = filename.split('.').slice(0, -1).join('.');
    const valueList = [basename];

    utilLog.fnLogSqlLog(sql, valueList)

    return new Promise((resolve, reject) => {
        dbConn.get(sql, valueList, (err, row) => {
            if (err != null) {
                utilLog.fnLogErrLog(err)
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
async function fnSelectBySourceAndId(dbModel) {
    const sql = `SELECT * FROM \`resource\` WHERE resource_id = ? AND source = ? LIMIT 1;`;

    const { resourceId, source } = dbModel;
    const valueList = [resourceId, source];

    utilLog.fnLogSqlLog(sql, valueList)

    return new Promise((resolve, reject) => {
        dbConn.get(sql, valueList, (err, row) => {
            if (err != null) {
                utilLog.fnLogErrLog(err)
                reject(err.message);
            } else {
                resolve(row);
            }
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
async function fnQueryByFilename(dbModel) {
    let returnData = { ...defaultModel };
    result = await fnSelectByFilename(dbModel);
    if (result != null) {
        result = utilType.fnObjKeySnakeToCamel(result);
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
async function fnQueryBySourceAndId(dbModel) {
    let returnData = { ...defaultModel };
    result = await fnSelectBySourceAndId(dbModel);
    if (result != null) {
        result = utilType.fnObjKeySnakeToCamel(result);
        returnData = { ...returnData, ...result };
    }
    return returnData;
}

/** 
 * 通过文件名模糊查询资源的数据
 * @param queryArgObj {filename, orderBy, pageSize, pageIndex}
 * @returns
 * resolve(Object[]) dbResourceModelDefault[]
 * reject(string) 报错信息
 */
async function fnFuzzyQueryByFilename(queryArgObj) {
    let { filename, orderBy, pageSize, pageIndex } = queryArgObj;

    // 如果 filename 没有值，则不参与查询
    let sql;
    let valueList;
    const offset = (pageIndex - 1) * pageSize

    if (filename == null || filename.trim() === '') {
        // 不包含 filename 条件的查询
        sql = `
            SELECT * FROM \`resource\` 
            ORDER BY ${orderBy}
            LIMIT ? OFFSET ?
        `;
        valueList = [pageSize, offset];
    } else {
        // 包含 filename 条件的模糊查询
        sql = `
            SELECT * FROM \`resource\` 
            WHERE filename LIKE ? 
            ORDER BY ${orderBy}
            LIMIT ? OFFSET ?
        `;
        filename = `%${filename}%`;
        valueList = [filename, pageSize, offset];
    }

    utilLog.fnLogSqlLog(sql, valueList);

    return new Promise((resolve, reject) => {
        dbConn.all(sql, valueList, (err, rows) => {
            if (err != null) {
                utilLog.fnLogErrLog(err);
                reject(err.message);
            } else {

                // 遍历 result 并为每个元素追加 dirPath
                const rootPath = 'D:\\我的仓库_03\\资源\\'
                for (let index = 0; index < rows.length; index++) {
                    const item = rows[index];
                    const year = new Date(item.publishAt).getFullYear().toString();
                    const dirPath = path.join(rootPath, item.key_point, year, item.source, item.userId, item.resourceId);
                    rows[index].dirPath = dirPath;
                }

                resolve(rows);
            }
        });
    });
}


/**
 * 保存资源信息（不存在就插入，存在就修改）
 * @param dbModel dbResourceModelDefault
 * @returns
 * reject(Object) {id: int}
 * resolve(string) 报错信息
 */
async function fnSaveModel(dbModel) {
    let returnData = { id: 0 };
    if (dbModel.id == 0) {
        returnData = await fnInsertAndGetId(dbModel);
    } else {
        returnData = await updateById(dbModel);
    }
    return returnData;
}

/** 
 * 新增资源的数据
 * @param dbMixModel dbResourceModelDefault
 * @returns
 * reject(Object) {id: int}
 * resolve(string) 报错信息
 */
function fnInsertAndGetId(dbMixModel) {
    // 排除【不需要更新的字段】
    let { id, visitAt, visitTimes, createAt, updateAt, ...insertData } = dbMixModel;
    insertData = utilType.fnObjKeyCamelToSnake(insertData)

    const keyList = Object.keys(insertData);

    const keyStr = keyList.join(', ');
    const placeholderList = keyList.map(() => { return '?'; });
    const placeholderStr = placeholderList.join(', ');
    const sql = `INSERT INTO \`resource\` (${keyStr}) VALUES (${placeholderStr});`;

    const valueList = [...Object.values(insertData)];

    utilLog.fnLogSqlLog(sql, valueList)

    return new Promise((resolve, reject) => {
        dbConn.run(sql, valueList, function (err) {
            if (err != null) {
                utilLog.fnLogErrLog(err)
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
function updateById(dbModel) {
    // 排除【不需要更新的字段】
    let { id, visitAt, visitTimes, createAt, updateAt, ...updateData } = dbModel;
    updateData = utilType.fnObjKeyCamelToSnake(updateData)

    dbModel.update_at = utilTime.fnGetNowDateTime();

    const keyList = Object.keys(updateData);
    const setClause = keyList.map(key => `${key} = ?`).join(', ');
    const sql = `UPDATE \`resource\` SET ${setClause} WHERE id = ?;`;

    const valueList = [...Object.values(updateData), id];

    utilLog.fnLogSqlLog(sql, valueList)

    return new Promise((resolve, reject) => {
        dbConn.run(sql, valueList, (err) => {
            if (err != null) {
                utilLog.fnLogErrLog(err)
                reject(err.message);
                return;
            }
            resolve({ id: id });
        });
    });
}

module.exports = {
    fnSetDbConn,
    fnQueryByFilename,
    fnQueryBySourceAndId,
    fnFuzzyQueryByFilename,
    fnSaveModel,
};