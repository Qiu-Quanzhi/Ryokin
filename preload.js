const { contextBridge, ipcRenderer, webContents } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    winMax: () => ipcRenderer.send('win-max'),
    winMin: () => ipcRenderer.send('win-min'),
    winClose: () => ipcRenderer.send('win-close'),
    winDebug: () => ipcRenderer.send('win-debug'),
    webReg: (id,options) => ipcRenderer.send('web-reg',id,options),
    dialogOpen: (option) => ipcRenderer.invoke('dialog-open',option).then((result)=>{
        return result
    }),
    webDebug: (id,x,y) => ipcRenderer.send('web-debug',id,x,y),
    ext: (id,action,option)=>ipcRenderer.send('ext',id,action,option),
    handleTab: (callback) => ipcRenderer.on('tab', callback),
    handleZoom: (callback) => ipcRenderer.on('zoom', callback),
    handleConsole: (callback)=> ipcRenderer.on('console',callback),
    handleExt: (callback)=> ipcRenderer.on('ext',callback)
})