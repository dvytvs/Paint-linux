/**
 * Linux Paint — https://github.com/dvytvs/Paint-linux
 * Copyright © 2026 dvytvs (https://github.com/dvytvs)
 * SPDX-License-Identifier: GPL-3.0-only
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getInitialFile: () => ipcRenderer.invoke('get-initial-file'),
  newWindow: () => ipcRenderer.invoke('new-window'),
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  chooseSavePath: (defaultPath) => ipcRenderer.invoke('choose-save-path', defaultPath),
  writeFile: (data) => ipcRenderer.invoke('write-file', data),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  print: () => ipcRenderer.invoke('print'),
  setWallpaper: (dataUrl) => ipcRenderer.invoke('set-wallpaper', dataUrl),
  share: (dataUrl) => ipcRenderer.invoke('share', dataUrl),
  exit: (force) => ipcRenderer.invoke('exit', force),
  windowControl: (action) => ipcRenderer.invoke('window-control', action),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  onCloseRequested: (callback) => ipcRenderer.on('request-close', callback),
  offCloseRequested: () => ipcRenderer.removeAllListeners('request-close')
});
