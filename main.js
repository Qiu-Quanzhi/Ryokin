'use strict';

const AppName = "涼槿"
const Version = "23w24g"

const electron = require('electron');
const {
    app,
    //BrowserView,
    BrowserWindow,
    dialog,
    ipcMain,
    Menu,
    webContents,
    //globalShortcut,
    //session
} = electron;
const path = require('path')
const url = require('url')
//var fs = require("fs")
const isUrl = require("is-url")
let win, initExt = false


process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
const ENV = process.env.RYOKIN_ENV
const isWindows = process.platform === 'win32'

const recoverWin = (win) => {
    if (win.isMinimized()) win.restore();
    win.focus();
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (win) {
            recoverWin(win)
        } else {
            if (!isWindows) {
                if (app.isReady()) createWindow();
            }
        }
        if (isWindows) {
            let commands = commandLine.slice();
            let lastCmd = decodeURI(commands.pop());
            if (isUrl(lastCmd)) {
                win.webContents.send('tab', { action: 'add', url: activeUrl })
            } else {
                win.webContents.send('tab', { action: 'add' })
            }
        }
    });
}

Menu.setApplicationMenu(null);

function createWindow() {
    let commands = process.argv.slice();
    let lastCmd = decodeURI(commands.pop().replace('"', ''));
    if (lastCmd=="--preload") app.quit()
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
    let option = Version + (commands.length > (ENV === 'DEV') ? (isUrl(lastCmd) ? '&url=' : '&url=file://') + lastCmd : '')
    win.loadURL(ENV === 'DEV' ? `http://localhost:5173/?ver=${option}` : `file://${path.join(__dirname, '/app/index.html?ver=' + option)}`)
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
        if (input.control && (input.key.toLowerCase() === 'n' || input.key.toLowerCase() === 't')) {
            win.webContents.send('tab', { action: 'add' })
            event.preventDefault()
        }
        if (input.control && input.key.toLowerCase() === 'w') {
            win.webContents.send('tab', { action: 'remove' })
            event.preventDefault()
        }
    })
    ipcMain.handle('dialog-open', async (action, options) => {
        const result = await dialog.showOpenDialogSync(win, options)
        recoverWin(win)
        return result
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
    ipcMain.on('web-reg', (e, id, options) => {
        let web = webContents.fromId(id)
        web.setWindowOpenHandler((details) => {
            win.webContents.send('tab', { action: 'add', url: details.url })
            return { action: 'deny' }
        })
        web.on('zoom-changed', (e, action) => {
            win.webContents.send('zoom', action)
        })
        if (!initExt) {
            web.session.on('extension-loaded', (e, ext) => {
                win.webContents.send('ext', 'load', ext.id, ext.name, ext.version, ext.manifest, ext.path, ext.url)
            })
            web.session.on('extension-unloaded', (e, ext) => {
                win.webContents.send('ext', 'unload', ext.id, ext.name, ext.version, ext.manifest, ext.path, ext.url)
            })
            web.session.on('extension-ready', (e, ext) => {
                win.webContents.send('ext', 'ready', ext.id, ext.name, ext.version, ext.manifest, ext.path, ext.url)
            })
            initExt = true
        }
    })
    ipcMain.on('web-debug', (e, id, x, y) => {
        webContents.fromId(id).openDevTools({
            mode: 'detach'
        })
        webContents.fromId(id).inspectElement(x, y)
    })
    ipcMain.on('ext', (e, id, action, option) => {
        let web = webContents.fromId(id)
        switch (action) {
            case 'load':
                web.session.loadExtension(option, { allowFileAccess: true })
                break
            case 'remove':
                web.session.removeExtension(option)
                break
            case 'get':
                win.webContents.send('ext', 'get', web.session.getExtension(option))
                break
            case 'getAll':
                win.webContents.send('ext', 'getAll', web.session.getExtensionAll())
                break
        }
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
