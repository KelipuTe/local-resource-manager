<template>
    <!-- 文件树 -->
    <div class="file-tree-container">
        <div style="padding-left:20px" class="tree-node">
            <!-- 当前节点 -->
            <div class="node-header">
                <p>
                    <span v-if="treeNodeData.isDir">{{ dirIsOpen ? '📂' : '📁' }}</span>
                    <span @click="vueOpenDir">{{ treeNodeData.name }}</span>
                    <!-- 为目录节点添加刷新按钮 -->
                    <button v-if="treeNodeData.isDir" @click="vueRefreshDir" style="margin-left: 10px;"
                        :disabled="isRefreshing">
                        {{ isRefreshing ? '刷新中...' : '刷新' }}
                    </button>
                    <!-- 只有特定类型的文件才显示信息按钮 -->
                    <button v-if="!treeNodeData.isDir && isHaveInfoFiletype(treeNodeData)" @click="vueGetFileInfo"
                        style="margin-left: 10px;">
                        信息
                    </button>
                </p>
            </div>
            <!-- 子节点 -->
            <div v-show="dirIsOpen" class="children-container">
                <FileTreeNode v-for="item in treeNodeData.children" :key="item.fullPath" :treeNodeData="item" :level="level + 1"
                    @node-selected="emit('node-selected', $event)" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'

const props = defineProps({
    treeNodeData: {
        type: Object,
        required: true
    },
    level: {
        type: Number,
        required: true
    }
})

// 定义事件
const emit = defineEmits(['node-selected'])

const dirIsOpen = ref(false)
const dirIsScan = ref(false)
const isRefreshing = ref(false) // 添加刷新状态

// 支持的文件类型列表
const haveInfoFiletypeList = ['jpg', 'png', 'mp4'];

// 判断是否为支持的文件类型
const isHaveInfoFiletype = (nodeData) => {
    const extname = nodeData.extname != '' ? nodeData.extname.toLowerCase() : '';
    return haveInfoFiletypeList.includes(extname);
}

// 打开目录
const vueOpenDir = async function () {
    // 如果还没有加载过，则进行加载
    if (dirIsScan.value === false) {
        const result = await window.api.ipcScanDir(props.treeNodeData.fullPath)
        console.log('vueOpenDir', result)
        props.treeNodeData.children = result
        props.treeNodeData.childrenLoaded = true
        dirIsScan.value = true
    }
    // 显示子节点
    dirIsOpen.value = !dirIsOpen.value
}

// 新增刷新目录功能
const vueRefreshDir = async function () {
    isRefreshing.value = true
    try {
        const result = await window.api.ipcScanDir(props.treeNodeData.fullPath)
        console.log('vueRefreshDir result', result)
        props.treeNodeData.children = result
        props.treeNodeData.childrenLoaded = true
        dirIsScan.value = true
        // 保持目录展开状态
        dirIsOpen.value = true
    } catch (error) {
        console.error('刷新目录失败', error)
    } finally {
        isRefreshing.value = false
    }
}

// 获取节点ID并向上发送事件
const vueGetFileInfo = () => {
    // 向父组件发送节点信息
    emit('node-selected', props.treeNodeData)
}
</script>

<style scoped>
.node-name {
    white-space: nowrap;
}
</style>