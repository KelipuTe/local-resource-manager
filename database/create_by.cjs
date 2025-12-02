const { getNowDateTime } = require('../util/time.cjs');
const { dbTextDefaultValue, dbTextDefaultValueNowTime } = require('./config.cjs');

let dbConn;

function dbSetDbConn(conn) {
    dbConn = conn;
}

const dbCreateByModelDefault = {
    id: 0,
    source: dbTextDefaultValue,
    user_id: dbTextDefaultValue,
    username: dbTextDefaultValue,
    ext_info: dbTextDefaultValue,
    same_as: dbTextDefaultValue,
    create_at: dbTextDefaultValueNowTime,
    update_at: dbTextDefaultValueNowTime,
};

/**
 * 保存资源所属用户信息（不存在就插入，存在就修改）
 * @param dbMixModel dbResourceAndCreateByModelDefault
 * @returns
 * reject(Object)。{createById: int}。
 * resolve(string)。报错信息。
 */
function dbCreateBySave(dbMixModel) {
    const thisFuncName = 'dbCreateBySave';

    const { source, user_id, username } = dbMixModel;

    if (source == null || user_id == null) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const selectSql = `SELECT * FROM \`create_by\` WHERE source = ? AND user_id = ?;`;
        const selectValues = [source, user_id];

        console.log(thisFuncName, selectSql, selectValues);

        dbConn.get(selectSql, selectValues, (err, row) => {
            if (err != null) {
                console.error(thisFuncName, err.message);
                reject(err.message);
                return;
            }

            if (row != null) {
                let newExtInfo = row.ext_info
                if (username != row.username) {
                    const nowDateTime = getNowDateTime();
                    const addExtInfo = `${nowDateTime}，从【${row.username}】修改为【${username}】；`;
                    if (newExtInfo == dbTextDefaultValue) {
                        newExtInfo = addExtInfo;
                    } else {
                        newExtInfo = newExtInfo + addExtInfo;
                    }
                }

                const updateSql = `UPDATE \`create_by\` 
SET username = ?, ext_info = ?, update_at = CURRENT_TIMESTAMP 
WHERE id = ?;`;
                const updateValues = [username, newExtInfo, row.id];
                console.log(updateSql, updateValues);

                dbConn.run(updateSql, updateValues, (updateErr) => {
                    if (updateErr != null) {
                        console.error(thisFuncName, updateErr.message);
                        reject(updateErr.message);
                        return;
                    }
                    resolve();
                });
            } else {
                const insertSql = `
INSERT INTO \`create_by\` (source, user_id, username, create_at, update_at) 
VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`;
                const insertValues = [source, user_id, username];
                console.log(insertSql, insertValues);

                dbConn.run(insertSql, insertValues, (insertErr) => {
                    if (insertErr != null) {
                        console.error(thisFuncName, insertErr.message);
                        reject(insertErr.message);
                        return;
                    }
                    resolve();
                });
            }
        });
    });
}

module.exports = {
    dbCreateByModelDefault,
    dbSetDbConn,
    dbCreateBySave
};