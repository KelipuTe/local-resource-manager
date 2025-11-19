const { app, BrowserWindow } = require('electron/main')
const { ipcMain, dialog } = require('electron/main')
const fs = require('fs/promises')
const path = require('path')

let mainWindow;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        }
    })
    mainWindow.webContents.openDevTools() // 开启调试工具
    mainWindow.loadURL('http://localhost:5173')
}

// ---------------- IPC ----------------

// 选择目录
async function nodejsSelectDir(_, options) {
    const result = await dialog.showOpenDialog(
        mainWindow,
        {
            properties: ['openDirectory'],
            ...options
        }
    )
    console.log('nodejsSelectDir result:', result)
    if (result.canceled || result.filePaths.length < 1) {
        return '';
    }
    return result.filePaths[0];
}

// 扫描目标目录
async function nodejsScanDir(event, dirPath) {
    const retData = []
    try {
        // result，列表，目标目录下的文件和目录
        const result = await fs.readdir(dirPath, { withFileTypes: true })
        for (item of result) {
            retData.push({
                name: item.name,
                path: path.join(dirPath, item.name),
                isDir: item.isDirectory(),
                children: item.isDirectory() ? [] : null,
                childrenIsLoad: false
            })
        }
    } catch (err) {
        console.error('ipcScanDir Error:', err)
    }
    return retData
}

// -------------------------------- IPC --------------------------------

app.whenReady().then(() => {
    ipcMain.handle('ipcSelectDir', nodejsSelectDir)
    ipcMain.handle('ipcScanDir', nodejsScanDir)

    createWindow()

    app.on(
        'activate',
        () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow()
            }
        }
    )
})

app.on(
    'window-all-closed',
    () => {
        if (process.platform !== 'darwin') {
            app.quit()
        }
    }
)
