const { ipcMain } = require('electron/main');

const { inputProcess } = require('./util/validate.cjs');

const {
    fsSelectDir,
    fsScanDir,
    fsSeeRenameFile,
    fsDoRenameFile,
    fsSeeMoveFile,
    fsDoMoveFile,
} = require('./nodejs/fs.cjs');

async function ipcSelectDir(_, options) {
    return await fsSelectDir(options);
}

async function ipcScanDir(_, dirPath) {
    return await fsScanDir(dirPath);
}

async function ipcSeeRenameFile(_, nodeData, dbModel) {
    return await fsSeeRenameFile(nodeData, dbModel);
}

async function ipcDoRenameFile(_, nodeData, dbModel) {
    return await fsDoRenameFile(nodeData, dbModel);
}

async function ipcSeeMoveFile(_, nodeData, dbModel) {
    return await fsSeeMoveFile(nodeData, dbModel);
}

async function ipcDoMoveFile(_, nodeData, dbModel) {
    return await fsDoMoveFile(nodeData, dbModel);
}

const {
    dbResourceQuery,
    dbResourceQueryV2,
    dbResourceSave
} = require('./database/resource.cjs');

async function ipcGetResourceInfo(_, dbModel) {
    return await dbResourceQuery(dbModel);
}

async function ipcGetResourceInfoV2(_, dbModel) {
    return await dbResourceQueryV2(dbModel);
}

async function ipcSaveResourceInfo(_, dbModel) {
    dbModel = inputProcess(dbModel)
    return await dbResourceSave(dbModel);
}

const {
    dbCreateByQuery,
    dbCreateBySave
} = require('./database/create_by.cjs');

async function ipcGetCreateByInfo(_, dbModel) {
    return await dbCreateByQuery(dbModel);
}

async function ipcSaveCreateByInfo(_, dbModel) {
    dbModel = inputProcess(dbModel)
    return await dbCreateBySave(dbModel);
}

const {
    dbTagQueryAll,
    dbTagCreate,
    dbResourceTagQuery,
    dbResourceTagSave
} = require('./database/tag.cjs');

async function ipcGetAllTag() {
    return await dbTagQueryAll();
}

async function ipcCreateTag(_, dbModel) {
    dbModel = inputProcess(dbModel)
    return await dbTagCreate(dbModel);
}

async function ipcGetResourceTag(_, resourceId) {
    return await dbResourceTagQuery(resourceId);
}

async function ipcSaveResourceTag(_, resourceId, tagIdList) {
    return await dbResourceTagSave(resourceId, tagIdList);
}

/**
 * 【IPC】注册处理函数
 */
function ipcRegisterHandler() {
    ipcMain.handle('ipcSelectDir', ipcSelectDir);
    ipcMain.handle('ipcScanDir', ipcScanDir);

    ipcMain.handle('ipcSeeRenameFile', ipcSeeRenameFile);
    ipcMain.handle('ipcDoRenameFile', ipcDoRenameFile);
    ipcMain.handle('ipcSeeMoveFile', ipcSeeMoveFile);
    ipcMain.handle('ipcDoMoveFile', ipcDoMoveFile);

    ipcMain.handle('ipcGetResourceInfo', ipcGetResourceInfo);
    ipcMain.handle('ipcGetResourceInfoV2', ipcGetResourceInfoV2);
    ipcMain.handle('ipcSaveResourceInfo', ipcSaveResourceInfo);

    ipcMain.handle('ipcGetCreateByInfo', ipcGetCreateByInfo);
    ipcMain.handle('ipcSaveCreateByInfo', ipcSaveCreateByInfo);

    ipcMain.handle('ipcGetAllTag', ipcGetAllTag);
    ipcMain.handle('ipcCreateTag', ipcCreateTag);
    ipcMain.handle('ipcGetResourceTag', ipcGetResourceTag);
    ipcMain.handle('ipcSaveResourceTag', ipcSaveResourceTag);
}

module.exports = {
    ipcRegisterHandler
};