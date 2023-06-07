'use strict';
require('update-electron-app')()

const electron = require('electron');
const {
    app,
    BrowserView,
    BrowserWindow,
    ipcMain,
    Menu,
    webContents
} = electron;
const path = require('path')
const url = require('url')
var fs = require("fs")
let win

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

const AppName = "涼槿"

Menu.setApplicationMenu(null);

function createWindow() {
    win = new BrowserWindow({
        
        width: 800,
        height: 600,
        frame: false,
        icon: path.join(__dirname, '/renderer/dist/logo.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            webviewTag: true,
            spellcheck: false,
            nodeIntegration: true
        },
    })
    win.webContents.setWindowOpenHandler((details) => {
        win.webContents.send('tab', { action: 'add', url: details.url })
        return { action: 'deny' }
    })
    win.loadFile(path.join(__dirname, '/renderer/dist/index.html'))
    //win.loadURL("http://localhost:5173/")
    //   const view = new BrowserView()
    //   win.setBrowserView(view)
    //   view.setBounds({ x: 0, y: 0, width: 300, height: 300 })
    //   view.webContents.loadURL('https://electronjs.org')
}

app.on('ready', () => {
    createWindow()
    ipcMain.on('win-debug', () => {
        win.openDevTools({
            mode: 'detach'
        })
    })
    ipcMain.on('win-close', () => {
        win.close()
    })
    ipcMain.on('win-max', () => {
        win.isMaximized() ? win.unmaximize() : win.maximize()
    })
    ipcMain.on('win-min', () => {
        win.minimize()
    })
    ipcMain.on('web-reg', (e, id) => {
        //console.log(id)
        webContents.fromId(id).setWindowOpenHandler((details) => {
            win.webContents.send('tab', { action: 'add', url: details.url })
            return { action: 'deny' }
        })
        webContents.fromId(id).on('zoom-changed', (e, action) => {
            win.webContents.send('zoom', action)
        })
    })
    ipcMain.on('web-debug', (e, id, x, y) => {
        webContents.fromId(id).openDevTools({
            mode: 'detach'
        })
        webContents.fromId(id).inspectElement(x, y)
    })
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
