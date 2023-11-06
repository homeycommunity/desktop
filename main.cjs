const { got } = require("got-cjs");

const { tarGzGlob } = require("targz-glob");
const FormData = require("form-data");
const cors = require("cors");
// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const express = require("express");
const { Readable } = require("stream");
const config = require("homey/config");
const { default: axios } = require("axios");
const { AthomCloudAPI } = require('athom-api');
/**
 * @type {import('athom-api').AthomCloudAPI}
 */
let api = null;
const server = 'https://homeycommunity.space';
function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 800,

    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  mainWindow.loadURL("http://localhost:9021/");

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}
let store = {
  _settings: {},
  get () {
    return this._settings;
  },
  set (value) {
    this._settings = value;

  }
}
function bufferToStream (buffer) {
  const stream = Readable.from(Buffer.from(buffer));

  return stream;
}


async function getApp (buffer) {
  const env = await tarGzGlob(bufferToStream(buffer), "app.json");
  return env.get("app.json");
}

/**
  *
  * @param {import("electron").IpcMainInvokeEvent} event
  * @param {import("athom-api").AthomCloudAPI.Homey} arg
  */
async function install (event, arg) {
  const homeyId = arg._id;

  const lastVersion = await got.get(`${server}/api/version/app`).json();


  const _cloudUser = await api.getAuthenticatedUser();
  const _cloudHomey = await _cloudUser.getHomeyById(homeyId);
  const _cloudHomeyApi = await _cloudHomey.authenticate();


  const stream = await got
    .get(lastVersion.url)
    .buffer();

  const env = `{
    "CLIENT_ID": "zfGb71fg6imMgX6OfWfABVlzM7e3xKCt8HMVKxy7",
    "CLIENT_SECRET": "wwDdqef7If80P9aCla58AeY8O9QigZDVZOUi1j0tukucRZtuUC1fahWLxW9SGlWoVobRdccYGJjFmFKVZ0aJ9q2GnIF4Sf67JXTrBiPqK456JT08dV0uJH2WjtAq6zF3",
    "MINIO_SECRET": "BgZohJwuIabcds4zytOPGYRJNO2KEVMczWfyTJUP",
    "MINIO_ACCESS": "6UMXp5OyS04X3hmDgQ7V"
}`;
  const app = await getApp(stream);
  console.log(store);
  const cloudApi = store.get();
  const bearerToken = cloudApi[`homeySession.${homeyId}`];
  const ip = arg.ipInternal;
  console.log(bearerToken);

  const form = new FormData();
  form.append("app", stream, {
    filename: "homeycommunitystore.tar.gz",
    contentType: "octet/stream",
  });
  form.append("debug", "false");
  console.log(env);
  if (env) {
    form.append("env", env);
  } else {
    form.append("env", "{}");
  }
  form.append("purgeSettings", "false");

  const postResponse = await axios.post(`http://${ip}/api/manager/devkit`, form, {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },

  });

  await this._cloudHomeyApi?.apps.updateApp({
    id: app.id,
    app: {
      "origin": "devkit_install",
    },
  });

  return postResponse.data;
}
ipcMain.handle("auth", async (event, arg) => {
  const { access_token, token, homeys } = arg;
  console.log(await got.post(`${server}/api/hcs/authorize`,
    {
      json: {
        token: token,
        homey: homeys.map((e) => ({ name: e.name, id: e.id }))
      },
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    }).text())
});
ipcMain.handle("install", install);
ipcMain.handle("login", async (event, arg) => {
  let listener;
  api = new AthomCloudAPI({
    clientId: config.ATHOM_API_CLIENT_ID,
    clientSecret: config.ATHOM_API_CLIENT_SECRET,
    store,
  });

  const app = express();
  const port = await new Promise((resolve) => {
    listener = app.listen(() => {
      resolve(listener.address().port);
    });
  });


  const url = `${config.ATHOM_API_LOGIN_URL}?port=${port}&clientId=${config.ATHOM_API_CLIENT_ID}`;
  const subWindow = new BrowserWindow({
    width: 800,
    height: 600,

    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });
  subWindow.loadURL(url);
  let cancelled = false;

  const code = await Promise.race([
    // Input code automatically by webserver
    Promise.resolve()
      .then(async () => {
        const codePromise = new Promise((resolve) => {
          app.get("/auth", (req, res) => {
            subWindow.hide();
            res.sendStatus(200);
            if (req.query.code) {
              cancelled = true;
              resolve(req.query.code);
            }
          });
        });
        return codePromise;
      })
      .then((receivedCode) => {
        if (!receivedCode) {
          throw new Error("Invalid code!");
        }
        return receivedCode;
      }),

    new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!cancelled) {
          ipcMain.send("login-failed");
        }
        reject(new Error("Timeout getting authorization code!"));
      }, 1000 * 60 * 5); // 5 minutes
    }),
  ]);
  subWindow.close();
  listener.close();
  const token = await api.authenticateWithAuthorizationCode(code);

  try {
    await api.setToken(token);

    const profile = await api.getAuthenticatedUser();
    const homeys = await api.getHomeys();

    return {
      token: token,
      profile: profile,
    };
  } catch (err) {
    console.error(err);
    throw new Error("Error getting profile!");
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
const __config = {
  CLIENT_ID: "zfGb71fg6imMgX6OfWfABVlzM7e3xKCt8HMVKxy7",
  CLIENT_SECRET:
    "wwDdqef7If80P9aCla58AeY8O9QigZDVZOUi1j0tukucRZtuUC1fahWLxW9SGlWoVobRdccYGJjFmFKVZ0aJ9q2GnIF4Sf67JXTrBiPqK456JT08dV0uJH2WjtAq6zF3",
};

const appExpress = express();
appExpress.use(cors({
  origin: "*",
}));
appExpress.use(
  express.static(
    path.join(
      path
        .join(app.getAppPath(), "compiled")
        .replace("app.asar", "app.asar.unpacked")
    )
  )
);

appExpress.listen(9021);
