const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');

let mainWindow;

app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');

function createWindow() {
  const win = new BrowserWindow({
    width: 1536,
    height: 960,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false
    }
  });

  win.setBackgroundThrottling(false);

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:3000');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  win.on('close', (e) => {
    if (!win.isDestroyed() && !win.forceClose) {
      e.preventDefault();
      win.webContents.send('request-close');
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('new-window', () => {
  createWindow();
});

ipcMain.handle('open-file', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp', 'bmp', 'jpeg'] }]
  });
  if (canceled || filePaths.length === 0) return null;
  
  const filePath = filePaths[0];
  const data = fs.readFileSync(filePath);
  const base64 = data.toString('base64');
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = (ext === '.jpg' || ext === '.jpeg') ? 'image/jpeg' : `image/${ext.slice(1)}`;
  
  const stats = fs.statSync(filePath);
  
  return {
    dataUrl: `data:${mimeType};base64,${base64}`,
    name: path.basename(filePath),
    path: filePath,
    date: stats.mtime,
    size: stats.size
  };
});

ipcMain.handle('save-file', async (event, { dataUrl, defaultPath }) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    defaultPath: defaultPath || 'Untitled.png',
    filters: [
      { name: 'PNG Image', extensions: ['png'] },
      { name: 'JPEG Image', extensions: ['jpg', 'jpeg'] }
    ]
  });
  
  if (canceled || !filePath) return null;
  
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(filePath, buffer);
  
  return filePath;
});

ipcMain.handle('get-printers', async (event) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    const printers = await win.webContents.getPrintersAsync();
    return printers;
  } catch (e) {
    return [];
  }
});

ipcMain.handle('print', async (event) => {
  return new Promise((resolve) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.webContents.print({ silent: false, printBackground: true }, (success) => {
      resolve(success);
    });
  });
});

ipcMain.handle('set-wallpaper', async (event, dataUrl) => {
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, 'base64');
  const tempPath = path.join(os.tmpdir(), 'paint-wallpaper.png');
  fs.writeFileSync(tempPath, buffer);
  
  return new Promise((resolve) => {
    const desktop = process.env.XDG_CURRENT_DESKTOP || '';
    let cmd = '';
    
    if (desktop.includes('GNOME')) {
      cmd = `gsettings set org.gnome.desktop.background picture-uri "file://${tempPath}" && gsettings set org.gnome.desktop.background picture-uri-dark "file://${tempPath}"`;
    } else if (desktop.includes('XFCE')) {
      cmd = `xfconf-query -c xfce4-desktop -p /backdrop/screen0/monitor0/workspace0/last-image -s "${tempPath}"`;
    } else if (desktop.includes('KDE')) {
      cmd = `qdbus org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.evaluateScript 'var allDesktops = desktops();for (i=0;i<allDesktops.length;i++) {d = allDesktops[i];d.wallpaperPlugin = "org.kde.image";d.currentConfigGroup = Array("Wallpaper", "org.kde.image", "General");d.writeConfig("Image", "file://${tempPath}")}'`;
    } else {
      cmd = `feh --bg-scale "${tempPath}"`;
    }
    
    exec(cmd, (error) => {
      resolve(!error);
    });
  });
});

ipcMain.handle('share', async (event, dataUrl) => {
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, 'base64');
  const tempPath = path.join(os.tmpdir(), 'paint-share.png');
  fs.writeFileSync(tempPath, buffer);
  
  shell.showItemInFolder(tempPath);
  return true;
});

ipcMain.handle('exit', (event, force) => {
  if (force) {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.forceClose = true;
      win.close();
    }
  }
});

ipcMain.handle('window-control', (event, action) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  
  if (action === 'minimize') win.minimize();
  if (action === 'maximize') {
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  }
  if (action === 'close') {
    win.webContents.send('request-close');
  }
});
