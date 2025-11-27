const { getNowDateTime } = require('../util/time.cjs');

let dbConn;

function dbSetDbConn(conn) {
    dbConn = conn;
}

const createByModel = {
    id: 0,
    source: '0',
    user_id: '0',
    username: '0',
    ext_info: '0',
    same_as: '0',
    create_at: 'CURRENT_TIMESTAMP',
    update_at: 'CURRENT_TIMESTAMP',
};

const defaultTextValue = '0';

/** 保存创作者信息（不存在就插入，存在就修改） */
function saveCreateByInfo(model) {
    const { source, user_id, username } = model;

    if (source == null || user_id == null) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const selectSql = 'SELECT * FROM `create_by` WHERE source = ? AND user_id = ?';
        const selectValues = [source, user_id];
        console.log(selectSql, selectValues);

        dbConn.get(selectSql, selectValues, (err, row) => {
            if (err != null) {
                console.error('saveCreateByInfo', err.message);
                reject(err.message);
                return;
            }

            if (row != null) {
                let newExtInfo = row.ext_info
                if (username != row.username) {
                    const nowDateTime = getNowDateTime();
                    const addExtInfo = `${nowDateTime}，从【${row.username}】修改为【${username}】；`;
                    if (newExtInfo == defaultTextValue) {
                        newExtInfo = addExtInfo;
                    } else {
                        newExtInfo = newExtInfo + addExtInfo;
                    }
                }

                const updateSql = 'UPDATE `create_by` SET username = ?, ext_info = ?, update_at = CURRENT_TIMESTAMP WHERE id = ?';
                const updateValues = [username, newExtInfo, row.id];
                console.log(updateSql, updateValues);

                dbConn.run(updateSql, updateValues, (updateErr) => {
                    if (updateErr != null) {
                        console.error('saveCreateByInfo', updateErr.message);
                        reject(updateErr.message);
                        return;
                    }
                    resolve();
                });
            } else {
                const insertSql = 'INSERT INTO `create_by` (source, user_id, username, create_at, update_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)';
                const insertValues = [source, user_id, username];
                console.log(insertSql, insertValues);

                dbConn.run(insertSql, insertValues, (insertErr) => {
                    if (insertErr != null) {
                        console.error('saveCreateByInfo', insertErr.message);
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
    createByModel,
    dbSetDbConn,
    saveCreateByInfo
};