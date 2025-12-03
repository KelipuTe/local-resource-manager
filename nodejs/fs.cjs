const { dialog } = require('electron/main');
const fs = require('fs/promises');
const path = require('path');
const { config } = require('../util/config.cjs');
const { config: dbConfig } = require('../database/config.cjs');

let mainWindow;

/**
 * 【依赖注入】设置主窗口的引用
 */
function fsSetMainWindow(window) {
    mainWindow = window;
}

/**
 * 选择目录
 */
async function fsSelectDir(options) {
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

/** 
 * 扫描目录 
 * @param dirPath 所属目录的路径。
 * @returns 
 * name。目录名或者文件名。
 * extname。文件扩展名。
 * fullPath。目录的全路径或者文件的全路径。
 */
async function fsScanDir(dirPath) {
    // fs.readdir()。返回，目录下的目录和文件列表。
    // 如果是文件的话，提取文件扩展名。

    const returnData = [];
    const result = await fs.readdir(dirPath, { withFileTypes: true });
    for (const item of result) {
        const isDir = item.isDirectory();

        let extname = '';
        if (!isDir) {
            const index = item.name.lastIndexOf('.');
            if (index > 0) {
                extname = item.name.substring(index + 1);
            }
        }

        returnData.push({
            dirPath: dirPath,
            name: item.name,
            isDir: isDir,
            extname: extname,
            fullPath: path.join(dirPath, item.name),
            children: [],
            childrenIsLoad: false,
        });
    }

    return returnData;
}

/**
 * 重命名文件（预览）
 * @param {Object} nodeData 被选中的结点
 * @param {Object} dbMixModel dbResourceAndCreateByModel
 */
async function fsSeeRenameFile(nodeData, dbMixModel) {
    const dirPath = nodeData.dirPath;

    // path.parse().name。获取文件名（不带文件扩展名）。
    const oldBaseName = path.parse(nodeData.name).name;

    const result = await fs.readdir(dirPath);

    // Array.filter()。遍历数组，查找所有文件名和老文件名相同的文件。
    const needRenameFileList = result.filter(item => {
        const baseName = path.parse(item).name;
        return baseName === oldBaseName;
    })

    const returnData = {
        dirPath: dirPath,
        needRenameFileList: needRenameFileList,
    };

    return returnData
}

/**
 * 重命名文件（执行）
 * 重命名规则。资源id_资源index_重命名时间
 */
async function fsDoRenameFile(nodeData, dbMixModel) {
    const dirPath = nodeData.dirPath;
    const newBaseName = dbMixModel.filename;

    const result = await fsSeeRenameFile(nodeData, dbMixModel);
    const needRenameFileList = result.needRenameFileList;

    const renameFileList = [];

    // path.parse().ext。获取文件扩展名（带前面的【.】）。
    // fs.rename()。执行文件重命名。
    for (const item of needRenameFileList) {
        const oldFilename = item;
        const oldFullPath = path.join(dirPath, oldFilename);
        const oldExtname = path.parse(oldFilename).ext;
        const newFilename = newBaseName + oldExtname;
        const newFullPath = path.join(dirPath, newFilename);

        await fs.rename(oldFullPath, newFullPath);

        renameFileList.push({
            oldFilename: oldFilename,
            newFilename: newFilename,
        })
    }

    const returnData = {
        dirPath: dirPath,
        renameFileList: renameFileList,
    };

    return returnData;
}

/**
 * 归档文件（预览）
 * 归档目录规则。根目录\分类目录\资源的发布时间\资源的来源\资源所属用户的id\资源的id\
 */
async function fsSeeMoveFile(nodeData, dbMixModel) {
    const dirPath = nodeData.dirPath
    const baseName = dbMixModel.filename
    const source = dbMixModel.source;
    const userId = dbMixModel.user_id;
    const resourceId = dbMixModel.resource_id;
    const publishAt = dbMixModel.publish_at;
    const keyPoint = dbMixModel.key_point;

    // 分类目录
    if (keyPoint == null || keyPoint == dbConfig.dbTextDefaultValue) {
        throw new Error('缺少【key_point】字段');
    }

    // 扫描需要归档的文件
    const result = await fs.readdir(dirPath);
    const prefixName = baseName.substring(0, baseName.lastIndexOf('_'));
    const needMoveFileList = result.filter(item => {
        const baseName = path.parse(item).name;
        return baseName.startsWith(prefixName);
    })

    // 资源的发布时间
    let year = '0000';
    if (publishAt != null && publishAt != dbConfig.dbTextDefaultValue) {
        year = new Date(publishAt).getFullYear().toString();
    } else {
        year = '0_' + resourceId.substring(0, 4);
    }

    const newDirPath = path.join(config.rootPath, keyPoint, year, source, userId, resourceId);

    const returnData = {
        dirPath: dirPath,
        newDirPath: newDirPath,
        needMoveFileList: needMoveFileList,
    };

    return returnData;
}

/**
 * 归档文件（执行）
 * 归档目录规则。根目录\分类目录\资源的发布时间\资源的来源\资源所属用户的id\资源的id\
 */
async function fsDoMoveFile(nodeData, dbMixModel) {
    const result = await fsSeeMoveFile(nodeData, dbMixModel);

    const dirPath = result.dirPath;
    const newDirPath = result.newDirPath;
    const needMoveFileList = result.needMoveFileList;

    // 创建目录。【recursive: true】表示递归创建。
    await fs.mkdir(newDirPath, { recursive: true });

    const moveFileList = [];
    for (const item of needMoveFileList) {
        const oldFullPath = path.join(dirPath, item);
        const newFullPath = path.join(newDirPath, item);

        await fs.rename(oldFullPath, newFullPath);

        moveFileList.push({
            filename: item,
            oldFullPath: oldFullPath,
            newFullPath: newFullPath,
        });
    }

    const returnData = {
        dirPath: dirPath,
        newDirPath: newDirPath,
        moveFileList: moveFileList
    };

    return returnData;
}

module.exports = {
    fsSetMainWindow,
    fsSelectDir,
    fsScanDir,
    fsSeeRenameFile,
    fsDoRenameFile,
    fsSeeMoveFile,
    fsDoMoveFile,
};