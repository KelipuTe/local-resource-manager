const fs = require('fs/promises');
const path = require('path');

/**
 * 把一层目录
 * D:\我的仓库_03\资源\{类别}\{年份}\资源的来源_资源所属用户的id_资源的id\{资源文件}
 * 拆分为三层目录
 * D:\我的仓库_03\资源\{类别}\{年份}\资源的来源\资源所属用户的id\资源的id\{资源文件}
 */

async function fsSplitDir() {
    const rootDirPath = 'D:\\我的仓库_03\\资源\\';

    // 递归遍历目录
    // async function traverseDir(currentPath, depth = 0) {
    //     const items = await fs.readdir(currentPath, { withFileTypes: true });

    //     for (const item of items) {
    //         if (!item.isDirectory()) continue;

    //         const itemPath = path.join(currentPath, item.name);

    //         // 只处理第三级目录（depth为2）
    //         if (depth === 2) {
    //             // 检查目录名是否符合 x_y_z 格式
    //             const parts = item.name.split('_');
    //             if (parts.length === 3) {
    //                 const [first, second, third] = parts;
    //                 const newDirPath = path.join(currentPath, first, second, third);

    //                 // 创建新的三层目录结构
    //                 await fs.mkdir(newDirPath, { recursive: true });

    //                 // 获取原目录下的所有文件
    //                 const files = await fs.readdir(itemPath);

    //                 // 移动所有文件到新目录
    //                 const movedFiles = [];
    //                 for (const file of files) {
    //                     const oldFilePath = path.join(itemPath, file);
    //                     const newFilePath = path.join(newDirPath, file);

    //                     await fs.rename(oldFilePath, newFilePath);
    //                     movedFiles.push(file);
    //                 }

    //                 // 删除空的原目录
    //                 // await fs.rmdir(itemPath);

    //                 console.log(`目录 ${itemPath} 已拆分为 ${newDirPath}，移动了 ${movedFiles.length} 个文件`);
    //             }
    //         } else {
    //             // 继续递归遍历子目录
    //             await traverseDir(itemPath, depth + 1);
    //         }
    //     }
    // }

    // 开始遍历根目录
    // await traverseDir(rootDirPath);

    const returnData = {
        message: '目录拆分完成'
    };

    return returnData;
}

const result = fsSplitDir();
result.then((result) => {
    console.log(result);
}).catch((error) => {
    console.error(error);
});
