<template>
    <div>
        <div>设置</div>
        <div>
            <p>
                <input v-model="rootPath" placeholder="选择的目录" readonly></input>
                <button @click="vueSelectDir">请选择目录</button>
            </p>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'

const rootPath = ref('')

const vueSelectDir = async () => {
    try {
        const result = await window.api.ipcSelectDir(
            {
                title: '请选择目录',
                message: '请选择目录'
            }
        )
        console.log('vueSelectDir', result)
        if (result != '') {
            localStorage.setItem('rootPath', result)
            rootPath.value = result
        }
    } catch (err) {
        console.error('vueSelectDir', err)
    }
}
</script>