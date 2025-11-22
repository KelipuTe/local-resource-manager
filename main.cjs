const { app, BrowserWindow } = require('electron/main');
const { ipcMain, dialog } = require('electron/main');
const fs = require('fs/promises');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

let mainWindow;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: false // 添加此行以禁用同源策略限制
        }
    });
    mainWindow.webContents.openDevTools(); // 开启调试工具
    mainWindow.loadURL('http://localhost:5173');
};

// ---------------- SQLite ----------------

let db;
let dbPath = 'D:\\不知道什么时候会有用的仓库\\比较大的资源放外面\\resource.db';

db = new sqlite3.Database(
    dbPath,
    (err) => {
        if (err != null) {
            console.error('sqlite3.Database', err.message);
        }
    }
);

// 这东西就是写在这里，方便看【resource 表】的数据结构用的
const resourceModel = {
    id: 0,
    filename: '0', // 文件名
    filetype: '0', // 文件后缀名
    source: '0', // 资源的来源。bilibili。
    source_id: '0', // 资源的原始id
    source_num: 1, // 资源的编号。有些资源会共用原始id。
    source_name: '0', // 资源的名称
    source_ext_info: '0', // 额外的资源信息
    user_id: '0', // 资源所属的用户的id
    user_name: '0', // 资源所属的用户的名称
    user_ext_info: '0', // 额外的用户信息。比如：用户A剪辑的用户B的录播视频。
    publish_at: '0', // 资源发布时间
    key_point: '0', // 资源的关键点是什么。画面；声音；文字。
    summary: '0', // 我写的总结。主要是和【Obsidian】那边的笔记联动用的。
    status: 1, // 资源的状态。1=本地有。
    visit_at: 'CURRENT_TIMESTAMP', // 最后一次访问时间
    visit_times: 1, // 访问次数
    create_at: 'CURRENT_TIMESTAMP',
    update_at: 'CURRENT_TIMESTAMP',
};

function selectFileInfo(filename) {
    const sql = `SELECT * FROM \`resource\` where filename = ?`;
    const basename = filename.split('.').slice(0, -1).join('.');
    console.log(sql, basename);

    return new Promise(
        (resolve, reject) => {
            db.get(
                sql,
                [basename],
                (err, row) => {
                    if (err != null) {
                        console.error('queryFileInfo', err.message);
                        reject(err.message);
                    } else {
                        resolve(row);
                    }
                }
            );
        }
    );
}

function insertFileInfo(model) {
    // 排除自增主键id和不需要更新的字段
    const { id, visit_at, visit_times, create_at, update_at, ...insertData } = model;

    // 构造插入语句
    const keys = Object.keys(insertData);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO \`resource\` (${keys.join(', ')}) VALUES (${placeholders})`;

    console.log(sql, insertData);

    return new Promise(
        (resolve, reject) => {
            db.run(
                sql,
                Object.values(insertData),
                function (err) {
                    if (err) {
                        console.error('insertFileInfo', err.message);
                        reject(err.message);
                    } else {
                        resolve({ id: this.lastID });
                    }
                }
            );
        }
    );
}

function updateFileInfo(model) {
    // 排除主键id和不需要更新的字段
    const { id, visit_at, visit_times, create_at, update_at, ...updateData } = model;

    // 构造更新语句
    const keys = Object.keys(updateData);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const sql = `UPDATE \`resource\` SET ${setClause} WHERE id = ?`;

    console.log(sql, updateData, id);

    return new Promise(
        (resolve, reject) => {
            const values = [...Object.values(updateData), id];
            db.run(
                sql,
                values,
                function (err) {
                    if (err) {
                        console.error('updateFileInfo', err.message);
                        reject(err.message);
                    } else {
                        resolve({ changes: this.changes });
                    }
                }
            );
        }
    );
}

// -------------------------------- SQLite --------------------------------

// ---------------- IPC ----------------

// 选择目录
async function nodejsSelectDir(_, options) {
    let returnData = '';
    const result = await dialog.showOpenDialog(
        mainWindow,
        {
            properties: ['openDirectory'],
            ...options
        }
    );
    if (!result.canceled && result.filePaths.length > 0) {
        returnData = result.filePaths[0];
    }
    return returnData;
}

// 扫描目录
async function nodejsScanDir(_, dirPath) {
    const returnData = [];
    try {
        // result，列表，目标目录下的文件和目录
        const result = await fs.readdir(dirPath, { withFileTypes: true });
        for (item of result) {
            // 提取文件扩展名（如果是文件）
            let ext = '';
            if (!item.isDirectory()) {
                const extIndex = item.name.lastIndexOf('.');
                if (extIndex > 0) {
                    ext = item.name.substring(extIndex + 1);
                }
            }
            
            returnData.push({
                name: item.name,
                ext: ext, // 文件扩展名
                path: path.join(dirPath, item.name),
                isDir: item.isDirectory(),
                children: item.isDirectory() ? [] : null,
                childrenIsLoad: false
            });
        }
    } catch (err) {
        console.error('nodejsScanDir', err);
    }
    return returnData;
}

// 查询文件信息
async function nodejsQueryFileInfo(_, filename) {
    let returnData = { ...resourceModel };
    try {
        result = await selectFileInfo(filename);
        console.log('nodejsQueryFileInfo', result);
        if (result != null && result!= undefined) {
            returnData = { ...returnData, ...result };
        }
    } catch (err) {
        console.error('nodejsQueryFileInfo', err);
    }
    return returnData;
}

// 保存文件信息（不存在就插入，存在就修改）
async function nodejsSaveFileInfo(_, model) {
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

// -------------------------------- IPC --------------------------------

app.whenReady().then(() => {
    // IPC
    ipcMain.handle('ipcSelectDir', nodejsSelectDir);
    ipcMain.handle('ipcScanDir', nodejsScanDir);
    ipcMain.handle('ipcQueryFileInfo', nodejsQueryFileInfo);
    ipcMain.handle('ipcSaveFileInfo', nodejsSaveFileInfo);

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