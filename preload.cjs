const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
    ipcSelectDir: (options) => ipcRenderer.invoke('ipcSelectDir', options),
    ipcScanDir: (dirPath) => ipcRenderer.invoke('ipcScanDir', dirPath),

    ipcQueryResourceInfo: (dbModel) => ipcRenderer.invoke('ipcQueryResourceInfo', dbModel),
    ipcQueryResourceInfoV2: (dbModel) => ipcRenderer.invoke('ipcQueryResourceInfoV2', dbModel),
    ipcSaveResourceInfo: (dbMixModel) => ipcRenderer.invoke('ipcSaveResourceInfo', dbMixModel),

    ipcSeeRenameFile: (nodeData, dbMixModel) => ipcRenderer.invoke('ipcSeeRenameFile', nodeData, dbMixModel),
    ipcDoRenameFile: (nodeData, dbMixModel) => ipcRenderer.invoke('ipcDoRenameFile', nodeData, dbMixModel),
    ipcSeeMoveFile: (nodeData, dbMixModel) => ipcRenderer.invoke('ipcSeeMoveFile', nodeData, dbMixModel),
    ipcDoMoveFile: (nodeData, dbMixModel) => ipcRenderer.invoke('ipcDoMoveFile', nodeData, dbMixModel),
})