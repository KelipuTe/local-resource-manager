const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
    ipcSelectDir: (options) => ipcRenderer.invoke('ipcSelectDir', options),
    ipcScanDir: (dirPath) => ipcRenderer.invoke('ipcScanDir', dirPath),

    ipcQueryFileInfo: (filename) => ipcRenderer.invoke('ipcQueryFileInfo', filename),
    ipcSaveFileInfo: (model) => ipcRenderer.invoke('ipcSaveFileInfo', model),

    ipcSeeRenameFile: (beSelectNode, fileInfo) => ipcRenderer.invoke('ipcSeeRenameFile', beSelectNode, fileInfo),
    ipcDoRenameFile: (beSelectNode, fileInfo) => ipcRenderer.invoke('ipcDoRenameFile', beSelectNode, fileInfo),
    ipcSeeMoveFile: (beSelectNode, fileInfo) => ipcRenderer.invoke('ipcSeeMoveFile', beSelectNode, fileInfo),
    ipcDoMoveFile: (beSelectNode, fileInfo) => ipcRenderer.invoke('ipcDoMoveFile', beSelectNode, fileInfo),
})