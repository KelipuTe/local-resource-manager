const sqlite3 = require('sqlite3').verbose();

let db;
let dbPath = 'D:\\不知道什么时候会有用的仓库\\比较大的资源放外面\\resource.db';

db = new sqlite3.Database(dbPath, (err) => {
    if (err != null) {
        console.error('sqlite3.Database', err.message);
    }
});

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

// 新增函数：处理create_by表记录
function saveCreateByInfo(model) {
    const { source, user_id, user_name } = model;

    // 如果缺少必要字段，跳过处理
    if (!source || !user_id || !user_name) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        // 根据source和user_id查询记录
        const selectSql = 'SELECT * FROM `create_by` WHERE source = ? AND user_id = ?';

        db.get(selectSql, [source, user_id], (err, row) => {
            if (err) {
                console.error('handleCreateByRecord - select', err.message);
                reject(err.message);
                return;
            }

            if (row) {
                // 记录存在，更新数据
                let newExtInfo = row.user_name;
                if (row.ext_info) {
                    newExtInfo = row.ext_info + ', ' + row.user_name;
                }

                const updateSql = 'UPDATE `create_by` SET user_name = ?, ext_info = ?, update_at = CURRENT_TIMESTAMP WHERE id = ?';
                db.run(updateSql, [user_name, newExtInfo, row.id], (updateErr) => {
                    if (updateErr) {
                        console.error('handleCreateByRecord - update', updateErr.message);
                        reject(updateErr.message);
                        return;
                    }
                    resolve();
                });
            } else {
                // 记录不存在，新增记录
                const insertSql = 'INSERT INTO `create_by` (source, user_id, user_name, create_at, update_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)';
                db.run(insertSql, [source, user_id, user_name], (insertErr) => {
                    if (insertErr) {
                        console.error('handleCreateByRecord - insert', insertErr.message);
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
    saveCreateByInfo: saveCreateByInfo,
    createByModel
};