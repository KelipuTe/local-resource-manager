const { app, BrowserWindow } = require('electron/main');
const path = require('path');
const { setMainWindow, registerIpcHandler } = require('./ipcHandlers.cjs');

let mainWindow;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            webSecurity: false // 添加此行以禁用同源策略限制
        }
    });
    mainWindow.webContents.openDevTools(); // 开启调试工具
    mainWindow.loadURL('http://localhost:5173');
    
    // 设置主窗口引用
    setMainWindow(mainWindow);
};

app.whenReady().then(() => {
    // 注册IPC处理器
    registerIpcHandler();

    createWindow();

    app.on(
        'activate',
        () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        }
    );
});

app.on(
    'window-all-closed',
    () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    }
);

// // ---------------- SQLite ----------------

// let db;
// let dbPath = 'D:\\不知道什么时候会有用的仓库\\比较大的资源放外面\\resource.db';

// db = new sqlite3.Database(dbPath, (err) => {
//     if (err != null) {
//         console.error('sqlite3.Database', err.message);
//     }
// });

// const resourceModel = {
//     id: 0,
//     filename: '0',
//     filetype: '0',
//     source: '0',
//     resource_id: '0',
//     index: 1,
//     user_id: '0',
//     resource_name: '0',
//     ext_info: '0',
//     publish_at: '0',
//     key_point: '0',
//     summary: '0',
//     status: 1,
//     visit_at: 'CURRENT_TIMESTAMP',
//     visit_times: 1,
//     create_at: 'CURRENT_TIMESTAMP',
//     update_at: 'CURRENT_TIMESTAMP',
// };

// const createByModel = {
//     id: 0,
//     source: '0',
//     user_id: '0',
//     username: '0',
//     ext_info: '0',
//     same_as: '0',
//     create_at: 'CURRENT_TIMESTAMP',
//     update_at: 'CURRENT_TIMESTAMP',
// };


// /** 返回【单个对象】或者【undefined】 */
// async function selectFileInfo(filename) {
//     const sql = `
//         SELECT r.*, 
//                c.username as username,
//                c.ext_info as user_ext_info
//         FROM resource as r LEFT JOIN create_by c ON r.user_id = c.user_id AND r.source = c.source
//         WHERE r.filename = ?
//     `;
//     const basename = filename.split('.').slice(0, -1).join('.');
//     const valueList = [basename];
//     console.log(sql, valueList);

//     return new Promise((resolve, reject) => {
//         db.get(sql, valueList, (err, row) => {
//             if (err != null) {
//                 console.error('queryFileInfo', err.message);
//                 reject(err.message);
//             } else {
//                 resolve(row);
//             }
//         });
//     });
// }

// function insertFileInfo(model) {
//     // 排除自增主键id和不需要更新的字段
//     const { id, visit_at, visit_times, create_at, update_at, username, user_ext_info, ...insertData } = model;

//     const keyList = Object.keys(insertData);
//     const placeholders = keyList.map(() => { return '?'; }).join(', ');
//     const sql = `INSERT INTO \`resource\` (${keyList.join(', ')}) VALUES (${placeholders})`;

//     console.log(sql, insertData);

//     return new Promise((resolve, reject) => {
//         db.serialize(() => {
//             db.run('BEGIN TRANSACTION');

//             // 插入resource表
//             db.run(sql, Object.values(insertData), function (err) {
//                 if (err) {
//                     console.error('insertFileInfo - resource insert', err.message);
//                     db.run('ROLLBACK');
//                     reject(err.message);
//                     return;
//                 }

//                 const resourceId = this.lastID;

//                 // 处理create_by表
//                 handleCreateByRecord(model)
//                     .then(() => {
//                         db.run('COMMIT');
//                         resolve({ id: resourceId });
//                     })
//                     .catch(handleErr => {
//                         console.error('insertFileInfo - create_by handle', handleErr);
//                         db.run('ROLLBACK');
//                         reject(handleErr);
//                     });
//             });
//         });
//     });
// }

// function getNowDateTime() {
//     const now = new Date();

//     // 月份从 0 开始
//     const year = now.getFullYear();
//     const month = String(now.getMonth() + 1).padStart(2, '0');
//     const day = String(now.getDate()).padStart(2, '0');
//     const hours = String(now.getHours()).padStart(2, '0');
//     const minutes = String(now.getMinutes()).padStart(2, '0');
//     const seconds = String(now.getSeconds()).padStart(2, '0');

//     return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
// }

// function updateFileInfo(model) {
//     // 排除主键id和不需要更新的字段
//     const { id, visit_at, visit_times, create_at, update_at, ...updateData } = model;

//     const keys = Object.keys(updateData);
//     const setClause = keys.map(key => `${key} = ?`).join(', ');
//     const sql = `UPDATE \`resource\` SET ${setClause} WHERE id = ?`;
//     model.update_at = getNowDateTime();
//     const values = [...Object.values(updateData), id];

//     console.log(sql, values);

//     return new Promise((resolve, reject) => {
//         db.serialize(() => {
//             // 开始事务
//             db.run('BEGIN TRANSACTION');

//             // 更新resource表

//             db.run(sql, values, function (err) {
//                 if (err) {
//                     console.error('updateFileInfo - resource update', err.message);
//                     db.run('ROLLBACK');
//                     reject(err.message);
//                     return;
//                 }

//                 // 处理create_by表
//                 handleCreateByRecord(model)
//                     .then(() => {
//                         db.run('COMMIT');
//                         resolve({ changes: this.changes });
//                     })
//                     .catch(handleErr => {
//                         console.error('updateFileInfo - create_by handle', handleErr);
//                         db.run('ROLLBACK');
//                         reject(handleErr);
//                     });
//             });
//         });
//     });
// }

// // -------------------------------- SQLite --------------------------------

// // 新增函数：处理create_by表记录
// function handleCreateByRecord(model) {
//     const { source, user_id, user_name } = model;

//     // 如果缺少必要字段，跳过处理
//     if (!source || !user_id || !user_name) {
//         return Promise.resolve();
//     }

//     return new Promise((resolve, reject) => {
//         // 根据source和user_id查询记录
//         const selectSql = 'SELECT * FROM `create_by` WHERE source = ? AND user_id = ?';

//         db.get(selectSql, [source, user_id], (err, row) => {
//             if (err) {
//                 console.error('handleCreateByRecord - select', err.message);
//                 reject(err.message);
//                 return;
//             }

//             if (row) {
//                 // 记录存在，更新数据
//                 let newExtInfo = row.user_name;
//                 if (row.ext_info) {
//                     newExtInfo = row.ext_info + ', ' + row.user_name;
//                 }

//                 const updateSql = 'UPDATE `create_by` SET user_name = ?, ext_info = ?, update_at = CURRENT_TIMESTAMP WHERE id = ?';
//                 db.run(updateSql, [user_name, newExtInfo, row.id], (updateErr) => {
//                     if (updateErr) {
//                         console.error('handleCreateByRecord - update', updateErr.message);
//                         reject(updateErr.message);
//                         return;
//                     }
//                     resolve();
//                 });
//             } else {
//                 // 记录不存在，新增记录
//                 const insertSql = 'INSERT INTO `create_by` (source, user_id, user_name, create_at, update_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)';
//                 db.run(insertSql, [source, user_id, user_name], (insertErr) => {
//                     if (insertErr) {
//                         console.error('handleCreateByRecord - insert', insertErr.message);
//                         reject(insertErr.message);
//                         return;
//                     }
//                     resolve();
//                 });
//             }
//         });
//     });
// }