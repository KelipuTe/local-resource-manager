const sqlite3 = require('sqlite3').verbose();
const { handleCreateByRecord } = require('./createByDb.cjs');
const { getNowDateTime } = require('../utils/helpers.cjs');

let db;
let dbPath = 'D:\\不知道什么时候会有用的仓库\\比较大的资源放外面\\resource.db';

const resourceModel = {
    id: 0,
    filename: '0',
    filetype: '0',
    source: '0',
    resource_id: '0',
    index: 1,
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

db = new sqlite3.Database(dbPath, (err) => {
    if (err != null) {
        console.error('sqlite3.Database', err.message);
    }
});

/** 返回【单个对象】或者【undefined】 */
async function selectFileInfo(filename) {
    const sql = `
        SELECT r.*, 
               c.username as username,
               c.ext_info as user_ext_info
        FROM resource as r LEFT JOIN create_by c ON r.user_id = c.user_id AND r.source = c.source
        WHERE r.filename = ?
    `;
    const basename = filename.split('.').slice(0, -1).join('.');
    const valueList = [basename];
    console.log(sql, valueList);

    return new Promise((resolve, reject) => {
        db.get(sql, valueList, (err, row) => {
            if (err != null) {
                console.error('queryFileInfo', err.message);
                reject(err.message);
            } else {
                resolve(row);
            }
        });
    });
}

function insertFileInfo(model) {
    // 排除自增主键id和不需要更新的字段
    const { id, visit_at, visit_times, create_at, update_at, username, user_ext_info, ...insertData } = model;

    const keyList = Object.keys(insertData);
    const placeholders = keyList.map(() => { return '?'; }).join(', ');
    const sql = `INSERT INTO \`resource\` (${keyList.join(', ')}) VALUES (${placeholders})`;

    console.log(sql, insertData);

    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            // 插入resource表
            db.run(sql, Object.values(insertData), function (err) {
                if (err) {
                    console.error('insertFileInfo - resource insert', err.message);
                    db.run('ROLLBACK');
                    reject(err.message);
                    return;
                }

                const resourceId = this.lastID;

                // 处理create_by表
                handleCreateByRecord(model)
                    .then(() => {
                        db.run('COMMIT');
                        resolve({ id: resourceId });
                    })
                    .catch(handleErr => {
                        console.error('insertFileInfo - create_by handle', handleErr);
                        db.run('ROLLBACK');
                        reject(handleErr);
                    });
            });
        });
    });
}

function updateFileInfo(model) {
    // 排除主键id和不需要更新的字段
    const { id, visit_at, visit_times, create_at, update_at, ...updateData } = model;

    const keys = Object.keys(updateData);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const sql = `UPDATE \`resource\` SET ${setClause} WHERE id = ?`;
    model.update_at = getNowDateTime();
    const values = [...Object.values(updateData), id];

    console.log(sql, values);

    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // 开始事务
            db.run('BEGIN TRANSACTION');

            // 更新resource表

            db.run(sql, values, function (err) {
                if (err) {
                    console.error('updateFileInfo - resource update', err.message);
                    db.run('ROLLBACK');
                    reject(err.message);
                    return;
                }

                // 处理create_by表
                handleCreateByRecord(model)
                    .then(() => {
                        db.run('COMMIT');
                        resolve({ changes: this.changes });
                    })
                    .catch(handleErr => {
                        console.error('updateFileInfo - create_by handle', handleErr);
                        db.run('ROLLBACK');
                        reject(handleErr);
                    });
            });
        });
    });
}

async function queryFileInfo(filename) {
    let returnData = { ...resourceModel };
    try {
        result = await selectFileInfo(filename);
        console.log('nodejsQueryFileInfo', result);
        if (result != null) {
            returnData = { ...returnData, ...result };
        }
    } catch (err) {
        console.error('nodejsQueryFileInfo', err);
    }
    return returnData;
}

async function saveFileInfo(model) {
    console.log(model);
    let returnData = { ...resourceModel };
    try {
        if (model.id == 0) {
            returnData = await insertFileInfo(model);
        } else {
            returnData = await updateFileInfo(model);
        }
    } catch (err) {
        console.error('nodejsQueryFileInfo', err);
    }
    return returnData;
}

module.exports = {
    queryFileInfo,
    saveFileInfo,
    resourceModel
};