const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

let mainWindow;

function createWindow() {
mainWindow = new BrowserWindow({
width: 1200,
height: 800,
minWidth: 360,
minHeight: 600,
show: false,
autoHideMenuBar: true,
backgroundColor: "#1565c0",
icon: path.join(__dirname, "images", "icon.png"),
webPreferences: {
nodeIntegration: false,
contextIsolation: true,
sandbox: true
}
});

mainWindow.loadFile(path.join(__dirname, "index.html"));

mainWindow.once("ready-to-show", () => {
mainWindow.show();
});

mainWindow.webContents.setWindowOpenHandler(({ url }) => {
if (url.startsWith("https://") || url.startsWith("http://")) {
shell.openExternal(url);
}

return { action: "deny" };

});

mainWindow.on("closed", () => {
mainWindow = null;
});
}

app.whenReady().then(() => {
createWindow();

app.on("activate", () => {
if (BrowserWindow.getAllWindows().length === 0) {
createWindow();
}
});
});

app.on("window-all-closed", () => {
if (process.platform !== "darwin") {
app.quit();
}
});