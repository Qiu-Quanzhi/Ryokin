'use strict';

const electron = require('electron');
const {
    app,
    BrowserView,
    BrowserWindow,
    ipcMain,
    Menu,
    webContents, 
    dialog, 
    globalShortcut
} = electron;
const path = require('path')
const url = require('url')
var fs = require("fs")
const isUrl=require("is-url")
let win

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
const ENV = process.env.RYOKIN_ENV
const isWindows = process.platform === 'win32'

const AppName = "涼槿"
const Version = "23w24d"

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    } else {
      if (!isWindows) {
        if (app.isReady()) createWindow();
      }
    }
    if (isWindows) {
      let commands = commandLine.slice();
      let lastCmd = decodeURI(commands.pop());
      if (isUrl(lastCmd)){
        win.webContents.send('tab', { action: 'add', url: activeUrl })
    }else{
        win.webContents.send('tab', { action: 'add'})
    }
    }
  });
}

Menu.setApplicationMenu(null);

function createWindow() {
    win = new BrowserWindow({
        minWidth: 450,
        minHeight: 150,
        width: 800,
        height: 600,
        frame: false,
        show: false,
        icon: path.join(__dirname, '/icons/logo.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            webviewTag: true,
            spellcheck: false,
            nodeIntegration: true
        },
    })
    win.loadURL(ENV === 'DEV'?`http://localhost:5173/?ver=${Version}`:`file://${path.join(__dirname, '/app/index.html?ver='+Version)}`)
    if (ENV === "DEV") {
        win.webContents.openDevTools()
    }
    win.once('ready-to-show', () => {
        win.show()
        win.focus()
    })
}

app.on('ready', () => {
    createWindow()
    win.webContents.on('before-input-event', (event, input) => {
      if (input.control && input.key.toLowerCase() === 'n') {
        win.webContents.send('tab', { action: 'add' })
        event.preventDefault()
      }
    })
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
