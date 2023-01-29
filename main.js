const { app, dialog } = require('electron')
const path = require('path')
const { autoUpdater } = require('electron-updater')

const { Menu, Tray, BrowserWindow, ipcMain, shell } = require('electron')

let tray = null

autoUpdater.checkForUpdatesAndNotify()

// real stuff that does something

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

let win, downWin, webWin, loadWin, child

const createWindows = () => {
  // web process
  webWin = new BrowserWindow({
    icon: 'resources/icon/workericon.ico',
    width: 1000,
    height: 500,
    show: false,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  }).on('close', () => {
    app.quit()
  })

  webWin.loadURL(`file://${__dirname}/app/web.html`)
  webWin.webContents.openDevTools({
    detach: false
  })

  // download process
  downWin = new BrowserWindow({
    icon: 'resources/icon/workericon.ico',
    width: 1000,
    height: 500,
    show: false,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  }).on('close', () => {
    app.quit()
  })

  downWin.loadURL(`file://${__dirname}/app/dwn.html`)
  downWin.webContents.openDevTools({
    detach: false
  })

  // Create the browser window.
  win = new BrowserWindow({
    icon: 'resources/icon/appicon.ico',
    width: 1320,
    height: 730,
    minWidth: 1320,
    minHeight: 730,
    show: false,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  }).on('close', () => {
    app.quit()
  })

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

  win.loadURL(`file://${__dirname}/index.html`)

  autoUpdater.addListener('update-downloaded', (event, releaseNotes, releaseName, releaseDate, updateURL) => {
    win.webContents.send('update-downloaded', {
      releaseNotes: releaseNotes,
      releaseName: releaseName,
      releaseDate: releaseDate,
      updateURL: updateURL
    })
  })

  autoUpdater.addListener('checking-for-update', () => {
    win.webContents.send('checking-for-update')
  })

  autoUpdater.addListener('update-not-available', () => {
    win.webContents.send('update-not-available')
  })

  autoUpdater.addListener('update-available', () => {
    win.webContents.send('update-available')
  })

  loadWin = new BrowserWindow({
    icon: 'resources/icon/appicon.ico',
    width: 300,
    height: 310,
    frame: false,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  }).on('close', () => {
    app.quit()
  })

  loadWin.loadURL(`file://${__dirname}/app/loading.html`)

  setUpIpcHandlers()
  createTray()

}

const createTray = () => {
  tray = new Tray(app.getAppPath() + '\\resources\\icon\\tray.ico')
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Auf Updates prüfen',
      click: () => {
        if (typeof process.env.PORTABLE_EXECUTABLE_DIR !== 'undefined') {
          dialog.showMessageBox({
            'type': 'info',
            'title': 'Panthor Launcher Portable',
            'message': 'Du verwendest die Portable Version des Panthor Launchers, automatische Updates werden nicht unterstützt.',
            'buttons': [
              'Portable Update manuell downloaden',
              'Normale Version downloaden'
            ]
          }, (button) => {
            if (button === 0) {
              shell.openExternal('https://github.com/PanthorDE/PanthorLauncher/releases/latest')
            } else if (button === 1) {
              shell.openExternal('https://panthor.de/download/')
            }
          })
        } else if (typeof process.windowsStore !== 'undefined') {
          shell.openItem('ms-windows-store://downloadsandupdates')
        } else {
          autoUpdater.checkForUpdates()
        }
      }
    },
    {
      label: 'Dev-Tools',
      click: () => {
        toggleDevTools()
      }
    },
    {
      label: 'Restart',
      click: () => {
        app.relaunch()
        app.quit()
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Beenden',
      click: () => {
        app.quit()
      }
    }
  ])
  tray.setToolTip('Panthor Launcher')
  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    win.isMinimized() ? win.restore() : win.minimize()
  })
}

const toggleDevTools = () => {
  win.show()
  loadWin.destroy()
  if (!win || !webWin || !downWin) return
  if (win.webContents.isDevToolsOpened()) {
    win.webContents.closeDevTools()
    webWin.hide()
    downWin.hide()
  } else {
    win.webContents.openDevTools({ detach: true })
    if (child) {
      child.webContents.openDevTools()
    }
    webWin.show()
    downWin.show()
  }
}

const setUpIpcHandlers = () => {
  if (!win || !webWin || !downWin) return
  ipcMain.on('to-dwn', (event, arg) => {
    try {
      downWin.webContents.send('to-dwn', arg)
    } catch (e) {
    }
  })

  ipcMain.on('to-web', (event, arg) => {
    try {
      webWin.webContents.send('to-web', arg)
    } catch (e) {
    }
  })

  ipcMain.on('to-app', (event, arg) => {
    try {
      win.webContents.send('to-app', arg)
    } catch (e) {
    }
  })
}

app.on('window-all-closed', () => {
  ipcMain.removeAllListeners()
})

const shouldQuit = app.requestSingleInstanceLock()

if (!shouldQuit) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (win) {
      if (win.isMinimized()) win.restore()
      if (!win.isVisible()) win.show()
      win.focus()
    }
  })
}

app.on('ready', () => {
  createWindows()
})

app.on('activate', () => {
  if (win === null) {
    createWindows()
  }
})

ipcMain.on('winprogress-change', (event, arg) => {
  win.setProgressBar(arg.progress)
})

ipcMain.on('app-loaded', () => {
  win.show()
  loadWin.destroy()
})

ipcMain.on('open-agreement', () => {
  if (!child) {
    child = new BrowserWindow({
      icon: 'resources/icon/workericon.ico',
      parent: win,
      modal: true,
      show: false,
      reziable: false,
      closable: false,
      maximizable: false,
      minimizable: false,
      center: true,
      width: 640,
      height: 700,
      minWidth: 640,
      minHeight: 700,
      maxWidth: 640,
      maxHeight: 700
    })
    child.loadURL(`file://${__dirname}/app/agreement.html`)
    child.once('ready-to-show', () => {
      child.show()
    })
  }
})

ipcMain.on('close-agreement', () => {
  if (child) {
    child.destroy()
  }
})

ipcMain.on('close-app', () => {
  app.quit()
})

ipcMain.on('focus-window', () => {
  win.focus()
})

ipcMain.on('quitAndInstall', () => {
  app.quit()
})
