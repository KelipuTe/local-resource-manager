const { ipcMain } = require('electron/main');
const path = require('path');
const { dbQueryFileInfo, dbSaveFileInfo } = require('./database/resourceDb.cjs');
const {
    fsSelectDir,
    fsScanDir,
    fsSeeRenameFile,
    fsDoRenameFile,
    fsSeeMoveFile,
    fsDoMoveFile,
} = require('./nodejs/fs.cjs');

/** 选择目录 */
async function ipcSelectDir(_, options) {
    return await fsSelectDir(options);
}

/** 扫描目录 */
async function ipcScanDir(_, dirPath) {
    return await fsScanDir(dirPath);
}

/** 查询文件信息 */
async function ipcQueryFileInfo(_, filename) {
    return await dbQueryFileInfo(filename);
}

/** 保存文件信息（不存在就插入，存在就修改） */
async function ipcSaveFileInfo(_, model) {
    return await dbSaveFileInfo(model);
}

/** 重命名文件预览 */
async function ipcSeeRenameFile(_, beSelectNode, fileInfo) {
    return await fsSeeRenameFile(beSelectNode, fileInfo);
}

/** 重命名文件执行 */
async function ipcDoRenameFile(_, beSelectNode, fileInfo) {
    return await fsDoRenameFile(beSelectNode, fileInfo);
}

/** 文件归档预览 */
async function ipcSeeMoveFile(_, beSelectNode, fileInfo) {
    return await fsSeeMoveFile(beSelectNode, fileInfo);
}

/** 文件归档执行 */
async function ipcDoMoveFile(_, beSelectNode, fileInfo) {
    return await fsDoMoveFile(beSelectNode, fileInfo);
}

/** 【IPC】注册处理函数 */
function ipcRegisterHandler() {
    ipcMain.handle('ipcSelectDir', ipcSelectDir);
    ipcMain.handle('ipcScanDir', ipcScanDir);

    ipcMain.handle('ipcQueryFileInfo', ipcQueryFileInfo);
    ipcMain.handle('ipcSaveFileInfo', ipcSaveFileInfo);

    ipcMain.handle('ipcSeeRenameFile', ipcSeeRenameFile);
    ipcMain.handle('ipcDoRenameFile', ipcDoRenameFile);
    ipcMain.handle('ipcSeeMoveFile', ipcSeeMoveFile);
    ipcMain.handle('ipcDoMoveFile', ipcDoMoveFile);
}

module.exports = {
    ipcRegisterHandler
};