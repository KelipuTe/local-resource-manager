<template>
    <div>
        <div>浏览</div>
        <div>
            <div style="display: flex; max-height: 80vh; overflow: hidden;">
                <!-- 左侧文件树，固定宽度 -->
                <div style="width: 600px; overflow-x: auto; flex-shrink: 0;">
                    <p>
                        <span>选择的目录：{{ dirPath }}</span>
                        <button @click="vueScanDir">扫描目录</button>
                    </p>
                    <div v-show="dirIsScan">
                        <FileTreeNode :node="rootNodeData" :level="0" @node-selected="vueTreeNodeBeSelect" />
                    </div>
                </div>
                <!-- 右侧信息面板，动态宽度 -->
                <div v-if="beSelectNode"
                    style="flex: 1; padding: 10px; border: 1px solid #ccc; min-width: 900px; overflow: auto;">
                    <h3>选中的节点信息</h3>
                    <p><strong>名称:</strong> {{ beSelectNode.name }}</p>
                    <p><strong>全路径:</strong> {{ beSelectNode.path }}</p>
                    
                    <!-- 预览区域 -->
                    <div v-if="isPreviewableFile(beSelectNode)" style="margin-bottom: 20px;">
                        <h3>预览</h3>
                        <div style="max-width: 100%; max-height: 400px; overflow: auto;">
                            <!-- 图片预览 -->
                            <img 
                                v-if="isImageFile(beSelectNode.ext)" 
                                :src="'file://' + beSelectNode.path" 
                                alt="预览图片" 
                                style="max-width: 100%; max-height: 400px; object-fit: contain;"
                            />
                            <!-- 视频预览 -->
                            <video 
                                v-else-if="isVideoFile(beSelectNode.ext)" 
                                :src="'file://' + beSelectNode.path" 
                                controls 
                                style="max-width: 100%; max-height: 400px;"
                            >
                                您的浏览器不支持视频播放。
                            </video>
                        </div>
                    </div>
                    
                    <!-- 显示从数据库查询到的文件信息 -->
                    <div>
                        <h3>文件详细信息</h3>
                        <div v-for="(value, key) in fileInfo" :key="key" style="margin-bottom: 10px;">
                            <label><strong>{{ vueGetFileInfoKeyName(key) }}:</strong></label>
                            <textarea 
                                v-if="key === 'summary'" 
                                :value="value" 
                                rows="5" 
                                style="width: 100%;"
                                @input="handleFieldChange(key, $event.target.value)"
                            ></textarea>
                            <input 
                                v-else 
                                :value="value" 
                                type="text" 
                                style="width: 100%;" 
                                @input="handleFieldChange(key, $event.target.value)"
                            />
                        </div>
                        // 添加保存按钮
                        <button @click="vueSaveFileInfo" style="margin-top: 10px;">保存信息</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import FileTreeNode from './FileTreeNode.vue'

const dirPath = localStorage.getItem('dirPath');

// 用于存储选中的节点
const beSelectNode = ref(null)

const fileInfoDefault = {
    id: 0,
    filename: '0', // 文件名
    filetype: '0', // 文件后缀名
    source: '0', // 资源的来源。bilibili。
    source_id: '0', // 资源的原始id
    source_num: 1, // 资源的编号。有些资源会共用原始id。
    source_name: '0', // 资源的名称
    source_ext_info: '0', // 额外的资源信息
    user_id: '0', // 资源所属的用户的id
    user_name: '0', // 资源所属的用户的名称
    user_ext_info: '0', // 额外的用户信息。比如：用户A剪辑的用户B的录播视频。
    publish_at: '0', // 资源发布时间
    key_point: '0', // 资源的关键点是什么。画面；声音；文字。
    summary: '0', // 我写的总结。主要是和【Obsidian】那边的笔记联动用的。
    status: 1, // 资源的状态。1=本地有。
    visit_at: 'CURRENT_TIMESTAMP', // 最后一次访问时间
    visit_times: 1, // 访问次数
    create_at: 'CURRENT_TIMESTAMP',
    update_at: 'CURRENT_TIMESTAMP',
}

const fileInfo = ref(null)

const rootNodeData = ref({
    name: 'root',
    path: dirPath,
    isDir: true,
    children: [],
    childrenIsLoad: false
})

const dirIsScan = ref(false)

// 字段标签映射
const fileInfoKeyNameMap = {
    id: 'ID',
    filename: '文件名',
    filetype: '文件类型',
    source: '来源',
    source_id: '来源ID',
    source_num: '来源编号',
    source_name: '来源名称',
    source_ext_info: '来源额外信息',
    user_id: '用户ID',
    user_name: '用户名',
    user_ext_info: '用户额外信息',
    publish_at: '发布时间',
    key_point: '关键点',
    summary: '总结',
    status: '状态',
    visit_at: '最后访问时间',
    visit_times: '访问次数',
    create_at: '创建时间',
    update_at: '更新时间'
}
// 获取字段标签的方法
const vueGetFileInfoKeyName = (key) => {
    return fileInfoKeyNameMap[key] || key;
}

// 支持预览的文件类型
const previewableExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'mp4', 'webm', 'ogg', 'avi'];

// 判断是否为可预览文件
const isPreviewableFile = (node) => {
    if (!node || node.isDir) return false;
    return previewableExtensions.includes(node.ext?.toLowerCase());
};

// 判断是否为图片文件
const isImageFile = (ext) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];
    return imageExtensions.includes(ext?.toLowerCase());
};

// 判断是否为视频文件
const isVideoFile = (ext) => {
    const videoExtensions = ['mp4', 'webm', 'ogg', 'avi'];
    return videoExtensions.includes(ext?.toLowerCase());
};

const vueScanDir = async function () {
    const result = await window.api.ipcScanDir(dirPath)
    rootNodeData.value.children = result
    rootNodeData.value.childrenIsLoad = true
    dirIsScan.value = true
}

// 处理节点选中事件
const vueTreeNodeBeSelect = async (node) => {
    beSelectNode.value = node
    if (!node.isDir) {
        try {
            const result = await window.api.ipcQueryFileInfo(node.name)
            fileInfo.value = { ...fileInfoDefault, ...result }
            console.log('vueNewNodeBeSelect', fileInfo.value,result)
        } catch (error) {
            console.error('vueNewNodeBeSelect', error)
        }
    } else {
        // 当选中的是目录时，重置为默认值
        fileInfo.value = { ...fileInfoDefault }
    }
}

// 新增处理字段变化的方法
const handleFieldChange = (field, value) => {
    if (fileInfo.value) {
        fileInfo.value[field] = value;
    }
};

// 新增保存文件信息功能
const vueSaveFileInfo = async () => {
    if (!fileInfo.value) return;
    
    try {
        const model =  {...fileInfo.value}
        console.log('文件信息保存成功', model);
        const result = await window.api.ipcSaveFileInfo(model);
        console.log('文件信息保存成功', result);
        // 可以添加一个提示消息告知用户保存成功
        alert('文件信息保存成功');
    } catch (error) {
        console.error('保存文件信息失败', error);
        // 可以添加一个提示消息告知用户保存失败
        alert('文件信息保存失败: ' + error);
    }
}
</script>