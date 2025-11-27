const { dialog } = require('electron/main');
const fs = require('fs/promises');
const path = require('path');

let mainWindow;

/** 【依赖注入】设置主窗口的引用 */
function fsSetMainWindow(window) {
    mainWindow = window;
}

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
 * dirPath。所属目录的路径。
 * name。目录名或者文件名。
 * extname。文件扩展名。
 * fullPath。目录的全路径或者文件的全路径。
 */
async function fsScanDir(dirPath) {
    // fs.readdir()。返回，目录下的目录和文件列表。
    // 如果是文件的话，提取文件扩展名。

    const returnData = [];
    const result = await fs.readdir(dirPath, { withFileTypes: true });
    for (item of result) {
        let extname = '';
        if (!item.isDirectory()) {
            const index = item.name.lastIndexOf('.');
            if (index > 0) {
                extname = item.name.substring(index + 1);
            }
        }
        returnData.push({
            dirPath: dirPath,
            name: item.name,
            isDir: item.isDirectory(),
            extname: extname,
            fullPath: path.join(dirPath, item.name),
            children: item.isDirectory() ? [] : null,
            childrenIsLoad: false,
        });
    }
    return returnData;
}

async function fsSeeRenameFile(beSelectNode, fileInfo) {
    // path.parse().name。获取文件名（不带文件扩展名）。
    // Array.filter()。遍历数组，查找所有文件名和老文件名相同的文件。
    // Array.some()。遍历数组，检查是否有文件名和新文件名相同的文件。
    // 最后检查一下，目录下存不存在文件名和重命名相同的文件。

    const dirPath = beSelectNode.dirPath;
    const oldBaseName = path.parse(beSelectNode.name).name;

    const result = await fs.readdir(dirPath);

    const needRenameFileList = result.filter(item => {
        const baseName = path.parse(item).name;
        return baseName === oldBaseName;
    })

    const newBaseName = fileInfo.filename;
    const IsNewBaseNameExist = result.some(item => {
        const baseName = path.parse(item).name;
        return baseName === newBaseName;
    })

    if (IsNewBaseNameExist) {
        throw new Error('目录下存在重命名后文件名相同的文件')
    }

    const returnData = {
        dirPath: dirPath,
        needRenameFileList: needRenameFileList,
    };

    return returnData
}

async function fsDoRenameFile(beSelectNode, fileInfo) {
    // path.parse().ext。获取文件扩展名（带前面的【.】）。
    // fs.rename()。执行文件重命名。

    const dirPath = beSelectNode.dirPath;

    const result = await fsSeeRenameFile(beSelectNode, fileInfo);
    const needRenameFileList = result.needRenameFileList;

    const newBaseName = fileInfo.filename;

    const renameFileList = [];

    for (item of needRenameFileList) {
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

const rootDirPath = 'D:\\不知道什么时候会有用的仓库\\比较大的资源放外面';

const keyPointDirMap = {
    '画面': '画面是重点的资源',
    '声音': '声音是重点的资源',
    '文字': '文字是重点的资源'
};

async function fsSeeMoveFile(beSelectNode, fileInfo) {
    // baseName。发布日期_资源来源_用户id_资源id_资源index
    // prefixName。发布日期_资源来源_用户id_资源id

    const keyPoint = fileInfo.key_point;
    if (keyPointDirMap[keyPoint] == null) {
        throw new Error(`【${keyPoint}】没有设置对应的归档目录`);
    }

    const dirPath = beSelectNode.dirPath

    const baseName = fileInfo.filename
    const prefixName = baseName.substring(0, baseName.lastIndexOf('_'));

    const dirPathResult = await fs.readdir(dirPath);

    const needMoveFileList = dirPathResult.filter(item => {
        const baseName = path.parse(item).name;
        return baseName.startsWith(prefixName);
    })

    const keyPointDir = keyPointDirMap[keyPoint];
    const newDirPath = path.join(rootDirPath, keyPointDir, prefixName);

    await fs.mkdir(newDirPath, { recursive: true });

    const newDirPathResult = await fs.readdir(newDirPath);

    let IsNewDirFileExist = false
    for (itemMoveFilename of needMoveFileList) {
        IsNewDirFileExist = newDirPathResult.some(itemNewDirFile => {
            const newDirFilename = path.parse(itemNewDirFile).name;
            return newDirFilename === itemMoveFilename;
        })
        if (IsNewDirFileExist) {
            break;
        }
    }

    if (IsNewDirFileExist) {
        throw new Error('目标目录下存在归档后文件名相同的文件')
    }

    const returnData = {
        dirPath: dirPath,
        newDirPath: newDirPath,
        needMoveFileList: needMoveFileList,
    };

    return returnData;
}

async function fsDoMoveFile(beSelectNode, fileInfo) {
    const result = await fsSeeMoveFile(beSelectNode, fileInfo);
    const needMoveFileList = result.needMoveFileList;

    const dirPath = result.dirPath;
    const newDirPath = result.newDirPath;

    const moveFileList = [];

    for (const filename of needMoveFileList) {
        const oldFilePath = path.join(dirPath, filename);
        let newFilePath = path.join(newDirPath, filename);

        // 检查目标文件是否已存在
        try {
            await fs.access(newFilePath);
            // 文件存在，需要重命名
            const fileStat = await fs.stat(newFilePath);
            console.log(fileStat)
            const mtime = fileStat.mtime;
            // 修改日期格式，添加时分秒信息，拆分成日期和时间两部分
            const datePart = mtime.toISOString().slice(0, 10).replace(/-/g, '');
            const timePart = mtime.toISOString().slice(11, 19).replace(/:/g, '');
            
            const parsedPath = path.parse(filename);
            const newFilename = `${parsedPath.name}_${datePart}${timePart}${parsedPath.ext}`;
            newFilePath = path.join(newDirPath, newFilename);
            
            await fs.rename(oldFilePath, newFilePath);
            moveFileList.push({
                oldFilePath: oldFilePath,
                newFilePath: newFilePath,
                oldFilename: filename,
                newFilename: newFilename
            });
        } catch (err) {
            // 文件不存在，直接移动
            await fs.rename(oldFilePath, newFilePath);
            moveFileList.push({
                oldFilePath: oldFilePath,
                newFilePath: newFilePath,
                oldFilename: filename,
                newFilename: filename
            });
        }
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