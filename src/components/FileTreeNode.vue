<template>
    <!-- 文件树 -->
    <div class="file-tree-container">
         <!-- 当前节点 -->
        <div style="padding-left:20px" class="tree-node">
            <div  class="node-header">
                <p >
                <span v-if="node.isDir">{{ dirIsOpen ? '📂' : '📁' }}</span>
                <span @click="vueOpenDir">{{ node.name }}</span>
                <!-- 只有特定类型的文件才显示信息按钮 -->
                <button 
                    v-if="!node.isDir && isSupportFileType(node.ext)" 
                    @click="vueGetFileInfo" 
                    style="margin-left: 10px;">
                    信息
                </button>
                </p>
            </div>

            <!-- 子节点 -->
            <div v-show="dirIsOpen" class="children-container">
                <FileTreeNode 
                    v-for="item in node.children" 
                    :key="item.path" 
                    :node="item" 
                    :level="level + 1" 
                    @node-selected="emit('node-selected', $event)"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, defineProps , defineEmits } from 'vue'

// 定义事件
const emit = defineEmits(['node-selected'])

// 选中的文件
const selectedFile = ref('')

const props = defineProps({
    node: {
        type: Object,
        required: true
    },
    level: {
        type: Number,
        required: true
    }
})


const dirIsOpen = ref(false)
const dirIsScan = ref(false)

// 支持的文件类型列表
const supportFileTypeList = ['mp4', 'jpg', 'png' ];

// 判断是否为支持的文件类型
const isSupportFileType = (ext) => {
    return supportFileTypeList.includes(ext.toLowerCase());
}

// 打开目录
const vueOpenDir = async function () {
    // 如果还没有加载过，则进行加载
    if (dirIsScan.value === false) {
        const result = await window.api.ipcScanDir(props.node.path)
        console.log('vueOpenDir result', result)
        props.node.children = result
        props.node.childrenLoaded = true
        dirIsScan.value = true
    }
    // 显示子节点
    dirIsOpen.value = !dirIsOpen.value
}

// 获取节点ID并向上发送事件
const vueGetFileInfo = () => {
    // 向父组件发送节点信息
    emit('node-selected', props.node)
}
</script>

<style scoped>
.node-name {
    white-space: nowrap;
}
</style>