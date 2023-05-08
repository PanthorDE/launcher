import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { release } from 'node:os'
import { dialog } from 'electron'
import { join } from 'node:path'

import Store from 'electron-store'

switch (process.argv[1]) {
  case '--open-website':
    shell.openExternal('https://panthor.de')
    app.quit()
    break
  case '--open-teamspeak':
    shell.openExternal('ts3server://ts.panthor.de?port=9987')
    app.quit()
    break
}

process.env.DIST_ELECTRON = join(__dirname, '..')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.SRC = join(process.env.DIST_ELECTRON, '../src')
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null
let worker_win: BrowserWindow | null = null


const preload = join(__dirname, '../preload/index.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')

app.setUserTasks([
  {
    program: process.execPath,
    arguments: '--open-website',
    iconPath: process.execPath,
    iconIndex: 0,
    title: 'Website',
    description: 'Panthor Website'
  }, {
    program: process.execPath,
    arguments: '--open-teamspeak',
    iconPath: process.execPath,
    iconIndex: 0,
    title: 'Teamspeak',
    description: 'Panthor Teamspeak'
  }
])


async function createWorker() {
  let hash = 'worker'

  worker_win = new BrowserWindow({
    title: 'Panthor Launcher Worker',
    icon: join(process.env.PUBLIC, 'favicon.ico'),
    width: 500,
    height: 500,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    worker_win.loadURL(`${url}#${hash}`)
    worker_win.webContents.openDevTools()
  } else {
    worker_win.loadFile(indexHtml, { hash: hash })
  }


  worker_win.on('close', () => {
    app.quit()
  })

  worker_win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
}

async function createWindow() {
  win = new BrowserWindow({
    title: 'Panthor Launcher',
    icon: join(process.env.PUBLIC, 'favicon.ico'),
    width: 2000,
    height: 1000,
    minWidth: 2000,
    minHeight: 1000,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(url)
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  win.on('close', () => {
    app.quit()
  })

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
  // win.webContents.on('will-navigate', (event, url) => { }) #344
}

app.whenReady().then(createWindow)
app.whenReady().then(createWorker)

function modUpdateMessageToWorker(event: any, message: any) {
  worker_win.webContents.send('mod:update', message)
}

function modVerifyMessageToWorker(event: any, message: any) {
  worker_win.webContents.send('mod:verify', message)
}

function modOpenFolder(event: any, message: any) {
  shell.openPath(message)
}

function workerStatusUpdateMessageToUI(event: any, message: any) {
  win.webContents.send('worker_status:update', message)
}

function settingsChangedArmaPath(event: any, message: any) {
  worker_win.webContents.send('settings:changedArmaPath', message)
}

function settingsOpenArmaSelect(event: any, message: any) {
  let selected_path = dialog.showOpenDialog({
    filters: [{
      name: 'arma3.exe',
      extensions: ['exe']
    }],
    title: 'Bitte wähle arma3.exe aus',
    properties: ['openFile']
  })

  selected_path.then((result: any) => {
    if (result.filePaths.length > 0 && typeof (result.filePaths[0]) !== 'undefined' && result.filePaths[0].includes('arma3') && result.filePaths[0].includes('.exe')) {
      win.webContents.send('settings:openArmaSelect:result', result.filePaths[0].substring(0, result.filePaths[0].lastIndexOf('\\')) + '\\')
    }
  })
}

function settingsOpenMissionCache(event: any, message: any) {
  shell.showItemInFolder(join(app.getPath('appData'), '..', 'Local', 'Arma 3', 'MPMissionsCache', 'x'))
}

function settingsValidateA3(event: any, message: any) {
  shell.openExternal('steam://validate/107410')
}

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

app.whenReady().then(() => {
  ipcMain.on('mod:update', modUpdateMessageToWorker)
  ipcMain.on('mod:verify', modVerifyMessageToWorker)
  ipcMain.on('mod:openFolder', modOpenFolder)
  ipcMain.on('worker_status:update', workerStatusUpdateMessageToUI)
  ipcMain.on('winprogress-change', (event, arg) => {
    win.setProgressBar(arg.progress / 100)
  })
  ipcMain.on('settings:openArmaSelect', settingsOpenArmaSelect)
  ipcMain.on('settings:openMissionCache', settingsOpenMissionCache)
  ipcMain.on('settings:changedArmaPath', settingsChangedArmaPath)
  ipcMain.on('settings:validateA3', settingsValidateA3)

  Store.initRenderer();
})





