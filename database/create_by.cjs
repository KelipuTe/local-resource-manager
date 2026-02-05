const { getNowDateTime } = require('../util/time.cjs');

const { config } = require('./config.cjs');
const { logSqlLog } = require('../util/log.cjs');

let dbConn;

function dbSetDbConn(conn) {
    dbConn = conn;
}

// 【create_by 表】的模型
const dbCreateByModelDefault = {
    id: 0,
    source: config.dbTextDefaultValue,
    user_id: config.dbTextDefaultValue,
    username: config.dbTextDefaultValue,
    ext_info: config.dbTextDefaultValue,
    same_as: config.dbTextDefaultValue,
    create_at: config.dbTextDefaultValueNowTime,
    update_at: config.dbTextDefaultValueNowTime,
};

/**
 * 查询资源所属用户的数据（通过：来源、用户id）
 * @param dbModel dbCreateByModelDefault
 * @returns
 * reject(Object) dbCreateByModelDefault
 * resolve(string) 报错信息
 */
function dbCreateBySelect(dbModel) {
    const thisFuncName = 'dbCreateBySelect';

    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM \`create_by\` WHERE  user_id = ? AND source = ?;`;

        const { user_id, source } = dbModel;
        const valueList = [user_id, source];

        logSqlLog(thisFuncName, sql, valueList)

        dbConn.get(sql, valueList, (err, row) => {
            if (err != null) {
                console.error(thisFuncName, err.message);
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
    const thisFuncName = 'dbCreateByInsert';

    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO 
\`create_by\` (source, user_id, username, create_at, update_at) 
VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`;

        const { source, user_id, username } = dbModel;
        const valueList = [source, user_id, username];

        logSqlLog(thisFuncName, sql, valueList)

        dbConn.run(sql, valueList, function(err)  {
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
 * 修改资源所属用户的数据
 * @param dbModel dbCreateByModelDefault
 * @returns
 * reject(Object) {id: int}
 * resolve(string) 报错信息
 */
function dbCreateByUpdate(dbModel) {
    const thisFuncName = 'dbCreateByUpdate';

    return new Promise((resolve, reject) => {
        const sql = `UPDATE \`create_by\` 
SET username = ?, ext_info = ?, update_at = CURRENT_TIMESTAMP 
WHERE id = ?;`;

        const { username, ext_info, id } = dbModel;
        const valueList = [username, ext_info, id];

        logSqlLog(thisFuncName, sql, valueList)

        dbConn.run(sql, valueList, (err) => {
            if (err != null) {
                console.error(thisFuncName, err.message);
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
        dbModel.ext_info = result.ext_info;
        if (dbModel.username != result.username) {
            const nowDateTime = getNowDateTime();
            const addExtInfo = `${nowDateTime}，从【${result.username}】修改为【${dbModel.username}】；`;
            dbModel.ext_info = dbModel.ext_info + addExtInfo;
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