// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const express = require("express");
const AthomApi = require("homey").AthomApi;
const config = require("homey/config");
const { default: axios } = require('axios');

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,

    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173/')
  } else {
    mainWindow.loadURL('http://localhost:9021/')
  }
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

ipcMain.handle('login', async (event, arg) => {

  let listener;
  const api = AthomApi;
  api._createApi();

  const app = express();
  const port = await new Promise(resolve => {
    listener = app.listen(() => {
      resolve(listener.address().port);
    });
  });

  const url = `${config.athomApiLoginUrl}?port=${port}&clientId=${config.athomApiClientId}`;
  const subWindow = new BrowserWindow({
    width: 800,
    height: 600,

    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })
  subWindow.loadURL(url);
  let cancelled = false;

  const code = await Promise.race([

    // Input code automatically by webserver
    Promise.resolve().then(async () => {

      const codePromise = new Promise(resolve => {
        app.get('/auth', (req, res) => {
          subWindow.hide()
          res.sendStatus(200);
          if (req.query.code) {
            cancelled = true;
            resolve(req.query.code);
          }
        });
      });
      return codePromise;
    }).then((receivedCode) => {
      if (!receivedCode) {
        throw new Error('Invalid code!');
      }
      return receivedCode;
    }),

    new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!cancelled) {
          ipcMain.send('login-failed');
        }
        reject(new Error('Timeout getting authorization code!'));
      }, 1000 * 60 * 5); // 5 minutes
    }),
  ]);
  subWindow.close();
  listener.close();
  const token = await api._api.authenticateWithAuthorizationCode(code);

  try {
    await api._api.setToken(token);
    const profile = await api.getProfile();

    return {
      token: token,
      profile: profile
    }

  } catch (err) {
    console.error(err);
    throw new Error('Error getting profile!');
  }
})


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
const __config = {
  "CLIENT_ID": "zfGb71fg6imMgX6OfWfABVlzM7e3xKCt8HMVKxy7",
  "CLIENT_SECRET": "wwDdqef7If80P9aCla58AeY8O9QigZDVZOUi1j0tukucRZtuUC1fahWLxW9SGlWoVobRdccYGJjFmFKVZ0aJ9q2GnIF4Sf67JXTrBiPqK456JT08dV0uJH2WjtAq6zF3"
}

const appExpress = express();
appExpress.use(express.static(path.join(path.join(app.getAppPath(), 'compiled').replace('app.asar', 'app.asar.unpacked'))));

appExpress.listen(9021);