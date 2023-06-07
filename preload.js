const { contextBridge, ipcRenderer, webContents } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    winMax: () => ipcRenderer.send('win-max'),
    winMin: () => ipcRenderer.send('win-min'),
    winClose: () => ipcRenderer.send('win-close'),
    winDebug: () => ipcRenderer.send('win-debug'),
    webReg: (id) => ipcRenderer.send('web-reg',id),
    webDebug: (id,x,y) => ipcRenderer.send('web-debug',id,x,y),
    handleTab: (callback) => ipcRenderer.on('tab', callback),
    handleZoom: (callback) => ipcRenderer.on('zoom', callback),
})