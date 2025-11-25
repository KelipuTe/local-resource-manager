const { ipcMain, dialog } = require('electron/main');
const fs = require('fs/promises');
const path = require('path');
const { dbQueryFileInfo, dbSaveFileInfo } = require('./database/resourceDb.cjs');

let mainWindow;

/** 【依赖注入】设置主窗口的引用 */
function ipcSetMainWindow(window) {
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
        // result，目录下的目录和文件列表
        const result = await fs.readdir(dirPath, { withFileTypes: true });
        console.log('result', result);
        for (item of result) {
            // （如果是文件的话）提取文件扩展名
            let extname = '';
            if (!item.isDirectory()) {
                const index = item.name.lastIndexOf('.');
                if (index > 0) {
                    extname = item.name.substring(index + 1);
                }
            }

            // dirPath。所属目录的路径。
            // name。目录名或者文件名。
            // extname。文件扩展名。
            // fullPath。目录的全路径或者文件的全路径。
            returnData.push({
                dirPath:dirPath, 
                name: item.name, 
                isDir: item.isDirectory(),
                extname: extname, 
                fullPath: path.join(dirPath, item.name), 
                children: item.isDirectory() ? [] : null,
                childrenIsLoad: false,
            });
        }
    } catch (err) {
        console.error('nodejsScanDir', err);
    }
    return returnData;
}

// 查询文件信息
async function nodejsQueryFileInfo(_, filename) {
    return await dbQueryFileInfo(filename);
}

// 保存文件信息（不存在就插入，存在就修改）
async function nodejsSaveFileInfo(_, model) {
    return await dbSaveFileInfo(model);
}

// 添加重命名文件功能
async function nodejsRenameFile(_, fullPath, newBaseName) {
    try {
        console.log('fullPath', fullPath, 'newBaseName', newBaseName);
        // 获取文件所在目录
        const dirPath = path.dirname(fullPath);
        // 获取原文件的基础名（不包含扩展名）
        const oldBaseName = path.parse(path.basename(fullPath)).name;
        
        // 读取目录中的所有文件
        const filesInDir = await fs.readdir(dirPath);
        
        // 查找所有具有相同基础名的文件
        const relatedFiles = filesInDir.filter(file => {
            const parsed = path.parse(file);
            return parsed.name === oldBaseName;
        });
        
        // 检查是否有目标文件名已存在
        const targetFilesExist = relatedFiles.some(file => {
            const parsed = path.parse(file);
            return parsed.name === newBaseName;
        });
        
        if (targetFilesExist) {
            return {
                success: false,
                error: '目标文件名已存在'
            };
        }
        
        // 重命名所有相关文件
        const renamedFiles = [];
        for (const file of relatedFiles) {
            const oldFullPath = path.join(dirPath, file);
            const parsed = path.parse(file);
            const newFileName = newBaseName + (parsed.ext || '');
            const newFullPath = path.join(dirPath, newFileName);
            
            await fs.rename(oldFullPath, newFullPath);
            
            renamedFiles.push({
                oldName: file,
                newName: newFileName,
                oldFullPath: oldFullPath,
                newFullPath: newFullPath
            });
        }
        
        // 返回结果信息
        return {
            success: true,
            renamedFiles: renamedFiles,
            newBaseName: newBaseName,
            count: renamedFiles.length
        };
    } catch (error) {
        console.error('重命名文件失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// 添加归档文件功能
async function nodejsArchiveFile(_, fullPath, fileInfo) {
    try {
        console.log('fullPath', fullPath, 'fileInfo', fileInfo);
        
        // 获取根目录路径（与当前文件同级）
        const rootDir = path.dirname(fullPath);
        
        // 检查关键点字段
        const keyPoint = fileInfo.key_point;
        if (!keyPoint) {
            return {
                success: false,
                error: '未设置关键点字段'
            };
        }
        
        // 根据关键点确定目录映射
        const keyPointDirMap = {
            '画面': '画面是重点的资源',
            '声音': '声音是重点的资源',
            '文字': '文字是重点的资源'
        };
        
        const keyPointDirName = keyPointDirMap[keyPoint];
        if (!keyPointDirName) {
            return {
                success: false,
                error: '关键点字段值无效'
            };
        }
        
        // 构建目标目录路径
        const targetDirPath = path.join(rootDir, keyPointDirName);
        
        // 创建资源ID目录
        const resourceId = fileInfo.resource_id || '0';
        const userId = fileInfo.user_id || '0';
        const source = fileInfo.source || '0';
        
        // 提取发布日期的年月日部分
        let publishDate = '00000000';
        if (fileInfo.publish_at && fileInfo.publish_at !== '0') {
            try {
                const date = new Date(fileInfo.publish_at);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                publishDate = `${year}${month}${day}`;
            } catch (e) {
                console.error('解析发布日期出错:', e);
            }
        }
        
        const archiveDirName = `${resourceId}_${userId}_${source}_${publishDate}`;
        const finalDirPath = path.join(targetDirPath, archiveDirName);
        
        // 确保目标目录存在
        await fs.mkdir(finalDirPath, { recursive: true });
        
        // 获取文件所在目录
        const fileDir = path.dirname(fullPath);
        
        // 获取原文件的基础名（不包含扩展名）
        const baseName = path.parse(path.basename(fullPath)).name;
        
        // 读取目录中的所有文件
        const filesInDir = await fs.readdir(fileDir);
        
        // 查找所有具有相同基础名的文件
        const relatedFiles = filesInDir.filter(file => {
            const parsed = path.parse(file);
            return parsed.name === baseName;
        });
        
        // 移动所有相关文件到归档目录
        const movedFiles = [];
        for (const file of relatedFiles) {
            const oldFullPath = path.join(fileDir, file);
            const newFullPath = path.join(finalDirPath, file);
            
            // 检查目标文件是否已存在
            try {
                await fs.access(newFullPath);
                // 如果存在，添加序号
                const parsed = path.parse(file);
                const newName = `${parsed.name}_copy${parsed.ext}`;
                const newFullPathWithCopy = path.join(finalDirPath, newName);
                await fs.rename(oldFullPath, newFullPathWithCopy);
                
                movedFiles.push({
                    oldName: file,
                    newName: newName,
                    oldFullPath: oldFullPath,
                    newFullPath: newFullPathWithCopy
                });
            } catch (accessError) {
                // 文件不存在，可以直接移动
                await fs.rename(oldFullPath, newFullPath);
                
                movedFiles.push({
                    oldName: file,
                    newName: file,
                    oldFullPath: oldFullPath,
                    newFullPath: newFullPath
                });
            }
        }
        
        // 返回结果信息
        return {
            success: true,
            movedFiles: movedFiles,
            archivePath: finalDirPath,
            count: movedFiles.length
        };
    } catch (error) {
        console.error('归档文件失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/** 【IPC】注册处理函数 */
function ipcRegisterHandler() {
    ipcMain.handle('ipcSelectDir', nodejsSelectDir);
    ipcMain.handle('ipcScanDir', nodejsScanDir);

    ipcMain.handle('ipcQueryFileInfo', nodejsQueryFileInfo);
    ipcMain.handle('ipcSaveFileInfo', nodejsSaveFileInfo);

    ipcMain.handle('ipcRenameFile', nodejsRenameFile);
    ipcMain.handle('ipcArchiveFile', nodejsArchiveFile);
}

module.exports = {
    ipcSetMainWindow,
    ipcRegisterHandler
};