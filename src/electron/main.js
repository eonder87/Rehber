const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow(port) {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "Rehber",
        frame: true, // Standart pencere çerçevesi
        webPreferences: {
            nodeIntegration: false, // Güvenlik için kapalı
            contextIsolation: true
        }
    });

    // Menü çubuğunu gizle (isteğe bağlı)
    mainWindow.setMenuBarVisibility(false);

    // Sunucu adresine git
    mainWindow.loadURL(`http://localhost:${port}`);

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

function startServer() {
    // Sunucu dosyasının yolu:
    // src/electron/main.js -> ../../server/server.js
    const serverPath = path.join(__dirname, '..', '..', 'server', 'server.js');

    console.log("Starting server from:", serverPath);

    // Fork the server process
    serverProcess = fork(serverPath, [], {
        env: {
            ...process.env,
            PORT: 0,
            ELECTRON_RUN: 'true',
            USER_DATA_PATH: app.isPackaged ? path.dirname(app.getPath('exe')) : path.join(__dirname, '..', '..'),
            // src/electron/main.js -> ../../
            STATIC_PATH: path.join(__dirname, '..', '..')
        }
    });

    serverProcess.on('message', (msg) => {
        if (msg.type === 'ready') {
            console.log(`Server is ready on port ${msg.port}`);
            createWindow(msg.port);
        }
    });
}

app.on('ready', startServer);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
    // Kill the server process when quitting
    if (serverProcess) {
        serverProcess.kill();
    }
});

app.on('activate', function () {
    if (mainWindow === null) startServer();
});
