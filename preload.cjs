const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
    ipcSelectDir: (options) => ipcRenderer.invoke('ipcSelectDir', options),
    ipcScanDir: (path) => ipcRenderer.invoke('ipcScanDir', path),
    ipcQueryFileInfo: (filename) => ipcRenderer.invoke('ipcQueryFileInfo', filename),
    ipcSaveFileInfo: (model) => ipcRenderer.invoke('ipcSaveFileInfo', model),
    ipcRenameFile: (fullPath, newFileName) => ipcRenderer.invoke('ipcRenameFile', fullPath, newFileName),
})