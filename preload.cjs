const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
    ipcSelectDir: (options) => ipcRenderer.invoke('ipcSelectDir', options),
    ipcScanDir: (dirPath) => ipcRenderer.invoke('ipcScanDir', dirPath),

    ipcSeeRenameFile: (nodeData, dbModel) => ipcRenderer.invoke('ipcSeeRenameFile', nodeData, dbModel),
    ipcDoRenameFile: (nodeData, dbModel) => ipcRenderer.invoke('ipcDoRenameFile', nodeData, dbModel),
    ipcSeeMoveFile: (nodeData, dbModel) => ipcRenderer.invoke('ipcSeeMoveFile', nodeData, dbModel),
    ipcDoMoveFile: (nodeData, dbModel) => ipcRenderer.invoke('ipcDoMoveFile', nodeData, dbModel),

    ipcGetResourceInfo: (dbModel) => ipcRenderer.invoke('ipcGetResourceInfo', dbModel),
    ipcGetResourceInfoV2: (dbModel) => ipcRenderer.invoke('ipcGetResourceInfoV2', dbModel),
    ipcSaveResourceInfo: (dbModel) => ipcRenderer.invoke('ipcSaveResourceInfo', dbModel),

    ipcGetCreateByInfo: (dbModel) => ipcRenderer.invoke('ipcGetCreateByInfo', dbModel),
    ipcSaveCreateByInfo: (dbModel) => ipcRenderer.invoke('ipcSaveCreateByInfo', dbModel),

    ipcGetAllTag: () => ipcRenderer.invoke('ipcGetAllTag'),
    ipcCreateTag: (dbModel) => ipcRenderer.invoke('ipcCreateTag', dbModel),
    ipcGetResourceTag: (resourceId) => ipcRenderer.invoke('ipcGetResourceTag', resourceId),
    ipcSaveResourceTag: (resourceId, tagIds) => ipcRenderer.invoke('ipcSaveResourceTag', resourceId, tagIds),
})