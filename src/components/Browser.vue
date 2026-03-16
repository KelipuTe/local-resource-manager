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
                    <p>目录: {{ beSelectNode.dirPath }}
                        <button @click="fnOpenLocalFolder" class="btn-green btn-medium">打开对应的本地文件夹</button>
                    </p>
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
                        <button @click="fnClearResourceInfo" class="btn-green btn-medium">清空</button>
                        <button @click="fnGetResourceInfo" class="btn-green btn-medium">查询（文件名）</button>
                        <button @click="fnGetResourceInfoV2" class="btn-green btn-medium">查询（来源+资源的id）</button>
                        <button @click="fnSaveResourceInfo" class="btn-orange btn-medium">保存</button>
                    </div>
                    <div class="form-group">
                        <button @click="fnSeeRenameFile" class="btn-green btn-medium">重命名（预览）</button>
                        <button @click="fnDoRenameFile" class="btn-orange btn-medium">重命名（执行）</button>
                        <button @click="fnSeeMoveFile" class="btn-green btn-medium">归档（预览）</button>
                        <button @click="fnDoMoveFile" class="btn-orange btn-medium">归档（执行）</button>
                    </div>
                    <div class="form-group">
                        <button @click="fnAnalyzeBilibili" class="btn-green btn-medium">解析（B站资源）</button>
                        <button @click="fnAnalyzePixiv" class="btn-green btn-medium">解析（Pixiv资源）</button>
                    </div>
                </div>
                <div class="form-container">
                    <div v-for="(value, key) in resourceInfo" :key="key" class="form-group">
                        <label class="input-label">{{ fnGetResourceInfoKeyName(key) }}</label>

                        <div v-if="key === 'filename'">
                            <input :value="value" type="text" class="input-long"
                                @input="fnChangeResourceInfoValue(key, $event.target.value)" />
                            <button @click="fnMakeFilename" class="btn-blue btn-medium">构造</button>
                        </div>

                        <div v-else-if="key === 'source'">
                            <input :value="value" type="text" class="input-medium"
                                @input="fnChangeResourceInfoValue(key, $event.target.value)" />
                            <select :value="value" @change="fnChangeResourceInfoValue(key, $event.target.value)" class="input-short">
                                <option value="0">请选择</option>
                                <option value="unknow">未知</option>
                                <option value="bilibili">bilibili</option>
                                <option value="pixiv">pixiv</option>
                                <option value="x">x(twitter)</option>
                            </select>
                        </div>

                        <div v-else-if="key === 'resourceId'">
                            <input :value="value" type="text" class="input-long"
                                @input="fnChangeResourceInfoValue(key, $event.target.value)" />
                            <button @click="fnMakeResourseId" class="btn-blue btn-medium">构造</button>
                        </div>

                        <div v-else-if="key === 'keyPoint'">
                            <input :value="value" type="text" class="input-medium"
                                @input="fnChangeResourceInfoValue(key, $event.target.value)" />
                            <select :value="value" @change="fnChangeResourceInfoValue(key, $event.target.value)" class="input-short">
                                <option value="0">请选择</option>
                                <option value="画面">画面</option>
                                <option value="声音">声音</option>
                                <option value="文字">文字</option>
                            </select>
                        </div>

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
                <span>资源所属用户的信息</span>
                <button @click="createByInfoIsVisible = !createByInfoIsVisible" class="btn-blue btn-medium">
                    {{ createByInfoIsVisible ? '收起' : '展开' }}
                </button>
            </h3>
            <div v-if="createByInfoIsVisible">
                <div class="form-container">
                    <div class="form-group">
                        <button @click="fnClearCreateByInfo" class="btn-green btn-medium">清空</button>
                        <button @click="vueGetCreateByInfo" class="btn-green btn-medium">查询（来源+用户的id）</button>
                        <button @click="vueSaveCreateByInfo" class="btn-orange btn-medium">保存</button>
                    </div>
                </div>
                <div class="form-container">
                    <div v-for="(value, key) in createByInfo" :key="key" class="form-group">
                        <label class="input-label">{{ fnGetCreateByInfoKeyName(key) }}</label>
                        <input :value="value" type="text" class="input-long"
                            @input="fnChangeCreateByInfoValue(key, $event.target.value)" />
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
                        <span v-for="tag in displayTagList" :key="tag.id" class="btn-medium"
                            :class="fnIsResourseHaveTag(tag) ? 'btn-green' : 'btn-blue'">
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
import utilTime from '../util/time.js'

// ---------------- 共用的东西 ----------------

const gfnShowInfo = inject('gfnShowInfo')
const gfnShowError = inject('gfnShowError')

// -------------------------------- 共用的东西 --------------------------------

// ---------------- 文件树 ----------------

// 根目录
const rootDir = localStorage.getItem('rootDir');

// 文件树根目录结点数据
const rootNodeData = ref({
    dirPath: rootDir,
    name: '根目录',
    isDir: true,
    extname: '',
    fullPath: rootDir,
    children: [],
    childrenIsLoad: false
})

// 根目录是否已扫描
const rootDirIsScan = ref(false)

// 扫描根目录
const fnScanRootDir = async function () {
    const result = await window.api.ipcScanDir(rootDir)

    rootNodeData.value.children = result;
    rootNodeData.value.childrenIsLoad = true;
    rootDirIsScan.value = true;

    beSelectNode.value = null;
    resourceInfo.value = null;
}

// 被选中的文件树结点
const beSelectNode = ref(null)

// 处理文件树结点被选中事件
const fnTreeNodeBeSelect = async (nodeData) => {
    beSelectNode.value = nodeData

    if (!nodeData.isDir) {
        resourceInfo.value = { ...resourceInfoDefault };
        createByInfo.value = { ...createByInfoDefault };

        await fnGetResourceInfo();

        if (resourceInfo.value != null) {
            if (resourceInfo.value.id != 0) {
                createByInfo.value.source = resourceInfo.value.source;
                createByInfo.value.userId = resourceInfo.value.userId;
                await vueGetCreateByInfo();
            }

            await fnGetAllTag();
            if (resourceInfo.value.id != 0) {
                await fnGetResourceTag();
            }
        }
    }
}

// -------------------------------- 文件树 --------------------------------


const fnOpenLocalFolder = async () => {
    if (beSelectNode.value == null) {
        gfnShowError(new Error('没有选中的文件树结点'));
        return;
    }

    try {
        const argBeSelectNode = JSON.parse(JSON.stringify(beSelectNode.value))
        await window.api.ipcOpenLocalFolder(argBeSelectNode);
    } catch (err) {
        gfnShowError(err);
    }
};

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

// 控制【资源的信息】这个区域可不可见
const resourceInfoIsVisible = ref(true)

const resourceInfoDefault = {
    id: 0,
    filename: '0',
    filetype: '0',
    source: '0',
    resourceId: '0',
    resourceIndex: 1,
    userId: '0',
    resourceName: '0',
    extInfo: '0',
    publishAt: '0',
    keyPoint: '0',
    summary: '0',
    status: 1,
    visitAt: 'CURRENT_TIMESTAMP',
    visitTimes: 1,
    createAt: 'CURRENT_TIMESTAMP',
    updateAt: 'CURRENT_TIMESTAMP',
}

// 资源的数据
const resourceInfo = ref(null)

// 字段标签的映射
const resourceInfoKeyNameMap = {
    id: '自增主键',
    filename: '文件名',
    filetype: '文件类型',
    source: '资源的来源',
    resourceId: '资源的id',
    resourceIndex: '资源的下标',
    userId: '资源所属用户的id',
    resourceName: '资源的名称',
    extInfo: '资源的额外信息',
    publishAt: '资源的发布时间',
    keyPoint: '我认为资源的重点是什么',
    summary: '我对资源内容的总结（对资源内容的总结或者描述、我的思考、其他人的思考、等）',
    status: '资源的状态',
    visitAt: '我最后一次访问资源的时间',
    visitTimes: '我访问资源的总次数',
    createAt: '创建时间',
    updateAt: '修改时间'
}
// 获取字段标签的名称
const fnGetResourceInfoKeyName = (key) => {
    if (resourceInfoKeyNameMap[key] != null) {
        return resourceInfoKeyNameMap[key];
    }
    return key;
}

// 相当于 v-model，让数据源和输入框同步
const fnChangeResourceInfoValue = (key, value) => {
    if (resourceInfo.value != null) {
        resourceInfo.value[key] = value;
    }
};

const fnClearResourceInfo = () => {
    resourceInfo.value = { ...resourceInfoDefault };
};

// 获取资源的数据
const fnGetResourceInfo = async () => {
    const nodeData = beSelectNode.value;
    if (!nodeData.isDir) {
        try {
            const dbModel = { filename: nodeData.name };
            const result = await window.api.ipcGetResourceInfo(dbModel);
            resourceInfo.value = { ...result };
        } catch (err) {
            gfnShowError(err);
        }
    }
};

// 获取资源的数据
const fnGetResourceInfoV2 = async () => {
    const nodeData = beSelectNode.value;
    if (!nodeData.isDir) {
        try {
            const dbModel = {
                source: resourceInfo.value.source,
                resourceId: resourceInfo.value.resourceId,
            };
            const result = await window.api.ipcGetResourceInfoV2(dbModel);
            resourceInfo.value = { ...resourceInfoDefault, ...result };
        } catch (err) {
            gfnShowError(err);
        }
    }
};

// 保存资源的数据
const fnSaveResourceInfo = async () => {
    if (resourceInfo.value != null) {
        try {
            const argModel = { ...resourceInfo.value }
            const result = await window.api.ipcSaveResourceInfo(argModel);
            gfnShowInfo('操作成功：<br>' + JSON.stringify(result));
        } catch (error) {
            gfnShowError(error);
        }
    }
}

// 构造文件名（资源的id_资源的下标_重命名时间）
const fnMakeFilename = () => {
    if (resourceInfo.value == null) {
        return;
    }
    const resourceIndex = resourceInfo.value.resourceIndex;
    const resourceId = resourceInfo.value.resourceId;
    const dateTime = utilTime.getNowDateTimeNumMode()
    const newName = `${resourceId}_${resourceIndex}_${dateTime}`;
    fnChangeResourceInfoValue('filename', newName);
};

// 构造资源的id
const fnMakeResourseId = () => {
    if (resourceInfo.value == null) {
        return;
    }
    const dateTime = utilTime.getNowDateTimeNumMode();
    fnChangeResourceInfoValue('resource_id', dateTime);
};

const fnSeeRenameFile = async () => {
    if (beSelectNode.value == null) {
        gfnShowError(new Error('没有选中的文件树结点'));
        return;
    }

    try {
        const argBeSelectNode = JSON.parse(JSON.stringify(beSelectNode.value))
        const argFileInfo = JSON.parse(JSON.stringify(resourceInfo.value))
        const result = await window.api.ipcSeeRenameFile(argBeSelectNode, argFileInfo);
        const needRenameFileList = result.needRenameFileList;
        let msg = '需要重命名的文件：<br>' + needRenameFileList.join('<br>');
        gfnShowInfo(msg);
    } catch (err) {
        gfnShowError(err);
    }
}

const fnDoRenameFile = async () => {
    if (beSelectNode.value == null) {
        gfnShowError(new Error('没有选中的文件树结点'));
        return;
    }

    try {
        const argBeSelectNode = JSON.parse(JSON.stringify(beSelectNode.value))
        const argFileInfo = JSON.parse(JSON.stringify(resourceInfo.value))
        const result = await window.api.ipcDoRenameFile(argBeSelectNode, argFileInfo);
        const dirPath = result.dirPath;
        const renameFileList = result.renameFileList;
        let msg = `目录【${dirPath}】<br>`
        for (const item of renameFileList) {
            msg += `文件【${item.oldFilename}】<br>被重命名为【${item.newFilename}】<br>`
        }
        gfnShowInfo(`操作成功：<br>${msg}`);
    } catch (error) {
        gfnShowError(error);
    }
};

const fnSeeMoveFile = async () => {
    if (beSelectNode.value == null) {
        gfnShowError(new Error('没有选中的文件树结点、资源的信息不全'));
        return;
    }

    try {
        const argBeSelectNode = JSON.parse(JSON.stringify(beSelectNode.value))
        const argFileInfo = JSON.parse(JSON.stringify(resourceInfo.value))
        const result = await window.api.ipcSeeMoveFile(argBeSelectNode, argFileInfo);
        const dirPath = result.dirPath;
        const newDirPath = result.newDirPath;
        const needMoveFileList = result.needMoveFileList;
        let msg = '以下文件：<br>' + needMoveFileList.join('<br>') + '<br>' +
            `将被从目录【${dirPath}】<br>移动到目录【${newDirPath}】`
        gfnShowInfo(msg);
    } catch (err) {
        gfnShowError(err);
    }
}

const fnDoMoveFile = async () => {
    if (!beSelectNode.value || !resourceInfo.value) {
        gfnShowError(new Error('没有选中的文件树结点、资源的信息不全'));
        return;
    }

    try {
        const argBeSelectNode = JSON.parse(JSON.stringify(beSelectNode.value))
        const argFileInfo = JSON.parse(JSON.stringify(resourceInfo.value))
        const result = await window.api.ipcDoMoveFile(argBeSelectNode, argFileInfo);
        const moveFileList = result.moveFileList;
        let msg = ''
        for (const item of moveFileList) {
            msg += `文件【${item.filename}】的全路径<br>` +
                `从【${item.oldFullPath}】<br>改成【${item.newFullPath}】<br>`
        }
        gfnShowInfo(`操作成功：<br>${msg}`);
    } catch (err) {
        gfnShowError(err);
    }
};

const fnAnalyzeBilibili = async () => {
    if (!beSelectNode.value) {
        gfnShowError(new Error('没有选中的文件树结点'));
        return;
    }

    const fullFilename = beSelectNode.value.name;

    let parts = fullFilename.split('.');
    if (parts.length !== 2) {
        gfnShowError(new Error('文件名格式不符合要求，{xxxx}.{filetype}'));
        return;
    }
    const filename = parts[0];
    const filetype = parts[1];

    try {
        const argBeSelectNode = JSON.parse(JSON.stringify(beSelectNode.value))
        const result = await window.api.ipcAnalyzeBilibili(argBeSelectNode);

        resourceInfo.value.filename = filename;
        resourceInfo.value.filetype = filetype;
        resourceInfo.value.source = 'bilibili';
        resourceInfo.value.resourceId = result.parsedXml.movie.uniqueid[0]._;
        resourceInfo.value.userId = result.parsedXml.movie.actor[0].role[0];
        resourceInfo.value.resourceName = result.parsedXml.movie.title[0];
        resourceInfo.value.publishAt = result.parsedXml.movie.premiered[0] + ' 00:00:00';
        resourceInfo.value.keyPoint = '0';

        createByInfo.value.source = 'bilibili';
        createByInfo.value.userId = result.parsedXml.movie.actor[0].role[0];
        createByInfo.value.username = result.parsedXml.movie.actor[0].name[0];
    } catch (err) {
        gfnShowError(err);
    }
};

const fnAnalyzePixiv = async () => {

};

// -------------------------------- 资源的信息 --------------------------------

// ---------------- 资源所属用户的信息 ----------------

// 控制【资源所属用户的信息】这个区域可不可见
const createByInfoIsVisible = ref(true)

const createByInfoDefault = {
    id: 0,
    source: '0',
    userId: '0',
    username: '0',
    extInfo: '0',
    sameAs: '0',
    createAt: 'CURRENT_TIMESTAMP',
    updateAt: 'CURRENT_TIMESTAMP',
}

const createByInfo = ref(null)

// 字段标签映射
const createByInfoKeyNameMap = {
    id: '自增主键',
    source: '资源所属用户的来源',
    userId: '资源所属用户的id',
    username: '资源所属用户的名称',
    extInfo: '资源所属用户的额外信息',
    sameAs: '不同来源的同一个用户',
    createAt: '创建时间',
    updateAt: '修改时间'
}

// 获取字段标签的名称
const fnGetCreateByInfoKeyName = (key) => {
    if (createByInfoKeyNameMap[key] != null) {
        return createByInfoKeyNameMap[key];
    }
    return key;
}

// 相当于 v-model，让数据源和输入框同步
const fnChangeCreateByInfoValue = (key, value) => {
    if (createByInfo.value != null) {
        createByInfo.value[key] = value;
    }
};

const fnClearCreateByInfo = () => {
    createByInfo.value = { ...createByInfoDefault }
};

// 获取资源所属用户的数据
const vueGetCreateByInfo = async () => {
    const nodeData = beSelectNode.value
    if (!nodeData.isDir) {
        try {
            const dbModel = {
                source: createByInfo.value.source,
                userId: createByInfo.value.userId,
            }
            const result = await window.api.ipcGetCreateByInfo(dbModel)
            createByInfo.value = { ...result }
        } catch (error) {
            gfnShowError(error);
        }
    }
};

// 保存资源所属用户的数据
const vueSaveCreateByInfo = async () => {
    if (createByInfo.value != null) {
        try {
            const dbModel = { ...createByInfo.value }
            const result = await window.api.ipcSaveCreateByInfo(dbModel);
            gfnShowInfo('操作成功：<br>' + JSON.stringify(result));
        } catch (err) {
            gfnShowError(err);
        }
    }
}

// -------------------------------- 资源所属用户的数据 --------------------------------

// ---------------- 标签的信息 ----------------

// 控制【标签的信息】这个区域可不可见
const resourceTagIsVisible = ref(true);

const allTagList = ref([]); // 所有的标签

const newTagName = ref(''); // 新增标签的名称
const newTagDescription = ref(''); // 新增标签的描述

const resourceTagList = ref([]); // 资源拥有的标签
const displayTagList = ref([]); // 显示的标签

const tagSearchKey = ref(''); // 标签搜索关键词

// 获取所有的标签
const fnGetAllTag = async () => {
    try {
        const result = await window.api.ipcGetAllTag();
        allTagList.value = result;
        displayTagList.value = result;
    } catch (err) {
        gfnShowError(err)
    }
};

// 创建新标签
const fnCreateNewTag = async () => {
    if (newTagName.value == null || newTagName.value.trim() == '' || newTagName.value.trim() == '0') {
        gfnShowError(new Error('标签名称不能为空'));
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
        gfnShowError(err);
    }
};

// 获取资源的标签
const fnGetResourceTag = async () => {
    try {
        const resourceId = resourceInfo.value.id
        const result = await window.api.ipcGetResourceTag(resourceId);
        resourceTagList.value = result;
    } catch (err) {
        gfnShowError(err);
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

// 保存资源的标签
const fnSaveResourceTag = async () => {
    try {
        const resourceId = resourceInfo.value.id;
        const tagIdList = resourceTagList.value.map((item) => {
            return item.id;
        });
        await window.api.ipcSaveResourceTag(resourceId, tagIdList);

        fnGetResourceTag();
    } catch (err) {
        gfnShowError(err);
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

// 页面加载的时候，初始化
fnScanRootDir();

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