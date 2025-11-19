<template>
  <div class="app">
    <!-- 导航 -->
    <nav class="nav">
      <ul>
        <li v-for="item in navList" :key="item.key" :class="{ active: activeNav === item.key }"
          @click="switchNav(item.key)">
          {{ item.name }}
        </li>
      </ul>
    </nav>
    <!-- 主体 -->
    <main>
      <!-- 动态组件 -->
      <component :is="activeComponent"></component>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Config from './components/Config.vue'
import Browser from './components/Browser.vue'
import Search from './components/Search.vue'

// 导航列表
const navList = ref([
  { key: 'config', name: '设置' },
  { key: 'browser', name: '浏览' },
  { key: 'search', name: '查询' }
])

// 组件映射
const componentMap = {
  config: Config,
  browser: Browser,
  search: Search
}

// 当前激活的导航
const activeNav = ref('config')

// 【方法】切换标签
const switchNav = (key) => {
  activeNav.value = key
}

// 【计算属性】给动态组件用的
const activeComponent = computed(() => {
  return componentMap[activeNav.value]
})

console.log('App.vue 已加载')
</script>

<style scoped>
.nav {
  background: #2c3e50;
  padding: 10px 0;
  width: 100%;
}

.nav ul {
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nav li {
  cursor: pointer;
  color: white;
  margin: 0 10px;
  padding: 10px 20px;
  border-radius: 10px;
}

.nav li:hover {
  background: #34495e;
}

.nav li.active {
  background: #3498db;
  font-weight: bold;
}
</style>