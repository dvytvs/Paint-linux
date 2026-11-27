/**
 * Linux Paint — https://github.com/dvytvs/Paint-linux
 * Copyright © 2026 dvytvs (https://github.com/dvytvs)
 * SPDX-License-Identifier: GPL-3.0-only
 */
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');

let mainWindow;

// ---------------------------------------------------------------------------
// Linux display backend selection.
//
// On a Wayland session we want the native Wayland backend (no XWayland), on an
// X11 session we keep the X11 backend. Relying on ozone's "auto" hint is not
// enough in every environment (launching from a .desktop file, Flatpak, some
// compositors), so the session is detected explicitly.
//
// The detection can always be overridden by the user:
//   ELECTRON_OZONE_PLATFORM_HINT=wayland|x11   (official Electron variable)
//   --ozone-platform=wayland|x11               (command line)
// ---------------------------------------------------------------------------
function detectWaylandSession() {
  const sessionType = (process.env.XDG_SESSION_TYPE || '').toLowerCase();
  const hasWaylandDisplay = Boolean(process.env.WAYLAND_DISPLAY);
  const hasX11Display = Boolean(process.env.DISPLAY);

  if (sessionType === 'wayland') return hasWaylandDisplay || !hasX11Display;
  if (sessionType === 'x11') return false;
  return hasWaylandDisplay;
}

function configureLinuxDisplayBackend() {
  if (process.platform !== 'linux') return;

  const isWayland = detectWaylandSession();

  const hasOzoneArg = process.argv.some((arg) =>
    arg === '--ozone-platform' ||
    arg.startsWith('--ozone-platform=') ||
    arg === '--ozone-platform-hint' ||
    arg.startsWith('--ozone-platform-hint=')
  );

  if (!hasOzoneArg && !process.env.ELECTRON_OZONE_PLATFORM_HINT) {
    // "wayland" => native Wayland; "auto" keeps the previous behaviour on X11.
    app.commandLine.appendSwitch('ozone-platform-hint', isWayland ? 'wayland' : 'auto');
  }

  if (isWayland) {
    // Text input (CJK/IME) in the Text tool works on Wayland only with this flag.
    app.commandLine.appendSwitch('enable-wayland-ime');

    // Merge instead of overwriting a possibly user-provided --enable-features.
    const requested = app.commandLine.getSwitchValue('enable-features');
    const features = new Set((requested || '').split(',').filter(Boolean));
    features.add('WaylandWindowDecorations');
    app.commandLine.appendSwitch('enable-features', Array.from(features).join(','));
  }

  if (process.env.NODE_ENV === 'development' || process.env.PAINT_DEBUG_DISPLAY === '1') {
    console.log(
      `[paint] display backend: ${isWayland ? 'wayland (native)' : 'x11/auto'} ` +
      `| XDG_SESSION_TYPE=${process.env.XDG_SESSION_TYPE || 'unset'} ` +
      `WAYLAND_DISPLAY=${process.env.WAYLAND_DISPLAY || 'unset'} ` +
      `DISPLAY=${process.env.DISPLAY || 'unset'}`
    );
  }
}

configureLinuxDisplayBackend();

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
  const { session } = require('electron');
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true);
  });
  session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    return true;
  });

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

ipcMain.handle('get-initial-file', () => {
  const args = process.argv;
  // In development, the first arg is electron and the second is the app path.
  // In production, the first arg is the executable path and subsequent args are files.
  for (let i = process.defaultApp ? 2 : 1; i < args.length; i++) {
    if (!args[i].startsWith('--') && fs.existsSync(args[i])) {
      try {
        const filePath = args[i];
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
      } catch (e) {
        console.error("Failed to load initial file", e);
        return null;
      }
    }
  }
  return null;
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
      { name: 'JPEG Image', extensions: ['jpg', 'jpeg'] },
      { name: 'WebP Image', extensions: ['webp'] },
      { name: 'BMP Image', extensions: ['bmp'] }
    ]
  });
  
  if (canceled || !filePath) return null;
  
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(filePath, buffer);
  
  return filePath;
});

// The renderer needs to know the target path *before* encoding the image (the chosen
// extension defines the format). Paths returned by the dialog are remembered so that
// the following "write-file" call can only write to a user-picked location.
const allowedWritePaths = new Set();

ipcMain.handle('choose-save-path', async (event, defaultPath) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    defaultPath: defaultPath || 'Untitled.png',
    filters: [
      { name: 'PNG Image', extensions: ['png'] },
      { name: 'JPEG Image', extensions: ['jpg', 'jpeg'] },
      { name: 'WebP Image', extensions: ['webp'] },
      { name: 'BMP Image', extensions: ['bmp'] }
    ]
  });

  if (canceled || !filePath) return null;
  allowedWritePaths.add(filePath);
  return filePath;
});

ipcMain.handle('write-file', async (event, { filePath, dataUrl }) => {
  if (typeof filePath !== 'string' || !allowedWritePaths.has(filePath)) return false;
  const base64Data = String(dataUrl || '').replace(/^data:[\w/+.-]+;base64,/, '');
  if (!base64Data) return false;
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(filePath, buffer);
  return true;
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

ipcMain.handle('open-external', async (event, url) => {
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) return false;
  await shell.openExternal(url);
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
