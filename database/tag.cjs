const { config } = require('./config.cjs');

let dbConn;

function dbSetDbConn(conn) {
    dbConn = conn;
}

// 【tag 表】的模型
const dbTagModelDefault = {
    id: 0,
    name: config.dbTextDefaultValue,
    description: config.dbTextDefaultValue,
    create_at: config.dbTextDefaultValueNowTime,
    update_at: config.dbTextDefaultValueNowTime,
};

// 【resource_tag 表】的模型
const dbResourceTagModelDefault = {
    resource_id: 0,
    tag_id: 0,
    create_at: config.dbTextDefaultValueNowTime,
};

/**
 * 获取所有标签
 * @returns Promise<Array> 标签列表
 */
function dbTagQueryAll() {
    const thisFuncName = 'dbTagQueryAll';

    const sql = `SELECT * FROM \`tag\` ORDER BY id DESC`;

    console.log(thisFuncName, sql);

    return new Promise((resolve, reject) => {
        dbConn.all(sql, [], (err, rows) => {
            if (err) {
                console.error(thisFuncName, err.message);
                reject(err.message);
            } else {
                resolve(rows || []);
            }
        });
    });
}

/**
 * 根据资源ID获取标签
 * @param {number} resourceId 资源ID
 * @returns Promise<Array> 标签列表
 */
function dbResourceTagQuery(resourceId) {
    const thisFuncName = 'dbResourceTagQuery';

    const sql = `SELECT t.* 
FROM \`resource_tag\` AS rt INNER JOIN \`tag\` AS t ON rt.tag_id = t.id
WHERE rt.resource_id = ? 
ORDER BY t.id DESC`;
    const valueList = [resourceId];

    console.log(thisFuncName, sql, valueList);

    return new Promise((resolve, reject) => {
        dbConn.all(sql, valueList, (err, rows) => {
            if (err) {
                console.error(thisFuncName, err.message);
                reject(err.message);
            } else {
                if (rows == null) {
                    rows = [];
                }
                resolve(rows);
            }
        });
    });
}

/**
 * 创建新标签
 * @param {Object} dbModel 标签数据 {name, desc}
 * @returns Promise<Object> 新创建的标签
 */
function dbTagCreate(dbModel) {
    const thisFuncName = 'dbTagCreate';

    const { name, description } = dbModel;

    const sql = `INSERT INTO tag (name, description, create_at, update_at)
VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
    const valueList = [name, description];

    console.log(thisFuncName, sql, valueList);

    return new Promise((resolve, reject) => {
        dbConn.run(sql, valueList, function (err) {
            if (err) {
                console.error(thisFuncName, err.message);
                reject(err.message);
            } else {
                resolve({ id: this.lastID });
            }
        });
    });
}

/**
 * 保存资源标签关联关系
 * @param {number} resourceId 资源ID
 * @param {Array<number>} tagIdList 标签ID数组
 * @returns Promise<void>
 */
function dbResourceTagSave(resourceId, tagIdList) {
    const thisFuncName = 'dbResourceTagSave';

    return new Promise((resolve, reject) => {
        dbConn.serialize(() => {
            dbConn.run('BEGIN TRANSACTION');

            // 先删除旧的标签
            const delSql = `DELETE FROM \`resource_tag\` WHERE resource_id = ?`;
            const delValueList = [resourceId];
            console.log(thisFuncName, delSql, delValueList);

            dbConn.run(delSql, delValueList, (err) => {
                if (err != null) {
                    dbConn.run('ROLLBACK');
                    console.error(thisFuncName, err.message);
                    reject(err.message);
                    return;
                }

                // 如果没有要添加的标签，到这就结束了
                if (tagIdList == null || tagIdList.length == 0) {
                    dbConn.run('COMMIT');
                    resolve();
                    return;
                }

                // 添加新的标签
                const insertSql = `INSERT INTO \`resource_tag\` (resource_id, tag_id, create_at)
VALUES (?, ?, CURRENT_TIMESTAMP)`;

                let insertNum = 0;
                tagIdList.forEach((item) => {
                    const insertValueList = [resourceId, item];
                    console.log(thisFuncName, insertSql, insertValueList);

                    dbConn.run(insertSql, insertValueList, (err02) => {
                        if (err02 != null) {
                            dbConn.run('ROLLBACK');
                            console.error(thisFuncName, err02.message);
                            reject(err02.message);
                            return;
                        }

                        insertNum++;
                        if (insertNum === tagIdList.length) {
                            dbConn.run('COMMIT');
                            resolve();
                        }
                    });
                });
            });
        });
    });
}

module.exports = {
    dbTagModelDefault,
    dbResourceTagModelDefault,
    dbSetDbConn,
    dbTagQueryAll,
    dbTagCreate,
    dbResourceTagQuery,
    dbResourceTagSave
};