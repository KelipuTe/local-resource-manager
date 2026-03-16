const dbConfig = require('./config.cjs');
const utilLog = require('../util/log.cjs');
const utilTime = require('../util/time.cjs');
const utilType = require('../util/type.cjs');

let dbConn;

function dbSetDbConn(conn) {
    dbConn = conn;
}

// 【create_by 表】的模型
const dbCreateByModelDefault = {
    id: 0,
    source: dbConfig.textValueDefault,
    userId: dbConfig.textValueDefault,
    username: dbConfig.textValueDefault,
    extInfo: dbConfig.textValueDefault,
    sameAs: dbConfig.textValueDefault,
    createAt: dbConfig.textValueNowTime,
    updateAt: dbConfig.textValueNowTime,
};

/**
 * 查询资源所属用户的数据（通过：来源、用户id）
 * @param dbModel dbCreateByModelDefault
 * @returns
 * reject(Object) dbCreateByModelDefault
 * resolve(string) 报错信息
 */
function dbCreateBySelect(dbModel) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM \`create_by\` WHERE  user_id = ? AND source = ?;`;

        const { userId, source } = dbModel;
        const valueList = [userId, source];

        utilLog.fnLogSqlLog(sql, valueList)

        dbConn.get(sql, valueList, (err, row) => {
            if (err != null) {
                utilLog.fnLogErrLog(err);
                reject(err.message);
                return;
            } else {
                resolve(row);
            }
        });
    });
}

/**
 * 新增资源所属用户的数据
 * @param dbModel dbCreateByModelDefault
 * @returns
 * reject(Object) {id: int}
 * resolve(string) 报错信息
 */
function dbCreateByInsert(dbModel) {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO 
\`create_by\` (source, user_id, username, create_at, update_at) 
VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`;

        const { source, userId, username } = dbModel;
        const valueList = [source, userId, username];

        utilLog.fnLogSqlLog(sql, valueList)

        // 需要用 this 获取插入后的 id，箭头函数没有 this
        dbConn.run(sql, valueList, function (err) {
            if (err != null) {
                utilLog.fnLogErrLog(err);
                reject(err.message);
                return;
            }
            resolve({ id: this.lastID });
        });
    });
}

/**
 * 修改资源所属用户的数据
 * @param dbModel dbCreateByModelDefault
 * @returns
 * reject(Object) {id: int}
 * resolve(string) 报错信息
 */
function dbCreateByUpdate(dbModel) {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE \`create_by\` 
SET username = ?, ext_info = ?, update_at = CURRENT_TIMESTAMP 
WHERE id = ?;`;

        const { username, extInfo, id } = dbModel;
        const valueList = [username, extInfo, id];

        utilLog.fnLogSqlLog(sql, valueList)

        dbConn.run(sql, valueList, (err) => {
            if (err != null) {
                utilLog.fnLogErrLog(err);
                reject(err.message);
                return;
            }
            resolve({ id: id });
        });
    })
}

/**
 * 查询资源所属用户数据（通过：来源、用户id）
 * @param dbModel dbCreateByModelDefault
 * @returns
 * reject(Object) dbCreateByModelDefault
 * resolve(string) 报错信息
 */
async function dbCreateByQuery(dbModel) {
    let returnData = { ...dbCreateByModelDefault };
    result = await dbCreateBySelect(dbModel);
    if (result != null) {
        result = utilType.fnObjKeySnakeToCamel(result);
        returnData = { ...returnData, ...result };
    }
    return returnData;
}

/**
 * 保存资源所属用户的数据（不存在就插入，存在就修改）
 * @param dbModel dbCreateByModelDefault
 * @returns
 * reject(Object) {id: int}
 * resolve(string) 报错信息
 */
async function dbCreateBySave(dbModel) {
    const result = await dbCreateBySelect(dbModel);
    if (result != null) {
        dbModel.id = result.id;
        dbModel.extInfo = result.extInfo;
        if (dbModel.username != result.username) {
            const nowDateTime = utilTime.fnGetNowDateTime();
            const addExtInfo = `${nowDateTime}，从【${result.username}】修改为【${dbModel.username}】；`;
            dbModel.extInfo = dbModel.extInfo + addExtInfo;
        }
        return await dbCreateByUpdate(dbModel);
    } else {
        return await dbCreateByInsert(dbModel);
    }
}

module.exports = {
    dbCreateByModelDefault,
    dbSetDbConn,
    dbCreateByQuery,
    dbCreateBySave
};