// nodejs 模块
const path = require('path');

// electron 模块
const { app, BrowserWindow } = require('electron/main');

// 第三方模块
const sqlite3 = require('sqlite3').verbose();

// 我写的模块
const utilConfig = require('./util/config.cjs');
const { fsSetMainWindow } = require('./nodejs/fs.cjs');
const { ipcRegisterHandler } = require('./ipcHandler.cjs');

const dbResource = require('./database/resource.cjs');
const dbCreateBy = require('./database/create_by.cjs');
const dbTag = require('./database/tag.cjs');

// 设置字符编码
process.env.CHARSET = 'UTF-8';

// ---------------- 数据库 ----------------

// 打开数据库连接
const dbConn = new sqlite3.Database(utilConfig.dbFullPath, (err) => {
    if (err != null) {
        console.error('sqlite3.Database', err.message);
    }
    console.log('sqlite3.Database', 'open', utilConfig.dbFullPath);
});

dbResource.fnSetDbConn(dbConn);
dbCreateBy.dbSetDbConn(dbConn);
dbTag.dbSetDbConn(dbConn);

// -------------------------------- 数据库 --------------------------------

// ---------------- 主进程 ----------------

let mainWindow;

const createWindow = () => {
    // webSecurity=false。禁用 Web 安全策略。允许渲染进程访问本地文件。比如：图片、视频、音频、等。
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            webSecurity: false
        }
    });

    // 开启调试工具
    mainWindow.webContents.openDevTools();

    // 如果，是使用 Vue3 写前端页面，那么，这里换成加载 Vite 启动的那个地址。
    // mainWindow.loadFile('index.html')
    mainWindow.loadURL('http://localhost:5173');

    fsSetMainWindow(mainWindow);
};

app.whenReady().then(async () => {
    createWindow();

    ipcRegisterHandler();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    // 关闭数据库连接
    dbConn.close((err) => {
        if (err != null) {
            console.error('sqlite3.Database', err.message);
        }
        console.log('sqlite3.Database', 'close', utilConfig.dbFullPath)
    });

    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// -------------------------------- 主进程 --------------------------------