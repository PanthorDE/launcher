import { app, BrowserWindow, shell, ipcMain, screen, Tray, Menu, ipcRenderer, session, Notification } from 'electron';
import type { Event } from 'electron';
import { release } from 'node:os';
import { dialog } from 'electron';
import path, { join } from 'node:path';
import fs, { existsSync } from 'fs';
import Store from 'electron-store';
import https from 'https';
import unzip from 'unzipper';
import { autoUpdater } from 'electron-updater';
import { promise } from 'ping';
import Winreg from 'winreg';
import { spawn } from 'node:child_process';

switch (process.argv[1]) {
  case '--open-website':
    shell.openExternal('https://panthor.de');
    app.quit();
    break;
  case '--open-teamspeak':
    shell.openExternal('ts3server://ts.panthor.de?port=9987');
    app.quit();
    break;
}

process.env.DIST_ELECTRON = join(__dirname, '..');
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist');
process.env.SRC = join(process.env.DIST_ELECTRON, '../src');
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL ? join(process.env.DIST_ELECTRON, '../public') : process.env.DIST;

autoUpdater.checkForUpdates()

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId("panthor.de");

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null;
let worker_win: BrowserWindow | null = null;

const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = join(process.env.DIST, 'index.html');
let tray: Tray | null = null;

async function createWorker() {
  let hash = 'worker';

  worker_win = new BrowserWindow({
    title: 'Panthor Launcher Worker',
    icon: join(__dirname, '../../src/assets/workericon.ico'),
    width: 1500,
    height: 1500,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    worker_win.loadURL(`${url}#${hash}`);
    worker_win.show();
    worker_win.webContents.openDevTools({ mode: 'detach' });
  } else {
    worker_win.loadFile(indexHtml, { hash: hash });
  }

  worker_win.on('close', () => {
    app.quit();
  });

  worker_win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url);
    return { action: 'deny' };
  });
}

async function createWindow() {
  win = new BrowserWindow({
    title: 'Panthor Launcher',
    icon: join(__dirname, '../../src/assets/webicon.ico'),
    minWidth: 1500,
    minHeight: 900,
    webPreferences: {
      nodeIntegration: true,
      backgroundThrottling: false,
      contextIsolation: false,
    },
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["script-src * data: blob: 'unsafe-inline' 'unsafe-eval'; frame-src * api.panthor.de https: file: file; frame-ancestors * api.panthor.de https: file: file;"],
        'X-Frame-Options': 'ALLOWALL'
      }
    })
  })
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(url);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(indexHtml);
    win.removeMenu()
  }

  win.on('close', () => {
    app.quit();
  });

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('ts3server:')) shell.openExternal(url);
    return { action: 'deny' };
  });
  // win.webContents.on('will-navigate', (event, url) => { }) #344
}

const toggleDevTools = () => {
  if (!win || !worker_win) return
  win.show()
  if (win.webContents.isDevToolsOpened()) {
    win.webContents.closeDevTools()
    worker_win.hide()
  } else {
    win.webContents.openDevTools()
    worker_win.show()
  }
}

const createTray = () => {
  tray = new Tray(join(__dirname, '../../src/assets/webicon.ico'))
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Auf Updates prüfen',
      click: () => {
        if (typeof process.env.PORTABLE_EXECUTABLE_DIR !== 'undefined') {
          dialog.showMessageBox(win, {
            'type': 'info',
            'title': 'Panthor Launcher Portable',
            'message': 'Du verwendest die Portable Version des Panthor Launchers, automatische Updates werden nicht unterstützt.',
            'buttons': [
              'Update manuell downloaden',
              'Normale Version downloaden'
            ]
          }).then((result) => {
            if (result.response === 0) {
              shell.openExternal('https://github.com/PanthorDE/launcher/releases/latest')
            } else if (result.response === 1) {
              shell.openExternal('https://panthor.de/download/')
            }
          })
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

app.whenReady().then(createWorker);
app.whenReady().then(createWindow);

if (!process.env.VITE_DEV_SERVER_URL) {
  app.whenReady().then(createTray);
}

function launchGame(event: any, uiparams: string[], arma_path: string) {
  let params = uiparams.concat([
    '-noLauncher',
    '-useBE'
  ])

  console.log("Launching Arma 3 with params: " + params.join(' '))
  let result = spawn(join(arma_path + '\\arma3launcher.exe'), params, { detached: true, stdio: 'ignore' });
  result.unref();

  setTimeout(() => {
    win.minimize();
  }, 5000)
}

function downloadStaticFile(path: string, target: string): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    const fileStream = fs.createWriteStream(target);

    const req = https.get('https://static.panthor.de/arma/' + path, (res) => {
      res.on('data', (chunk) => {
        fileStream.write(chunk);
      });

      res.on('end', () => {
        fileStream.end();
        resolve(true)
      });

      res.on('error', (error) => {
        reject(error);
      });
    });

    req.end();
  })
}

function pingServer(event: any, ip: string) {
  promise.probe(ip).then((res) => {
    setTimeout(() => {
      win.webContents.send('ping:result', ip, parseInt(res.avg));
    }, 1000);
  });
}

function checkRegKeys() {
  const a3_registry_keys = [
    {
      key: '\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Steam App 107410',
      index: 3,
    },
    {
      key: '\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Steam App 107410',
      index: 3,
    },
    {
      key: '\\SOFTWARE\\WOW6432Node\\bohemia interactive studio\\ArmA 3',
      index: 0,
    },
    {
      key: '\\SOFTWARE\\WOW6432Node\\bohemia interactive\\arma 3',
      index: 1,
    },
  ]

  try {
    a3_registry_keys.forEach((cur) => {
      let regKey = new Winreg({
        hive: Winreg.HKLM,
        key: cur.key,
      });

      if (regKey) {
        regKey.keyExists((err, exists) => {
          if (err) throw err;
          if (exists) {
            regKey.values((err, items) => {
              if (err) throw err;
              if (items[cur.index]) {
                if (existsSync(items[cur.index].value + '\\arma3.exe')) {
                  win.webContents.send('checkRegKeys:result', items[cur.index].value);
                }
              }
            });
          }
        });
      }
    });
  } catch (err) {
    console.log(err);
  }
}

function modInitMessageToWorker(event: any, mods: any, path: any) {
  worker_win.webContents.send('mods:init', mods, path);
}

function modUpdateMessageToWorker(event: any, message: any) {
  worker_win.webContents.send('mod:update', message);
}

function modVerifyMessageToWorker(event: any, message: any) {
  worker_win.webContents.send('mod:verify', message);
}

function modStopMessageToWorker(event: any, message: any) {
  worker_win.webContents.send('mod:stop', message);
}

function modOpenFolder(event: any, message: any) {
  shell.openPath(message);
}

function workerStatusUpdateMessageToUI(event: any, mod_id: number, message: string) {
  win.webContents.send('worker:update', mod_id, message);
}

function workerStatusUpdateRequest(event: any) {
  worker_win.webContents.send('worker:requestUpdate');
}

function settingsChangedArmaPath(event: any, message: any) {
  worker_win.webContents.send('settings:changedArmaPath', message);
}

function settingsOpenArmaSelect(event: any, message: any) {
  let selected_path = dialog.showOpenDialog({
    filters: [
      {
        name: 'arma3.exe',
        extensions: ['exe'],
      },
    ],
    title: 'Bitte wähle arma3.exe aus',
    properties: ['openFile'],
  });

  selected_path.then((result: any) => {
    if (
      result.filePaths.length > 0 &&
      typeof result.filePaths[0] !== 'undefined' &&
      result.filePaths[0].includes('arma3') &&
      result.filePaths[0].includes('.exe')
    ) {
      win.webContents.send(
        'settings:openArmaSelect:result',
        result.filePaths[0].substring(0, result.filePaths[0].lastIndexOf('\\')) + '\\'
      );
    }
  });
}

function settingsOpenMissionCache(event: any, message: any) {
  shell.showItemInFolder(join(app.getPath('appData'), '..', 'Local', 'Arma 3', 'MPMissionsCache', 'Panthor.RL_Map.pbo'));
}

function settingsValidateA3(event: any, message: any) {
  shell.openExternal('steam://validate/107410');
}

function downloadTfar() {
  let filePath = app.getPath('downloads') + '\\' + 'PanthorTFAR_latest.ts3_plugin';

  win.webContents.send('dl:tfar:status', 2);
  let result = downloadStaticFile('PanthorTFAR_latest.ts3_plugin', filePath);
  result.then((value) => {
    if (value) {
      win.webContents.send('dl:tfar:status', 3);
      let shellResponse = shell.openPath(app.getPath('downloads') + '\\' + 'PanthorTFAR_latest.ts3_plugin');

      if (!shellResponse) {
        win.webContents.send('dl:tfar:status', 4);
        let stream = fs.createReadStream(filePath).pipe(unzip.Extract({ path: app.getPath('downloads') + '\\Panthor' }))
        stream.on('close', () => {
          try {
            fs.unlinkSync(app.getPath('downloads') + '\\Panthor\\package.ini')
          } catch (err) {
            console.log(err)
          }
          shell.showItemInFolder(app.getPath('downloads') + '\\Panthor\\plugins\\TFAR_win64.dll')

          setTimeout(() => {
            win.webContents.send('dl:tfar:status', 0);
          }, 5000);
        })
      } else {
        setTimeout(() => {
          win.webContents.send('dl:tfar:status', 0);
        }, 3000);
      }
    } else {
      win.webContents.send('dl:tfar:status', 5);
    }
  });
}

function downloadSound() {
  let filePath = app.getPath('downloads') + '\\' + 'Panthor.ts3_soundpack';

  win.webContents.send('dl:sound:status', 2);
  let result = downloadStaticFile('Panthor.ts3_soundpack', filePath);
  result.then((value) => {
    if (value) {
      win.webContents.send('dl:sound:status', 3);
      shell.openPath(app.getPath('downloads') + '\\' + 'Panthor.ts3_soundpack');

      setTimeout(() => {
        win.webContents.send('dl:sound:status', 0);
      }, 3000);
    } else {
      win.webContents.send('dl:sound:status', 5);
    }
  });
}

function downloadSkin() {
  let filePath = app.getPath('downloads') + '\\' + 'PanthorSkin.ts3_addon';

  win.webContents.send('dl:skin:status', 2);
  let result = downloadStaticFile('PanthorSkin.ts3_addon', filePath);
  result.then((value) => {
    if (value) {
      win.webContents.send('dl:skin:status', 3);
      shell.openPath(app.getPath('downloads') + '\\' + 'PanthorSkin.ts3_addon');

      setTimeout(() => {
        win.webContents.send('dl:skin:status', 0);
      }, 3000);
    } else {
      win.webContents.send('dl:skin:status', 5);
    }
  });
}

function getArmaProfiles(event: Event, message: any) {
  const submitResults = function (result: typeof profiles) {
    win.webContents.send('settings:getArmaProfiles:result', result);
  };
  const armaProfiles = app.getPath('documents') + '\\Arma 3 - Other Profiles';

  if (!fs.existsSync(armaProfiles)) return submitResults([]);

  if (!fs.lstatSync(armaProfiles).isDirectory()) return submitResults([]);
  const profiles = fs
    .readdirSync(armaProfiles)
    .filter((file) => fs.lstatSync(path.join(armaProfiles, file)).isDirectory())
    .map(decodeURIComponent);
  submitResults(profiles);
}

function createNotification(event: Event, title: string, body: string) {
  const notification = new Notification({
    title: title,
    body: body
  })

  notification.show()
}

app.on('window-all-closed', () => {
  win = null;
  if (process.platform !== 'darwin') app.quit();
});

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

app.whenReady().then(() => {
  ipcMain.on('mods:init', modInitMessageToWorker);
  ipcMain.on('mod:update', modUpdateMessageToWorker);
  ipcMain.on('mod:verify', modVerifyMessageToWorker);
  ipcMain.on('mod:stop', modStopMessageToWorker);
  ipcMain.on('mod:openFolder', modOpenFolder);
  ipcMain.on('worker:update', workerStatusUpdateMessageToUI);
  ipcMain.on('worker:requestUpdate', workerStatusUpdateRequest);
  ipcMain.on('winprogress-change', (event: any, progress: number) => {
    win.setProgressBar(progress / 100);
  });
  ipcMain.on('settings:openArmaSelect', settingsOpenArmaSelect);
  ipcMain.on('settings:openMissionCache', settingsOpenMissionCache);
  ipcMain.on('settings:changedArmaPath', settingsChangedArmaPath);
  ipcMain.on('settings:validateA3', settingsValidateA3);
  ipcMain.on('settings:getArmaProfiles', getArmaProfiles);

  ipcMain.on('launchGame:request', launchGame);

  ipcMain.on('ping:request', pingServer);

  ipcMain.on('checkRegKeys:request', checkRegKeys);

  ipcMain.on('dl:tfar', downloadTfar);
  ipcMain.on('dl:sound', downloadSound);
  ipcMain.on('dl:skin', downloadSkin);

  ipcMain.on('notification:create', createNotification);

  Store.initRenderer();

  setTimeout(() => {
    win.webContents.send('version', app.getVersion());
  }, 1000);
});
