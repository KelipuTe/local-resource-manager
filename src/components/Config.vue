<template>
    <div>
        <div>设置</div>
        <div>
            <input v-model="dirPath" placeholder="请选择目录" readonly></input>
            <button @click="vueSelectDir">请选择目录</button>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'

const dirPath = ref('')

const vueSelectDir = async () => {
    try {
        const result = await window.api.ipcSelectDir(
            {
                title: '请选择目录',
                message: '请选择目录'
            }
        )
        console.log('vueSelectDir result', result)
        if (result !== '') {
            localStorage.setItem('dirPath', result)
            dirPath.value = result
        }
    } catch (err) {
        console.error('vueSelectDir Error', err)
    }
}

console.log('Config.vue 已加载')
</script>