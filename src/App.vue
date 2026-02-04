<template>
  <div class="app">
    <div class="app-container">
    <!-- 导航 -->
    <nav class="nav">
      <ul>
        <li v-for="item in navList" :key="item.key" @click="fnSwitchNav(item.key)" class="btn-blue btn-medium">
          {{ item.name }}
        </li>
      </ul>
    </nav>

    <!-- 主体 -->
    <main class="main">
      <!-- 动态组件 -->
      <component :is="vueActiveComponent"></component>
    </main>

    <!-- 全局提示框 -->
    <div v-if="globalMsg.show" class="message-popup" :class="'message-popup-' + globalMsg.type">
      <div class="message-popup-content">
        <span class="message-popup-close-btn" @click="fnCloseMessagePopup">&times;</span>
        <p class="message-popup-text" v-html="globalMsg.content"></p>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup>
import { ref, computed, provide } from 'vue'
import Config from './components/Config.vue'
import Browser from './components/Browser.vue'
import Search from './components/Search.vue'

// 导航列表
const navList = ref([
  { key: 'config', name: '基本设置' },
  { key: 'browser', name: '浏览仓库' },
  { key: 'search', name: '资源搜索' }
])

// 组件映射
const componentMap = {
  config: Config,
  browser: Browser,
  search: Search
}

// 当前激活的导航
const activeNav = ref('config')

// 切换导航
const fnSwitchNav = (key) => {
  activeNav.value = key
}

// 当前激活的组件
const vueActiveComponent = computed(() => {
  return componentMap[activeNav.value]
})

// 全局提示信息
// type=info|error
const globalMsg = ref({
  show: false,
  type: 'error',
  content: ''
})

// 提供全局显示普通信息的方法
provide('vueShowInfo', (msg) => {
  console.info(msg);
  globalMsg.value = {
    show: true,
    type: 'info',
    content: msg
  };
})

// 提供全局显示错误信息的方法
provide('vueShowError', (err) => {
  console.error(err);
  globalMsg.value = {
    show: true,
    type: 'error',
    content: err.message
  };
})

const fnCloseMessagePopup = () => {
  globalMsg.value = {
    show: false,
    type: 'info',
    content: ''
  }
}
</script>

<style scoped>
.app {
  width: 100%;
  height: 100%;
  background-color: #1a1a1a;
}

.app-container {
  width: 1600px;
  height: 900px;
  margin: 0 auto;
  background-color: #C7EDCC;
  display: flex;
  flex-direction: column;
  position: relative;
}

.nav {
  width: 1600px;
  height: 49px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid #000000;
}

.nav ul {
  margin: 0;
  padding: 0;
}

.main {
  width: 1600px;
  height: 850px;
  margin: 0;
  padding: 0;
  overflow: auto;
}

/* ---------------- 全局提示框 ---------------- */

.message-popup {
  position: fixed;
  bottom: 200px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  min-width: 300px;
  max-width: 80vw;
}

.message-popup-info {
  background-color: #d1ecf1;
  border: 10px solid #bee5eb;
  color: #0c5460;
}

.message-popup-error {
  background-color: #f8d7da;
  border: 10px solid #f5c6cb;
  color: #721c24;
}

.message-popup-content {
  background-color: #fff;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  position: relative;
  word-wrap: break-word;
  word-break: break-all;
}

.message-popup-text {
  margin: 0;
  padding-right: 20px;
  line-height: 1.5;
}

.message-popup-close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 24px;
  cursor: pointer;
  font-weight: bold;
}

/* -------------------------------- 全局提示框 -------------------------------- */
</style>