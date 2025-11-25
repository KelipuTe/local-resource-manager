const { app, BrowserWindow } = require('electron/main');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { dbSetDbConn: dbSetDbConnResource } = require('./database/resourceDb.cjs');
const { ipcSetMainWindow, ipcRegisterHandler } = require('./ipcHandler.cjs');

let dbPath = 'D:\\不知道什么时候会有用的仓库\\比较大的资源放外面\\resource.db';

// 打开数据库连接
const dbConn = new sqlite3.Database(dbPath, (err) => {
    if (err != null) {
        console.error('sqlite3.Database', err.message);
    }
    console.log('sqlite3.Database', 'open', dbPath);
});

dbSetDbConnResource(dbConn);

let mainWindow;

const createWindow = () => {
    // webSecurity=false。禁用【Web安全策略】。允许渲染进程访问本地文件。比如：图片、视频、音频、等。
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

    // 如果，是使用【Vue3】写前端页面，那么，这里换成加载【Vite】启动的那个地址。
    // mainWindow.loadFile('index.html')
    mainWindow.loadURL('http://localhost:5173');

    ipcSetMainWindow(mainWindow);
};

app.whenReady().then(() => {
    createWindow();

    ipcRegisterHandler();

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
        // 关闭数据库连接
        dbConn.close((err) => {
            if (err != null) {
                console.error('sqlite3.Database', err.message);
            }
            console.log('sqlite3.Database', 'close', dbPath)
        });

        if (process.platform !== 'darwin') {
            app.quit();
        }
    }
);