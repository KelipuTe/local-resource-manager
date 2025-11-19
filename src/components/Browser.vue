<template>
    <div>
        <div>浏览</div>
        <!-- 左侧文件树 - 固定宽度 -->
        <div>
            <p>选择的目录: {{ dirPath }}</p>
            <button @click="vueScanDir">扫描目录</button>
            <div v-show="dirIsScan">
                <div style="display: flex; max-height: 80vh; overflow: hidden;">
                    <div style="width: 600px; overflow-x: auto; flex-shrink: 0;">
                        <FileTreeNode :node="rootNodeData" :level="0" @node-selected="handleNodeSelected" />
                    </div>
                    <!-- 右侧节点信息面板 - 可伸缩 -->
                    <div v-if="selectedNode"
                        style="flex: 1; padding: 10px; border: 1px solid #ccc; min-width: 300px; overflow: auto;">
                        <h3>选中的节点信息</h3>
                        <p><strong>ID/路径:</strong> {{ selectedNode.path }}</p>
                        <p><strong>名称:</strong> {{ selectedNode.name }}</p>
                        <p><strong>是否目录:</strong> {{ selectedNode.isDir ? '是' : '否' }}</p>
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
const selectedNode = ref(null)

const rootNodeData = ref({
    name: 'root',
    path: dirPath,
    isDir: true,
    children: [],
    childrenIsLoad: false
})

const dirIsScan = ref(false)

const vueScanDir = async function () {
    const result = await window.api.ipcScanDir(dirPath)
    console.log('vueScanDir result', result)
    rootNodeData.value.children = result
    rootNodeData.value.childrenIsLoad = true
    dirIsScan.value = true
}

// 处理节点选中事件
const handleNodeSelected = (node) => {
    selectedNode.value = node
    console.log('选中的节点:', node)
}

console.log('Browser.vue 已加载')
</script>