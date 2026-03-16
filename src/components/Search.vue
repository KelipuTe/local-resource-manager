<template>
  <div class="search-container">
    <div class="search-bar">
      <input v-model="searchKeyword" type="text" placeholder="请输入资源名称进行搜索" class="search-input"
        @keyup.enter="handleSearch" />
      <button @click="handleSearch" class="search-button">搜索</button>
    </div>

    <div class="video-list">
      <div v-for="(item, index) in resourceList" :key="index" class="video-card">
        <div class="video-thumbnail">
          <img :src="item.thumbnail" alt="视频缩略图" />
          <div class="video-duration">{{ item.duration }}</div>
        </div>
        <div class="video-info">
          <h3 class="video-title">{{ item.resource_name }}</h3>
          <p class="video-description">{{ item.description }}</p>
          <div class="video-meta">
            <span class="up-name">UP: {{ item.upName }}</span>
            <span class="upload-time">{{ item.publish_at }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// 资源列表
const resourceList = ref([]);

// 搜索关键词
const searchKeyword = ref('');

/**
 * 检索资源
 */
async function fnQueryResource() {
  // 通过文件名模糊查询
  const queryArg = {
    filename: searchKeyword.value,
    orderBy: 'create_at DESC',
    pageSize: 20,
    pageIndex: 1
  };
  const result = await window.api.ipcFuzzyQueryResourceByFilename(queryArg);
  console.log(result);

  resourceList.value = [...result];
}

// 处理搜索事件
function handleSearch() {
  if (searchKeyword.value.trim()) {
    fnQueryResource();
  }
}

fnQueryResource();
</script>

<style scoped>
.search-container {
  padding: 20px;
}

.search-bar {
  display: flex;
  margin-bottom: 20px;
  gap: 10px;
}

.search-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.search-button:hover {
  background-color: #0056b3;
}

.video-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.video-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s;
}

.video-card:hover {
  transform: scale(1.02);
}

.video-thumbnail {
  position: relative;
  width: 100%;
  height: 150px;
  overflow: hidden;
}

.video-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-duration {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 5px;
  font-size: 12px;
  border-radius: 3px;
}

.video-info {
  padding: 10px;
}

.video-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  line-height: 1.4;
  color: #333;
}

.video-description {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.video-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}
</style>