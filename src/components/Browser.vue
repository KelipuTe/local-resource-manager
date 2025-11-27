<template>
    <div>
        <div>浏览</div>
        <div>
            <div style="display: flex; max-height: 80vh; overflow: hidden;">
                <!-- 左侧，文件树，固定宽度 -->
                <div style="width: 600px; overflow-x: auto; flex-shrink: 0;">
                    <p>
                        <span>选择的目录：{{ rootPath }}</span>
                        <button @click="vueScanDir">扫描目录</button>
                    </p>
                    <div v-show="dirIsScan">
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
                        <p><button @click="vueSaveFileInfo" style="margin-top: 10px;">保存信息到数据库</button></p>
                        <p>
                            <button @click="vueSeeRenameFile"
                                style="margin-top: 10px; margin-left: 10px;">预览文件重命名</button>
                            <button @click="vueDoRenameFile"
                                style="margin-top: 10px; margin-left: 10px;">执行文件重命名</button>
                            <button @click="vueSeeMoveFile" style="margin-top: 10px; margin-left: 10px;">预览文件归档</button>
                            <button @click="vueDoMoveFile" style="margin-top: 10px; margin-left: 10px;">执行文件归档</button>
                        </p>
                        <div v-if="renameResult"
                            :style="{ color: renameResult.success ? 'green' : 'red', marginTop: '10px' }">
                            {{ renameResult.message }}
                        </div>
                        <div v-if="moveResult"
                            :style="{ color: moveResult.success ? 'green' : 'red', marginTop: '10px' }">
                            {{ moveResult.message }}
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
                                <button @click="makeFilenameByDateTime" style="margin-left: 10px; white-space: nowrap;">
                                    基于时间生成文件名
                                </button>
                                <button @click="makeFilenameByInfo" style="margin-left: 5px; white-space: nowrap;">
                                    基于信息生成文件名
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

const rootPath = localStorage.getItem('rootPath');

const rootNodeData = ref({
    dirPath: rootPath,
    name: 'root',
    isDir: true,
    extname: '',
    fullPath: rootPath,
    children: [],
    childrenIsLoad: false
})

const dirIsScan = ref(false)

const vueScanDir = async function () {
    const result = await window.api.ipcScanDir(rootPath)
    console.log('vueScanDir', result)

    rootNodeData.value.children = result;
    rootNodeData.value.childrenIsLoad = true;
    dirIsScan.value = true;

    beSelectNode.value = null;
    fileInfo.value = null;
}

// 用于存储选中的节点
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
const vueTreeNodeBeSelect = async (node) => {
    beSelectNode.value = node
    if (!node.isDir) {
        try {
            const result = await window.api.ipcQueryFileInfo(node.name)
            console.log('vueNewNodeBeSelect', result)

            fileInfo.value = { ...fileInfoDefault, ...result }
        } catch (error) {
            console.error('vueNewNodeBeSelect', error)
        }
    }
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
    resource_index: '下标',
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
// 获取字段标签的方法
const vueGetFileInfoKeyName = (key) => {
    return fileInfoKeyNameMap[key] || key;
}

// 新增处理字段变化的方法
const vueFileInfoValueChange = (key, value) => {
    if (fileInfo.value) {
        fileInfo.value[key] = value;
    }
};

// 新增保存文件信息功能
const vueSaveFileInfo = async () => {
    if (fileInfo.value != null) {
        try {
            const model = { ...fileInfo.value }
            const result = await window.api.ipcSaveFileInfo(model);
            console.log('vueSaveFileInfo', result);
        } catch (error) {
            console.error('vueSaveFileInfo', error);
        }
    }
}

// 基于时间生成文件名 (发布日期_资源来源_用户id_资源id_资源index)
const makeFilenameByDateTime = () => {
    if (fileInfo.value == null) {
        return;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const resourceId = `${year}${month}${day}${hours}${minutes}${seconds}`;

    const resourceIndex = fileInfo.value.resource_index;
    const userId = fileInfo.value.user_id;
    const source = fileInfo.value.source;

    let publishAt = '00000000';
    if (fileInfo.value.publish_at != '0') {
        try {
            const date = new Date(fileInfo.value.publish_at);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            publishAt = `${year}${month}${day}`;
        } catch (err) {
            alert('makeFilenameByDateTime', err);
            return;
        }
    } else {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        publishAt = `${year}${month}${day}`;
    }

    const newName = `${publishAt}_${source}_${userId}_${resourceId}_${resourceIndex}`;
    vueFileInfoValueChange('filename', newName);
};

// 基于信息生成文件名 (发布日期_资源来源_用户id_资源id_资源index)
const makeFilenameByInfo = () => {
    if (fileInfo.value == null) {
        return;
    }

    const resourceId = fileInfo.value.resource_id;
    const resourceIndex = fileInfo.value.resource_index;
    const userId = fileInfo.value.user_id;
    const source = fileInfo.value.source;

    let publishAt = '00000000';
    if (fileInfo.value.publish_at != '0') {
        try {
            const date = new Date(fileInfo.value.publish_at);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            publishAt = `${year}${month}${day}`;
        } catch (err) {
            alert('makeFilenameByInfo', err);
            return;
        }
    } else {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        publishAt = `${year}${month}${day}`;
    }

    const newName = `${publishAt}_${source}_${userId}_${resourceId}_${resourceIndex}`;
    vueFileInfoValueChange('filename', newName);
};

// 添加重命名结果状态
const renameResult = ref(null)

const vueSeeRenameFile = async () => {
    if (beSelectNode.value == null) {
        renameResult.value = {
            success: false,
            message: '没有选中的文件'
        };
        return;
    }

    try {
        const argBeSelectNode = { ...beSelectNode.value }
        const argFileInfo = { ...fileInfo.value }
        const result = await window.api.ipcSeeRenameFile(argBeSelectNode, argFileInfo);
        console.log('vueDoRenameFile', result);
    } catch (error) {
        console.error('vueSeeRenameFile', error);
    }
}

// 添加重命名文件功能
const vueDoRenameFile = async () => {
    if (beSelectNode.value == null) {
        renameResult.value = {
            success: false,
            message: '没有选中的文件'
        };
        return;
    }

    try {
        const argBeSelectNode = { ...beSelectNode.value }
        const argFileInfo = { ...fileInfo.value }
        const result = await window.api.ipcDoRenameFile(argBeSelectNode, argFileInfo);
        console.log('vueDoRenameFile', result);
    } catch (error) {
        console.error('vueDoRenameFile', error);
    }
};

// 添加归档结果状态
const moveResult = ref(null)

const vueSeeMoveFile = async () => {
    if (beSelectNode.value == null) {
        moveResult.value = {
            success: false,
            message: '没有选中的文件'
        };
        return;
    }

    try {
        const argBeSelectNode = { ...beSelectNode.value }
        const argFileInfo = { ...fileInfo.value }
        const result = await window.api.ipcSeeMoveFile(argBeSelectNode, argFileInfo);
        console.log('vueSeeMoveFile', result);
    } catch (error) {
        console.error('vueSeeMoveFile', error);
    }
}

// 添加归档文件功能
const vueDoMoveFile = async () => {
    if (!beSelectNode.value || !fileInfo.value) {
        moveResult.value = {
            success: false,
            message: '没有选中的文件或文件信息缺失'
        };
        return;
    }

    try {
        const argBeSelectNode = { ...beSelectNode.value }
        const argFileInfo = { ...fileInfo.value }
        const result = await window.api.ipcDoMoveFile(argBeSelectNode, argFileInfo);
        console.log('vueDoMoveFile', result);
    } catch (error) {
        console.error('vueDoMoveFile', error);
    }
};
</script>