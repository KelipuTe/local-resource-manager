<template>
    <div class="config">
        <div class="form-container" style="align-items: center;">
            <div class="form-group">
                <input v-model="rootDir" placeholder="请设置根目录" class="input-medium"></input>
                <button class="btn-blue btn-medium" @click="fnSelectDir">浏览</button>
            </div>
            <div class="form-group">
                <input v-model="rootDir" placeholder="请设置根目录" class="input-medium"></input>
                <button class="btn-blue btn-medium" @click="fnSelectDir">浏览</button>
            </div>
            <div class="form-group">
                <input v-model="rootDir" placeholder="请设置根目录" class="input-medium"></input>
                <button class="btn-blue btn-medium" @click="fnSelectDir">浏览</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, inject } from 'vue'

const vueShowError = inject('vueShowError')

const rootDir = ref('')

const fnSelectDir = async () => {
    try {
        const result = await window.api.ipcSelectDir({
            title: '请选择目录',
            message: '请选择目录'
        });
        if (result != '') {
            rootDir.value = result
            localStorage.setItem('rootDir', result)
        }
    } catch (err) {
        vueShowError(err)
    }
}
</script>

<style scoped>
.config {
    width: 1600px;
    height: 850px;
}
</style>