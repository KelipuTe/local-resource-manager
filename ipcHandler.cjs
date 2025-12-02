const { ipcMain } = require('electron/main');

const {
    fsSelectDir,
    fsScanDir,
    fsSeeRenameFile,
    fsDoRenameFile,
    fsSeeMoveFile,
    fsDoMoveFile,
} = require('./nodejs/fs.cjs');

const {
    dbResourceQuery,
    dbResourceQueryV2,
    dbResourceSave
} = require('./database/resource.cjs');

async function ipcSelectDir(_, options) {
    return await fsSelectDir(options);
}

async function ipcScanDir(_, dirPath) {
    return await fsScanDir(dirPath);
}

async function ipcQueryResource(_, dbModel) {
    return await dbResourceQuery(dbModel);
}

async function ipcQueryResourceInfoV2(_, dbModel) {
    return await dbResourceQueryV2(dbModel);
}

async function ipcSaveResourceInfo(_, dbMixModel) {
    return await dbResourceSave(dbMixModel);
}

async function ipcSeeRenameFile(_, nodeData, dbMixModel) {
    return await fsSeeRenameFile(nodeData, dbMixModel);
}

async function ipcDoRenameFile(_, nodeData, dbMixModel) {
    return await fsDoRenameFile(nodeData, dbMixModel);
}

async function ipcSeeMoveFile(_, nodeData, dbMixModel) {
    return await fsSeeMoveFile(nodeData, dbMixModel);
}

async function ipcDoMoveFile(_, nodeData, dbMixModel) {
    return await fsDoMoveFile(nodeData, dbMixModel);
}

/**
 * 【IPC】注册处理函数
 */
function ipcRegisterHandler() {
    ipcMain.handle('ipcSelectDir', ipcSelectDir);
    ipcMain.handle('ipcScanDir', ipcScanDir);

    ipcMain.handle('ipcQueryResourceInfo', ipcQueryResource);
    ipcMain.handle('ipcQueryResourceInfoV2', ipcQueryResourceInfoV2);
    ipcMain.handle('ipcSaveResourceInfo', ipcSaveResourceInfo);

    ipcMain.handle('ipcSeeRenameFile', ipcSeeRenameFile);
    ipcMain.handle('ipcDoRenameFile', ipcDoRenameFile);
    ipcMain.handle('ipcSeeMoveFile', ipcSeeMoveFile);
    ipcMain.handle('ipcDoMoveFile', ipcDoMoveFile);
}

module.exports = {
    ipcRegisterHandler
};