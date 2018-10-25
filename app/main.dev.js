/* eslint global-require: 0, flowtype-errors/show-errors: 0 */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 * @flow
 */
import { app, BrowserWindow, Tray, Menu, ipcMain } from 'electron';
import MenuBuilder from './menu';

let mainWindow = null;
let loadingWindow = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
  const path = require('path');
  const p = path.join(__dirname, '..', 'app', 'node_modules');
  require('module').globalPaths.push(p);
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
  ).catch(console.log);
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
let tray = null;

function updateTray() {
  const icon = `${__dirname}/assets/icon/tray.jpg`;
  if(tray === null) {
    tray = new Tray(icon);
  }
  const contextMenu = Menu.buildFromTemplate([
    {label: 'Item1', type: 'radio'},
    {label: 'Item2', type: 'radio'},
    {label: 'Item3', type: 'radio', checked: true},
    {label: 'Item4', type: 'radio'}
  ]);
  tray.setToolTip('This is my application.');
  tray.setContextMenu(contextMenu);
}
function createLoadingWindow() {
  loadingWindow = new BrowserWindow(Object.assign({
    width: 580,
    height: 200,
    frame: false,
    show: false
  }, {parent: mainWindow}));

  if (process.env.NODE_ENV === 'development') {
    loadingWindow.loadURL(`${__dirname}/loading.html`);
  } else {
    loadingWindow.loadURL(`file://${__dirname}/client/loading.html`);
  }

  loadingWindow.on('closed', () => {
    loadingWindow = null
  });
  loadingWindow.webContents.on('did-finish-load', () => {
    loadingWindow.show();
  });
}
let flashInterval = null;
let flashCount = 0;
function trayFlash(flash = true) {
  const icons = [`${__dirname}/assets/icon/tray.jpg`, `${__dirname}/assets/icon/tray-transparent.png`];
  if(tray === null) {
    tray = new Tray(icons[0]);
  }
  if (flash) {
    if (!flashInterval) {
      flashInterval = setInterval(() => {
        flashCount += 1;
        tray.setImage(icons[(flashCount) % 2]);
      }, 400);
    }
  } else {
    if (flashInterval) {
      clearInterval(flashInterval);
      flashInterval = null;
    }
    if(tray){
      tray.setImage(icons[0]);
    }
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (loadingWindow) { // 把加载的窗口关闭
      loadingWindow.close();
    }
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();
}

app.on('ready', async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    // 这里因为网络的问题，无法安装，先注释掉
    // await installExtensions();
  }
  createLoadingWindow();
  updateTray();
  createMainWindow();
  ipcMain.on('flashTray', () => {
    trayFlash();
  });
  ipcMain.on('cancelFlashTray', () => {
    trayFlash(false);
  });


});
