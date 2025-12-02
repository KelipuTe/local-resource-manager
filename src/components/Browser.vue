<template>
    <div>
        <div>浏览</div>
        <div>
            <div style="display: flex; max-height: 80vh; overflow: hidden;">
                <!-- 左侧，文件树，固定宽度 -->
                <div style="width: 600px; overflow-x: auto; flex-shrink: 0;">
                    <p>
                        <span>选择的目录：{{ rootPath }}</span>
                        <button @click="vueScanRootPath">扫描目录</button>
                    </p>
                    <div v-show="rootPathIsScan">
                        <FileTreeNode :treeNodeData="rootNodeData" :level="0" @node-selected="vueTreeNodeBeSelect" />
                    </div>
                </div>
                <!-- 右侧，详细信息，动态宽度 -->
                <div v-if="beSelectNode"
                    style="flex: 1; padding: 10px; border: 1px solid #ccc; min-width: 900px; overflow: auto;">
                    <div>
                        <h3>选中的节点信息</h3>
                        <p><strong>所属目录的路径:</strong> {{ beSelectNode.dirPath }}</p>
                        <p><strong>目录名或者文件名:</strong> {{ beSelectNode.name }}</p>
                        <p><strong>目录的全路径或者文件的全路径:</strong> {{ beSelectNode.fullPath }}</p>
                    </div>
                    <div v-if="isCanPreviewFile(beSelectNode)" style="margin-bottom: 20px;">
                        <h3>预览区域</h3>
                        <div style="max-width: 100%; max-height: 420px; overflow: auto;">
                            <!-- 图片预览 -->
                            <img v-if="isImageFile(beSelectNode)" :src="'file://' + beSelectNode.fullPath" alt="预览图片"
                                style="max-width: 100%; max-height: 400px;" />
                            <!-- 视频预览 -->
                            <video v-else-if="isVideoFile(beSelectNode)" :src="'file://' + beSelectNode.fullPath"
                                controls style="max-width: 100%; max-height: 400px;">
                                您的浏览器不支持视频播放。
                            </video>
                        </div>
                    </div>
                    <div>
                        <h3>操作区域</h3>
                        <p>
                            <button @click="vueQueryResourceInfo" style="margin-top: 10px;">查询（文件名）</button>
                            <button @click="vueQueryResourceInfoV2" style="margin-top: 10px;">查询（信息）</button>
                            <button @click="vueSaveResourceInfo" style="margin-top: 10px;">保存</button>
                        </p>
                        <p>
                            <button @click="vueSeeRenameFile"
                                style="margin-top: 10px; margin-left: 10px;">重命名（预览）</button>
                            <button @click="vueDoRenameFile"
                                style="margin-top: 10px; margin-left: 10px;">重命名（执行）</button>
                            <button @click="vueSeeMoveFile" style="margin-top: 10px; margin-left: 10px;">归档（预览）</button>
                            <button @click="vueDoMoveFile" style="margin-top: 10px; margin-left: 10px;">归档（执行）</button>
                        </p>
                        <div v-if="operateResult" 
                            :style="{ color: operateResult.isSuccess ? 'green' : 'red', marginTop: '10px' }">
                            <div v-html="operateResult.message"></div>
                        </div>
                    </div>
                    <div>
                        <h3>数据库中的信息</h3>
                        <div v-for="(value, key) in fileInfo" :key="key" style="margin-bottom: 10px;">
                            <label><strong>{{ vueGetFileInfoKeyName(key) }}:</strong></label>
                            <!-- filename 字段 -->
                            <div v-if="key === 'filename'" style="display: flex; align-items: center;">
                                <input :value="value" type="text" style="flex: 1;"
                                    @input="vueFileInfoValueChange(key, $event.target.value)" />
                                <button @click="vueMakeFilename" style="margin-left: 10px; white-space: nowrap;">
                                    构造
                                </button>
                            </div>
                            <!-- resource_id 字段 -->
                            <div v-else-if="key === 'resource_id'" style="display: flex; align-items: center;">
                                <input :value="value" type="text" style="flex: 1;"
                                    @input="vueFileInfoValueChange(key, $event.target.value)" />
                                <button @click="vueMakeResourseId" style="margin-left: 5px; white-space: nowrap;">
                                    构造
                                </button>
                            </div>
                            <!-- summary 字段 -->
                            <textarea v-else-if="key === 'summary'" :value="value" rows="5" style="width: 100%;"
                                @input="vueFileInfoValueChange(key, $event.target.value)"></textarea>
                            <input v-else :value="value" type="text" style="width: 100%;"
                                @input="vueFileInfoValueChange(key, $event.target.value)" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import FileTreeNode from './FileTreeNode.vue'
import { getNowDateTimeV2 } from '../util/time.js'

const rootPath = localStorage.getItem('rootPath');

const rootNodeData = ref({
    dirPath: rootPath,
    name: '根目录',
    isDir: true,
    extname: '',
    fullPath: rootPath,
    children: [],
    childrenIsLoad: false
})

const rootPathIsScan = ref(false)

const vueScanRootPath = async function () {
    // const thisFuncName = 'vueScanDir';

    const result = await window.api.ipcScanDir(rootPath)

    // console.log(thisFuncName, result)

    rootNodeData.value.children = result;
    rootNodeData.value.childrenIsLoad = true;
    rootPathIsScan.value = true;

    beSelectNode.value = null;
    fileInfo.value = null;
}

// 选中的文件树结点
const beSelectNode = ref(null)

const fileInfoDefault = {
    id: 0,
    filename: '0',
    filetype: '0',
    source: '0',
    resource_id: '0',
    resource_index: 1,
    user_id: '0',
    resource_name: '0',
    ext_info: '0',
    publish_at: '0',
    key_point: '0',
    summary: '0',
    status: 1,
    visit_at: 'CURRENT_TIMESTAMP',
    visit_times: 1,
    create_at: 'CURRENT_TIMESTAMP',
    update_at: 'CURRENT_TIMESTAMP',
}

const fileInfo = ref(null)

// 处理节点选中事件
const vueTreeNodeBeSelect = async (nodeData) => {
    // const thisFuncName = 'vueTreeNodeBeSelect';

    beSelectNode.value = nodeData
    await vueQueryResourceInfo();
}

// 可以预览的文件类型
const canPreviewImageExtnameList = ['jpg', 'jpeg', 'png', 'gif'];
const canPreviewVideoExtnameList = ['mp4'];
const canPreviewExtnameList = [...canPreviewImageExtnameList, ...canPreviewVideoExtnameList];

// 是不是可以预览的文件
const isCanPreviewFile = (node) => {
    if (node == null || node.isDir) {
        return false;
    }
    return canPreviewExtnameList.includes(node.extname?.toLowerCase());
};

// 是不是可以预览的图片
const isImageFile = (node) => {
    const extname = node.extname != '' ? node.extname.toLowerCase() : '';
    return canPreviewImageExtnameList.includes(extname);
};

// 是不是可以预览的视频
const isVideoFile = (node) => {
    const extname = node.extname != '' ? node.extname.toLowerCase() : '';
    return canPreviewVideoExtnameList.includes(extname);
};

// 字段标签映射
const fileInfoKeyNameMap = {
    id: 'ID',
    filename: '文件名',
    filetype: '文件类型',
    source: '资源的来源',
    resource_id: '资源的id',
    resource_index: '资源的下标',
    user_id: '资源所属用户的id',
    username: '资源所属用户的名称',
    user_ext_info: '资源所属用户的额外信息',
    resource_name: '资源的名称',
    ext_info: '资源的额外信息',
    publish_at: '资源的发布时间',
    key_point: '我认为资源的重点是什么',
    summary: '我对资源的总结',
    status: '资源的状态',
    visit_at: '我最后一次访问资源的时间',
    visit_times: '我访问资源的总次数',
    create_at: '创建时间',
    update_at: '修改时间'
}
// 获取字段标签
const vueGetFileInfoKeyName = (key) => {
    return fileInfoKeyNameMap[key] || key;
}

// 相当于【v-model】，让数据源和输入框同步
const vueFileInfoValueChange = (key, value) => {
    if (fileInfo.value) {
        fileInfo.value[key] = value;
    }
};

const operateResult = ref(null)

const vueShowError = (error) => {
    operateResult.value = {
        isSuccess: false,
        message: '操作失败：' + error
    };
}

const vueQueryResourceInfo = async () => {
    // const thisFuncName = 'vueQueryResourceInfo';

    const nodeData = beSelectNode.value
    if (!nodeData.isDir) {
        try {
            const dbModel = { filename: nodeData.name }
            const result = await window.api.ipcQueryResourceInfo(dbModel)
            // console.log(thisFuncName, result)
            fileInfo.value = { ...fileInfoDefault, ...result }
        } catch (error) {
            // console.error(thisFuncName, error)
            vueShowError(error);
        }
    }
};

const vueQueryResourceInfoV2 = async () => {
    // const thisFuncName = 'vueQueryResourceInfoV2';

    const nodeData = beSelectNode.value
    if (!nodeData.isDir) {
        try {
            const dbModel = {
                source: fileInfo.value.source,
                resource_id: fileInfo.value.resource_id,
                user_id: fileInfo.value.user_id,
            }
            const result = await window.api.ipcQueryResourceInfoV2(dbModel)
            // console.log(thisFuncName, result)
            fileInfo.value = { ...fileInfoDefault, ...result }
        } catch (error) {
            // console.error(thisFuncName, error)
            vueShowError(error);
        }
    }
};

// 新增保存文件信息功能
const vueSaveResourceInfo = async () => {
    // const thisFuncName = 'vueSaveFileInfo';

    if (fileInfo.value != null) {
        try {
            const argModel = { ...fileInfo.value }
            const result = await window.api.ipcSaveResourceInfo(argModel);
            // console.log(thisFuncName, result);
            operateResult.value = {
                isSuccess: true,
                message: '操作成功：' + JSON.stringify(result)
            };
        } catch (error) {
            // console.error(thisFuncName, error);
            vueShowError(error);
        }
    }
}

// 构造【文件名】（资源的id_资源的下标_重命名时间）
const vueMakeFilename = () => {
    if (fileInfo.value == null) {
        return;
    }
    const resourceIndex = fileInfo.value.resource_index;
    const resourceId = fileInfo.value.resource_id;
    const dateTime = getNowDateTimeV2()
    const newName = `${resourceId}_${resourceIndex}_${dateTime}`;
    vueFileInfoValueChange('filename', newName);
};

// 构造【资源的id】
const vueMakeResourseId = () => {
    if (fileInfo.value == null) {
        return;
    }
    const dateTime = getNowDateTimeV2();
    vueFileInfoValueChange('resource_id', dateTime);
};

const vueSeeRenameFile = async () => {
    // const thisFuncName = 'vueSeeRenameFile';

    if (beSelectNode.value == null) {
        vueShowError('没有选中的文件树结点');
        return;
    }

    try {
        const argBeSelectNode = JSON.parse(JSON.stringify(beSelectNode.value))
        const argFileInfo = JSON.parse(JSON.stringify(fileInfo.value))
        const result = await window.api.ipcSeeRenameFile(argBeSelectNode, argFileInfo);
        // console.log(thisFuncName, result);
        const needRenameFileList = result.needRenameFileList;
        operateResult.value = {
            isSuccess: true,
            message: '需要重命名的文件：<br>' + needRenameFileList.join('<br>')
        };
    } catch (error) {
        // console.error(thisFuncName, error);
        vueShowError(error);
    }
}

const vueDoRenameFile = async () => {
    // const thisFuncName = 'vueDoRenameFile';

    if (beSelectNode.value == null) {
        vueShowError('没有选中的文件树结点');
        return;
    }

    try {
        const argBeSelectNode = JSON.parse(JSON.stringify(beSelectNode.value))
        const argFileInfo = JSON.parse(JSON.stringify(fileInfo.value))
        const result = await window.api.ipcDoRenameFile(argBeSelectNode, argFileInfo);
        // console.log(thisFuncName, result);
        const dirPath = result.dirPath;
        const renameFileList = result.renameFileList;
        let message = '目录【' + dirPath + '】<br>'
        for (const item of renameFileList) {
            message += '文件【' + item.oldFilename + '】被重命名为【' + item.newFilename + '】<br>'
        }
        operateResult.value = {
            isSuccess: true,
            message: message
        };
    } catch (error) {
        // console.error(thisFuncName, error);
        vueShowError(error);
    }
};

const vueSeeMoveFile = async () => {
    // const thisFuncName = 'vueSeeMoveFile';

    if (beSelectNode.value == null) {
        vueShowError('没有选中的文件树结点或者资源信息不全');
        return;
    }

    try {
        const argBeSelectNode = JSON.parse(JSON.stringify(beSelectNode.value))
        const argFileInfo = JSON.parse(JSON.stringify(fileInfo.value))
        const result = await window.api.ipcSeeMoveFile(argBeSelectNode, argFileInfo);
        // console.log(thisFuncName, result);
        const dirPath = result.dirPath;
        const newDirPath = result.newDirPath;
        const needMoveFileList = result.needMoveFileList;
        operateResult.value = {
            isSuccess: true,
            message: '以下文件：<br>' + needMoveFileList.join('<br>') + '<br>将被从目录：' + dirPath + '<br>移动到目录：' + newDirPath
        };
    } catch (error) {
        // console.error(thisFuncName, error);
        vueShowError(error);
    }
}

const vueDoMoveFile = async () => {
    // const thisFuncName = 'vueDoMoveFile';

    if (!beSelectNode.value || !fileInfo.value) {
        vueShowError('没有选中的文件树结点或者资源信息不全');
        return;
    }

    try {
        const argBeSelectNode = JSON.parse(JSON.stringify(beSelectNode.value))
        const argFileInfo = JSON.parse(JSON.stringify(fileInfo.value))
        const result = await window.api.ipcDoMoveFile(argBeSelectNode, argFileInfo);
        // console.log(thisFuncName, result);
        const moveFileList = result.moveFileList;
        let message = ''
        for (const item of moveFileList) {
            message += '文件【' + item.filename + '】的全路径<br>--|从：' + item.oldFullPath + '<br>--|改成：' + item.newFullPath + '<br>'
        }
        operateResult.value = {
            isSuccess: true,
            message: message
        };
    } catch (error) {
        // console.error(thisFuncName, error);
        vueShowError(error);
    }
};
</script>