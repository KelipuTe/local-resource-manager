const { contextBridge, ipcRenderer } = require('electron')


contextBridge.exposeInMainWorld('api', {
    ipcSelectDir: (options) => ipcRenderer.invoke('ipcSelectDir', options),
    ipcScanDir: (path) => ipcRenderer.invoke('ipcScanDir', path)
})

console.log('preload.js 已加载')