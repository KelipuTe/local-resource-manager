<template>
    <div class="browser">
        <!-- 左边的文件树 -->
        <div class="file-tree">
            <div class="form-container">
                <p class="form-group">
                    <input v-model="rootDir" placeholder="请设置根目录" class="input-medium"></input>
                    <button @click="fnScanRootDir" class="btn-blue btn-medium">扫描目录</button>
                </p>
            </div>
            <div v-show="rootDirIsScan">
                <FileTreeNode :treeNodeData="rootNodeData" :level="0" @node-selected="fnTreeNodeBeSelect" />
            </div>
        </div>
        <!-- 右边的区域 -->
        <div class="resource-info">
            <h3>结点的信息</h3>
            <div>
                <div v-if="beSelectNode != null">
                    <p>目录: {{ beSelectNode.dirPath }}</p>
                    <p>文件名: {{ beSelectNode.name }}</p>
                </div>
                <div v-if="beSelectNode != null && fnIsCanPreview(beSelectNode)" class="preview-container">
                    <img v-if="fnIsImageFile(beSelectNode)" :src="'file://' + beSelectNode.fullPath" alt="图片加载失败"
                        class="preview-img">
                    <video v-else-if="fnIsVideoFile(beSelectNode)" :src="'file://' + beSelectNode.fullPath" controls
                        class="preview-video">
                        视频加载失败
                    </video>
                </div>
            </div>
            <h3>
                <span>资源的信息</span>
                <button @click="resourceInfoIsVisible = !resourceInfoIsVisible" class="btn-blue btn-medium">
                    {{ resourceInfoIsVisible ? '收起' : '展开' }}
                </button>
            </h3>
            <div v-if="resourceInfoIsVisible">
                <div class="form-container">
                    <div class="form-group">
                        <button @click="vueGetResourceInfo" class="btn-green btn-medium">查询（文件名）</button>
                        <button @click="vueGetResourceInfoV2" class="btn-green btn-medium">查询（信息）</button>
                        <button @click="vueSaveResourceInfo" class="btn-orange btn-medium">保存（信息）</button>
                    </div>
                    <div class="form-group">
                        <button @click="vueSeeRenameFile" class="btn-green btn-medium">重命名（预览）</button>
                        <button @click="vueDoRenameFile" class="btn-orange btn-medium">重命名（执行）</button>
                        <button @click="vueSeeMoveFile" class="btn-green btn-medium">归档（预览）</button>
                        <button @click="vueDoMoveFile" class="btn-orange btn-medium">归档（执行）</button>
                    </div>
                </div>
                <div class="form-container">
                    <div v-for="(value, key) in resourceInfo" :key="key" class="form-group">
                        <label class="input-label">{{ fnGetResourceInfoKeyName(key) }}</label>

                        <!-- filename 字段 -->
                        <div v-if="key === 'filename'">
                            <input :value="value" type="text" class="input-long"
                                @input="fnChangeResourceInfoValue(key, $event.target.value)" />
                            <button @click="vueMakeFilename" class="btn-blue btn-medium">构造</button>
                        </div>

                        <!-- resource_id 字段 -->
                        <div v-else-if="key === 'resource_id'">
                            <input :value="value" type="text" class="input-long"
                                @input="fnChangeResourceInfoValue(key, $event.target.value)" />
                            <button @click="vueMakeResourseId" class="btn-blue btn-medium">构造</button>
                        </div>

                        <!-- summary 字段 -->
                        <div v-else-if="key === 'summary'">
                            <textarea :value="value" rows="10" class="input-long"
                                @input="fnChangeResourceInfoValue(key, $event.target.value)"></textarea>
                        </div>

                        <!-- 其他字段 -->
                        <div v-else>
                            <input :value="value" type="text" class="input-long"
                                @input="fnChangeResourceInfoValue(key, $event.target.value)" />
                        </div>
                    </div>
                </div>
            </div>
            <h3>
                <span>标签的信息</span>
                <button @click="resourceTagIsVisible = !resourceTagIsVisible" class="btn-blue btn-medium">
                    {{ resourceTagIsVisible ? '收起' : '展开' }}
                </button>
            </h3>
            <div v-if="resourceTagIsVisible && resourceInfo != null">
                <div class="form-container">
                    <div class="form-group">
                        <label class="input-label">资源的标签</label>
                        <button @click="fnSaveResourceTag" class="btn-orange btn-medium">保存标签</button>
                    </div>
                    <div class="form-group">
                        <span v-for="item in resourceTagList" :key="item.id" class="btn-green btn-medium">
                            {{ item.name }}
                            <button @click="fnDelTagFromResource(item)" class="btn-small">❌</button>
                        </span>
                    </div>
                </div>
                <div class="form-container">
                    <div class="form-group">
                        <label class="input-label">所有的标签</label>
                        <input v-model="tagSearchKey" placeholder="搜索标签" class="input-short" />
                        <button @click="fnSearchTag" style="margin-left: 10px;" class="btn-blue btn-medium">搜索</button>
                    </div>
                    <div class="form-group">
                        <span v-for="tag in displayTagList" :key="tag.id" class ="btn-medium" :class="fnIsResourseHaveTag(tag)?'btn-green' : 'btn-blue'">
                            {{ tag.name }}
                            <button @click="fnAddTagToResource(tag)" class="btn-small"
                                :disabled="fnIsResourseHaveTag(tag)">✅</button>
                        </span>
                    </div>
                    <div class="form-group">
                        <input v-model="newTagName" placeholder="标签名称" class="input-short" />
                        <input v-model="newTagDescription" placeholder="描述（可选）" class="input-short" />
                        <button @click="fnCreateNewTag" class="btn-orange btn-medium">创建标签</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, inject } from 'vue'
import FileTreeNode from './FileTreeNode.vue'
import { getNowDateTimeV2 } from '../util/time.js'

// ---------------- 共用的东西 ----------------

const vueShowInfo = inject('vueShowInfo')
const vueShowError = inject('vueShowError')

// -------------------------------- 共用的东西 --------------------------------

// ---------------- 文件树 ----------------

const rootDir = localStorage.getItem('rootDir');

const rootNodeData = ref({
    dirPath: rootDir,
    name: '根目录',
    isDir: true,
    extname: '',
    fullPath: rootDir,
    children: [],
    childrenIsLoad: false
})

const rootDirIsScan = ref(false)

const fnScanRootDir = async function () {
    const result = await window.api.ipcScanDir(rootDir)

    rootNodeData.value.children = result;
    rootNodeData.value.childrenIsLoad = true;
    rootDirIsScan.value = true;

    beSelectNode.value = null;
    resourceInfo.value = null;
}

fnScanRootDir();

// 被选中的文件树结点
const beSelectNode = ref(null)

// 处理节点选中事件
const fnTreeNodeBeSelect = async (nodeData) => {
    beSelectNode.value = nodeData

    await vueGetResourceInfo();

    if (resourceInfo.value != null) {
        await fnGetAllTag();
        if (resourceInfo.value.id != 0) {
            await fnGetResourceTag();
        }
    }
}

// -------------------------------- 文件树 --------------------------------

// ---------------- 预览区域 ----------------

// 可以预览的文件扩展名
const canPreviewImageExtnameList = ['jpg', 'jpeg', 'png', 'gif'];
const canPreviewVideoExtnameList = ['mp4'];
const canPreviewExtnameList = [
    ...canPreviewImageExtnameList,
    ...canPreviewVideoExtnameList
];

// 是不是可以预览的文件
const fnIsCanPreview = (nodeData) => {
    if (nodeData == null || nodeData.isDir) {
        return false;
    }
    return canPreviewExtnameList.includes(nodeData.extname?.toLowerCase());
};

// 是不是可以预览的图片
const fnIsImageFile = (nodeData) => {
    const extname = nodeData.extname != '' ? nodeData.extname.toLowerCase() : '';
    return canPreviewImageExtnameList.includes(extname);
};

// 是不是可以预览的视频
const fnIsVideoFile = (nodeData) => {
    const extname = nodeData.extname != '' ? nodeData.extname.toLowerCase() : '';
    return canPreviewVideoExtnameList.includes(extname);
};

// -------------------------------- 预览区域 --------------------------------

// ---------------- 资源的信息 ----------------

// 控制【资源的信息】可不可见
const resourceInfoIsVisible = ref(true)

const resourceInfoDefault = {
    id: 0,
    filename: '0',
    filetype: '0',
    source: '0',
    resource_id: '0',
    resource_index: 1,
    user_id: '0',
    resource_name: '0',
    ext_info: '0',
    publish_at: '0',
    key_point: '0',
    summary: '0',
    status: 1,
    visit_at: 'CURRENT_TIMESTAMP',
    visit_times: 1,
    create_at: 'CURRENT_TIMESTAMP',
    update_at: 'CURRENT_TIMESTAMP',
}

const resourceInfo = ref(null)

// 字段标签映射
const resourceInfoKeyNameMap = {
    id: 'ID',
    filename: '文件名',
    filetype: '文件类型',
    source: '资源的来源',
    resource_id: '资源的id',
    resource_index: '资源的下标',
    user_id: '资源所属用户的id',
    username: '资源所属用户的名称',
    user_ext_info: '资源所属用户的额外信息',
    resource_name: '资源的名称',
    ext_info: '资源的额外信息',
    publish_at: '资源的发布时间',
    key_point: '我认为资源的重点是什么',
    summary: '我对资源的总结',
    status: '资源的状态',
    visit_at: '我最后一次访问资源的时间',
    visit_times: '我访问资源的总次数',
    create_at: '创建时间',
    update_at: '修改时间'
}
// 获取字段标签
const fnGetResourceInfoKeyName = (key) => {
    if (resourceInfoKeyNameMap[key] != null) {
        return resourceInfoKeyNameMap[key];
    }
    return key;
}

// 相当于【v-model】，让数据源和输入框同步
const fnChangeResourceInfoValue = (key, value) => {
    if (resourceInfo.value != null) {
        resourceInfo.value[key] = value;
    }
};

const operateResult = ref(null)

const vueOperateSuccess = (error) => {
    operateResult.value = {
        isSuccess: true,
        message: '操作成功：' + error
    };
}

const vueOperateFailed = (error) => {
    operateResult.value = {
        isSuccess: false,
        message: '操作失败：' + error
    };
}

const vueGetResourceInfo = async () => {
    const nodeData = beSelectNode.value
    if (!nodeData.isDir) {
        try {
            const dbModel = { filename: nodeData.name }
            const result = await window.api.ipcGetResourceInfo(dbModel)
            resourceInfo.value = { ...resourceInfoDefault, ...result }
        } catch (error) {
            vueOperateFailed(error);
        }
    }
};

const vueGetResourceInfoV2 = async () => {
    const nodeData = beSelectNode.value
    if (!nodeData.isDir) {
        try {
            const dbModel = {
                source: resourceInfo.value.source,
                resource_id: resourceInfo.value.resource_id,
                user_id: resourceInfo.value.user_id,
            }
            const result = await window.api.ipcGetResourceInfoV2(dbModel)
            resourceInfo.value = { ...resourceInfoDefault, ...result }
        } catch (error) {
            vueOperateFailed(error);
        }
    }
};

// 保存资源的信息
const vueSaveResourceInfo = async () => {
    if (resourceInfo.value != null) {
        try {
            const argModel = { ...resourceInfo.value }
            const result = await window.api.ipcSaveResourceInfo(argModel);
            operateResult.value = {
                isSuccess: true,
                message: '操作成功：' + JSON.stringify(result)
            };
        } catch (error) {
            vueOperateFailed(error);
        }
    }
}

// 构造【文件名】（资源的id_资源的下标_重命名时间）
const vueMakeFilename = () => {
    if (resourceInfo.value == null) {
        return;
    }
    const resourceIndex = resourceInfo.value.resource_index;
    const resourceId = resourceInfo.value.resource_id;
    const dateTime = getNowDateTimeV2()
    const newName = `${resourceId}_${resourceIndex}_${dateTime}`;
    fnChangeResourceInfoValue('filename', newName);
};

// 构造【资源的id】
const vueMakeResourseId = () => {
    if (resourceInfo.value == null) {
        return;
    }
    const dateTime = getNowDateTimeV2();
    fnChangeResourceInfoValue('resource_id', dateTime);
};

const vueSeeRenameFile = async () => {
    if (beSelectNode.value == null) {
        vueOperateFailed('没有选中的文件树结点');
        return;
    }

    try {
        const argBeSelectNode = JSON.parse(JSON.stringify(beSelectNode.value))
        const argFileInfo = JSON.parse(JSON.stringify(resourceInfo.value))
        const result = await window.api.ipcSeeRenameFile(argBeSelectNode, argFileInfo);
        const needRenameFileList = result.needRenameFileList;
        operateResult.value = {
            isSuccess: true,
            message: '需要重命名的文件：<br>' + needRenameFileList.join('<br>')
        };
    } catch (error) {
        // console.error(thisFuncName, error);
        vueOperateFailed(error);
    }
}

const vueDoRenameFile = async () => {
    // const thisFuncName = 'vueDoRenameFile';

    if (beSelectNode.value == null) {
        vueOperateFailed('没有选中的文件树结点');
        return;
    }

    try {
        const argBeSelectNode = JSON.parse(JSON.stringify(beSelectNode.value))
        const argFileInfo = JSON.parse(JSON.stringify(resourceInfo.value))
        const result = await window.api.ipcDoRenameFile(argBeSelectNode, argFileInfo);
        const dirPath = result.dirPath;
        const renameFileList = result.renameFileList;
        let message = '目录【' + dirPath + '】<br>'
        for (const item of renameFileList) {
            message += '文件【' + item.oldFilename + '】被重命名为【' + item.newFilename + '】<br>'
        }
        operateResult.value = {
            isSuccess: true,
            message: message
        };
    } catch (error) {
        vueOperateFailed(error);
    }
};

const vueSeeMoveFile = async () => {
    if (beSelectNode.value == null) {
        vueOperateFailed('没有选中的文件树结点或者资源信息不全');
        return;
    }

    try {
        const argBeSelectNode = JSON.parse(JSON.stringify(beSelectNode.value))
        const argFileInfo = JSON.parse(JSON.stringify(resourceInfo.value))
        const result = await window.api.ipcSeeMoveFile(argBeSelectNode, argFileInfo);
        const dirPath = result.dirPath;
        const newDirPath = result.newDirPath;
        const needMoveFileList = result.needMoveFileList;
        operateResult.value = {
            isSuccess: true,
            message: '以下文件：<br>' + needMoveFileList.join('<br>') + '<br>将被从目录：' + dirPath + '<br>移动到目录：' + newDirPath
        };
    } catch (error) {
        vueOperateFailed(error);
    }
}

const vueDoMoveFile = async () => {
    if (!beSelectNode.value || !resourceInfo.value) {
        vueOperateFailed('没有选中的文件树结点或者资源信息不全');
        return;
    }

    try {
        const argBeSelectNode = JSON.parse(JSON.stringify(beSelectNode.value))
        const argFileInfo = JSON.parse(JSON.stringify(resourceInfo.value))
        const result = await window.api.ipcDoMoveFile(argBeSelectNode, argFileInfo);
        const moveFileList = result.moveFileList;
        let message = ''
        for (const item of moveFileList) {
            message += '文件【' + item.filename + '】的全路径<br>--|从：' + item.oldFullPath + '<br>--|改成：' + item.newFullPath + '<br>'
        }
        operateResult.value = {
            isSuccess: true,
            message: message
        };
    } catch (error) {
        vueOperateFailed(error);
    }
};

// -------------------------------- 资源的信息 --------------------------------

// ---------------- 标签的信息 ----------------

const resourceTagIsVisible = ref(true);

const allTagList = ref([]); // 所有的标签
const resourceTagList = ref([]); // 资源的标签
const displayTagList = ref([]); // 显示的标签
const tagSearchKey = ref(''); // 标签搜索关键词
const newTagName = ref(''); // 标签名称
const newTagDescription = ref(''); // 标签描述

// 获取所有的标签
const fnGetAllTag = async () => {
    try {
        const result = await window.api.ipcGetAllTag();
        allTagList.value = result;
        displayTagList.value = result;
    } catch (err) {
        vueShowError(err)
    }
};

// 获取资源的标签
const fnGetResourceTag = async () => {
    try {
        const resourceId = resourceInfo.value.id
        const result = await window.api.ipcGetResourceTag(resourceId);
        resourceTagList.value = result;
    } catch (err) {
       vueShowError(err);
    }
};



// 创建新标签
const fnCreateNewTag = async () => {
    if (newTagName.value == null || newTagName.value.trim() == '' || newTagName.value.trim() == '0') {
        vueShowError(new Error('标签名称不能为空'));
        return;
    }

    try {
        const argDbModel = {
            name: newTagName.value.trim(),
            description: '0'
        }
        if (newTagDescription.value != null && newTagDescription.value.trim() != '') {
            argDbModel.description = newTagDescription.value.trim()
        }
        await window.api.ipcCreateTag(argDbModel);

        newTagName.value = '';
        newTagDescription.value = '';

        fnGetAllTag();
    } catch (err) {
        vueShowError(err);
    }
};


// 给资源添加标签
const fnAddTagToResource = (tag) => {
    if (!fnIsResourseHaveTag(tag)) {
        resourceTagList.value.push(tag);
    }
};

// 给资源删除标签
const fnDelTagFromResource = (tag) => {
    const index = resourceTagList.value.findIndex((item) => {
        return item.id === tag.id
    });
    if (index !== -1) {
        resourceTagList.value.splice(index, 1);
    }
};

// 保存资源标签
const fnSaveResourceTag = async () => {
    try {
        const resourceId = resourceInfo.value.id;
        const tagIdList = resourceTagList.value.map((item) => {
            return item.id;
        });
        await window.api.ipcSaveResourceTag(resourceId, tagIdList);

        fnGetResourceTag();
    } catch (err) {
        vueShowError(err);
    }
};

// 资源是否有某个标签
const fnIsResourseHaveTag = (tag) => {
    return resourceTagList.value.some((item) => {
        return item.id === tag.id
    });
};

// 搜索标签
const fnSearchTag = () => {
    if (tagSearchKey.value.trim() == '') {
        displayTagList.value = allTagList.value;
    } else {
        displayTagList.value = allTagList.value.filter((item) => {
            return item.name.toLowerCase().includes(tagSearchKey.value.toLowerCase());
        });
    }
};

// -------------------------------- 标签的信息 --------------------------------
</script>

<style scoped>
.browser {
    width: 1600px;
    height: 850px;
    display: flex;
}

.file-tree {
    width: 600px;
    height: 850px;
    overflow: scroll;
    direction: rtl;
}

.file-tree>* {
    direction: ltr;
}

.resource-info {
    width: 1000px;
    height: 850px;
    overflow: scroll;
}

.preview-container {
    max-width: 900px;
    max-height: 400px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.preview-img {
    max-width: 900px;
    max-height: 400px;
    object-fit: contain;
}

.preview-video {
    max-width: 900px;
    max-height: 400px;
    object-fit: contain;
}
</style>