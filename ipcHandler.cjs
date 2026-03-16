const { ipcMain } = require('electron/main');

const dbResource = require('./database/resource.cjs');
const dbCreateBy = require('./database/create_by.cjs');
const dbTag = require('./database/tag.cjs');

const nodejsFs = require('./nodejs/fs.cjs');

const validate = require('./util/validate.cjs');

/**
 * 注册 IPC 对应的处理函数
 */
function ipcRegisterHandler() {
    // nodejsFs
    ipcMain.handle('ipcSelectDir', async function (_, options) {
        return await nodejsFs.fsSelectDir(options);
    });
    ipcMain.handle('ipcScanDir', async function (_, dirPath) {
        return await nodejsFs.fsScanDir(dirPath);
    });

    ipcMain.handle('ipcSeeRenameFile', async function (_, nodeData, dbModel) {
        return await nodejsFs.fsSeeRenameFile(nodeData, dbModel);
    });
    ipcMain.handle('ipcDoRenameFile', async function (_, nodeData, dbModel) {
        return await nodejsFs.fsDoRenameFile(nodeData, dbModel);
    });
    ipcMain.handle('ipcSeeMoveFile', async function (_, nodeData, dbModel) {
        return await nodejsFs.fsSeeMoveFile(nodeData, dbModel);
    });
    ipcMain.handle('ipcDoMoveFile', async function (_, nodeData, dbModel) {
        return await nodejsFs.fsDoMoveFile(nodeData, dbModel);
    });

    ipcMain.handle('ipcAnalyzeBilibili', async function (_, nodeData) {
        return await nodejsFs.fsAnalyzeBilibili(nodeData);
    });

    ipcMain.handle('ipcOpenLocalFolder', async function (_, nodeData) {
        return await nodejsFs.fsOpenLocalFolder(nodeData);
    });

    // dbResource
    ipcMain.handle('ipcGetResourceInfo', async function (_, dbModel) {
        return await dbResource.fnQueryByFilename(dbModel);
    });
    ipcMain.handle('ipcGetResourceInfoV2', async function (_, dbModel) {
        return await dbResource.fnQueryBySourceAndId(dbModel);
    });
    ipcMain.handle('ipcSaveResourceInfo', async function (_, dbModel) {
        dbModel = validate.inputProcess(dbModel)
        return await dbResource.fnSaveModel(dbModel);
    });
    ipcMain.handle('ipcFuzzyQueryResourceByFilename', async function (_, queryArgObj) {
        return await dbResource.fnFuzzyQueryByFilename(queryArgObj);
    });

    // dbCreateBy
    ipcMain.handle('ipcGetCreateByInfo', async function (_, dbModel) {
        return await dbCreateBy.dbCreateByQuery(dbModel);
    });
    ipcMain.handle('ipcSaveCreateByInfo', async function (_, dbModel) {
        dbModel = validate.inputProcess(dbModel)
        return await dbCreateBy.dbCreateBySave(dbModel);
    });

    // dbTag
    ipcMain.handle('ipcGetAllTag', async function () {
        return await dbTag.dbTagQueryAll();
    });
    ipcMain.handle('ipcCreateTag', async function (_, dbModel) {
        dbModel = validate.inputProcess(dbModel)
        return await dbTag.dbTagCreate(dbModel);
    });
    ipcMain.handle('ipcGetResourceTag', async function (_, resourceId) {
        return await dbTag.dbResourceTagQuery(resourceId);
    });
    ipcMain.handle('ipcSaveResourceTag', async function (_, resourceId, tagIdList) {
        return await dbTag.dbResourceTagSave(resourceId, tagIdList);
    });
}

module.exports = {
    ipcRegisterHandler
};