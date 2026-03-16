const fs = require('fs/promises');
const path = require('path');
const child_process = require('child_process');

const { dialog } = require('electron/main');

const xml2js = require('xml2js');

const dbConfig = require('../database/config.cjs');

const utilConfig = require('../util/config.cjs');
const utilLog = require('../util/log.cjs');

let mainWindow;

/**
 * 【依赖注入】。设置主窗口的引用。
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
 * @param dirPath 所属目录的路径
 * @returns 
 * name 目录名或者文件名
 * extname 文件扩展名
 * fullPath 目录的全路径或者文件的全路径
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
 * @param nodeData 被选中的结点
 * @param dbModel dbResourceModelDefault
 */
async function fsSeeRenameFile(nodeData, dbModel) {
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
 * @param nodeData 被选中的结点
 * @param dbModel dbResourceModelDefault
 * 重命名规则。{资源 id}_{资源 index}_重命名时间
 */
async function fsDoRenameFile(nodeData, dbModel) {
    const dirPath = nodeData.dirPath;
    const newBaseName = dbModel.filename;

    const result = await fsSeeRenameFile(nodeData, dbModel);
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
 * @param nodeData 被选中的结点
 * @param dbModel dbResourceModelDefault
 * 归档目录规则。根目录\分类目录\资源的发布时间\资源的来源\{资源所属用户的 id}\{资源的 id}\
 */
async function fsSeeMoveFile(nodeData, dbModel) {
    const dirPath = nodeData.dirPath
    const baseName = dbModel.filename
    const source = dbModel.source;
    const userId = dbModel.userId;
    const resourceId = dbModel.resourceId;
    const publishAt = dbModel.publishAt;
    const keyPoint = dbModel.keyPoint;

    // 分类目录
    if (keyPoint == null || keyPoint == dbConfig.textValueDefault) {
        throw new Error('缺少 key_point 字段');
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
    if (publishAt != null && publishAt != dbConfig.textValueDefault) {
        year = new Date(publishAt).getFullYear().toString();
    } else {
        year = '0_' + resourceId.substring(0, 4);
    }

    const newDirPath = path.join(utilConfig.rootPath, keyPoint, year, source, userId, resourceId);

    const returnData = {
        dirPath: dirPath,
        newDirPath: newDirPath,
        needMoveFileList: needMoveFileList,
    };

    return returnData;
}

/**
 * 归档文件（执行）
 * @param nodeData 被选中的结点
 * @param dbModel dbResourceModelDefault
 * 归档目录规则。根目录\分类目录\资源的发布时间\资源的来源\{资源所属用户的 id}\{资源的 id}\
 */
async function fsDoMoveFile(nodeData, dbModel) {
    const result = await fsSeeMoveFile(nodeData, dbModel);

    const dirPath = result.dirPath;
    const newDirPath = result.newDirPath;
    const needMoveFileList = result.needMoveFileList;

    // 创建目录。recursive: true。表示，递归创建。
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

/**
 * 从 Bilibili 视频的元数据中获取视频的信息
 * @param nodeData 被选中的结点
 */
async function fsAnalyzeBilibili(nodeData) {
    const dirPath = nodeData.dirPath;
    const name = nodeData.name;

    const baseName = path.parse(name).name;
    const nfoFilePath = path.join(dirPath, `${baseName}.nfo`);

    const xmlData = await fs.readFile(nfoFilePath, 'utf-8');

    const returnData = {};
    xml2js.parseString(xmlData, (err, result) => {
        if (err != null) {
            throw new Error(`【失败】。解析 XML 失败。报错：【${err}】。`);
        }
        returnData.parsedXml = result;
    });

    return returnData;
}

/**
 * 打开被选中的结点对应的本地文件夹
 * @param nodeData 被选中的结点
 */
async function fsOpenLocalFolder(nodeData) {
    const dirPath = nodeData.dirPath;

    // 不同的操作系统，执行命令的方式不同
    let command;
    switch (process.platform) {
        case 'win32':
            command = `explorer "${dirPath}"`;
            break;
        default:
            throw new Error('调用操作系统失败');
    }

    // child_process.exec() 是异步调用
    child_process.exec(command, (err) => {
        if (err != null) {
            utilLog.fnLogErrLog(err);
        }
    });
}

module.exports = {
    fsSetMainWindow,
    fsSelectDir,
    fsScanDir,
    fsSeeRenameFile,
    fsDoRenameFile,
    fsSeeMoveFile,
    fsDoMoveFile,
    fsAnalyzeBilibili,
    fsOpenLocalFolder,
};