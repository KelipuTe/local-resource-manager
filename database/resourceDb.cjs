
const { saveCreateByInfo } = require('./createByDb.cjs');
const { getNowDateTime } = require('../util/time.cjs');

let dbConn;

function dbSetDbConn(conn) {
    dbConn = conn;
}

const dbResourceModel = {
    id: 0,
    filename: '0',
    filetype: '0',
    source: '0',
    resource_id: '0',
    resource_index: 1,
    user_id: '0',
    resource_name: '0',
    ext_info: '0',
    publish_at: '0',
    key_point: '0',
    summary: '0',
    status: 1,
    visit_at: 'CURRENT_TIMESTAMP',
    visit_times: 1,
    create_at: 'CURRENT_TIMESTAMP',
    update_at: 'CURRENT_TIMESTAMP',
};

/** 返回【单个对象】或者【undefined】 */
async function selectFileInfo(filename) {
    const sql = `
        SELECT r.*, 
               c.username as username,
               c.ext_info as user_ext_info
        FROM \`resource\` as r LEFT JOIN \`create_by\` c ON r.user_id = c.user_id AND r.source = c.source
        WHERE r.filename = ?
    `;
    const basename = filename.split('.').slice(0, -1).join('.');
    const valueList = [basename];
    console.log(sql, valueList);

    return new Promise((resolve, reject) => {
        dbConn.get(sql, valueList, (err, row) => {
            if (err != null) {
                console.error('selectFileInfo', err.message);
                reject(err.message);
            } else {
                resolve(row);
            }
        });
    });
}

function insertFileInfo(model) {
    // 排除不需要更新的字段和多余的字段
    
    const { id, visit_at, visit_times, create_at, update_at, username, user_ext_info, ...insertData } = model;

    const keyList = Object.keys(insertData);
    const placeholderList = keyList.map(() => {
        return '?';
    });
    const placeholderStr = placeholderList.join(', ');
    const sql = `INSERT INTO \`resource\` (${keyList.join(', ')}) VALUES (${placeholderStr})`;
    const values = [...Object.values(insertData)];
    console.log(sql, values);

    return new Promise((resolve, reject) => {
        dbConn.serialize(() => {
            dbConn.run('BEGIN TRANSACTION');
            dbConn.run(sql, values, function (err) {
                if (err != null) {
                    console.error('insertFileInfo', err.message);
                    dbConn.run('ROLLBACK');
                    reject(err.message);
                    return;
                }

                const resourceId = this.lastID;

                saveCreateByInfo(model)
                    .then(() => {
                        dbConn.run('COMMIT');
                        resolve({ id: resourceId });
                    })
                    .catch(saveErr => {
                        console.error('saveCreateByInfo', saveErr);
                        dbConn.run('ROLLBACK');
                        reject(saveErr);
                    });
            });
        });
    });
}

function updateFileInfo(model) {
    // 排除不需要更新的字段和多余的字段

    const { id, visit_at, visit_times, create_at, update_at, username, user_ext_info, ...updateData } = model;

    model.update_at = getNowDateTime();
    const keyList = Object.keys(updateData);
    const setClause = keyList.map(key => `${key} = ?`).join(', ');
    const sql = `UPDATE \`resource\` SET ${setClause} WHERE id = ?`;
    const values = [...Object.values(updateData), id];
    console.log(sql, values);

    return new Promise((resolve, reject) => {
        dbConn.serialize(() => {
            dbConn.run('BEGIN TRANSACTION');
            dbConn.run(sql, values, function (err) {
                if (err != null) {
                    console.error('updateFileInfo', err.message);
                    dbConn.run('ROLLBACK');
                    reject(err.message);
                    return;
                }

                saveCreateByInfo(model)
                    .then(() => {
                        dbConn.run('COMMIT');
                        resolve({ changes: this.changes });
                    })
                    .catch(saveErr => {
                        console.error('saveCreateByInfo', saveErr);
                        dbConn.run('ROLLBACK');
                        reject(saveErr);
                    });
            });
        });
    });
}

async function dbQueryFileInfo(filename) {
    let returnData = { ...dbResourceModel, username: '0', user_ext_info: '0' };
    result = await selectFileInfo(filename);
    if (result != null) {
        returnData = { ...returnData, ...result };
    }
    return returnData;
}

async function dbSaveFileInfo(model) {
    let returnData = { ...dbResourceModel, username: '0', user_ext_info: '0' };
    if (model.id == 0) {
        returnData = await insertFileInfo(model);
    } else {
        returnData = await updateFileInfo(model);
    }
    return returnData;
}

module.exports = {
    dbResourceModel,
    dbSetDbConn,
    dbQueryFileInfo,
    dbSaveFileInfo,
};