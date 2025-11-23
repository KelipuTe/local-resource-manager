const { ipcMain, dialog } = require('electron/main');
const fs = require('fs/promises');
const path = require('path');
const { queryFileInfo, saveFileInfo } = require('./database/resourceDb.cjs');

let mainWindow;

function setMainWindow(window) {
    mainWindow = window;
}

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
    return await queryFileInfo(filename);
}

// 保存文件信息（不存在就插入，存在就修改）
async function nodejsSaveFileInfo(_, model) {
    return await saveFileInfo(model);
}

function registerIpcHandler() {
    ipcMain.handle('ipcSelectDir', nodejsSelectDir);
    ipcMain.handle('ipcScanDir', nodejsScanDir);
    ipcMain.handle('ipcQueryFileInfo', nodejsQueryFileInfo);
    ipcMain.handle('ipcSaveFileInfo', nodejsSaveFileInfo);
}

module.exports = {
    setMainWindow,
    registerIpcHandler
};