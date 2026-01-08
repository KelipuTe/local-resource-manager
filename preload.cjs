const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
    ipcSelectDir: (options) => ipcRenderer.invoke('ipcSelectDir', options),
    ipcScanDir: (dirPath) => ipcRenderer.invoke('ipcScanDir', dirPath),

    ipcGetResourceInfo: (dbModel) => ipcRenderer.invoke('ipcGetResourceInfo', dbModel),
    ipcGetResourceInfoV2: (dbModel) => ipcRenderer.invoke('ipcGetResourceInfoV2', dbModel),
    ipcSaveResourceInfo: (dbMixModel) => ipcRenderer.invoke('ipcSaveResourceInfo', dbMixModel),

    ipcSeeRenameFile: (nodeData, dbMixModel) => ipcRenderer.invoke('ipcSeeRenameFile', nodeData, dbMixModel),
    ipcDoRenameFile: (nodeData, dbMixModel) => ipcRenderer.invoke('ipcDoRenameFile', nodeData, dbMixModel),
    ipcSeeMoveFile: (nodeData, dbMixModel) => ipcRenderer.invoke('ipcSeeMoveFile', nodeData, dbMixModel),
    ipcDoMoveFile: (nodeData, dbMixModel) => ipcRenderer.invoke('ipcDoMoveFile', nodeData, dbMixModel),

    ipcGetAllTag: () => ipcRenderer.invoke('ipcGetAllTag'),
    ipcCreateTag: (dbModel) => ipcRenderer.invoke('ipcCreateTag', dbModel),
    ipcGetResourceTag: (resourceId) => ipcRenderer.invoke('ipcGetResourceTag', resourceId),
    ipcSaveResourceTag: (resourceId, tagIds) => ipcRenderer.invoke('ipcSaveResourceTag', resourceId, tagIds),
})