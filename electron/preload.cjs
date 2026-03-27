const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  newWindow: () => ipcRenderer.invoke('new-window'),
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  print: () => ipcRenderer.invoke('print'),
  setWallpaper: (dataUrl) => ipcRenderer.invoke('set-wallpaper', dataUrl),
  share: (dataUrl) => ipcRenderer.invoke('share', dataUrl),
  exit: (force) => ipcRenderer.invoke('exit', force),
  windowControl: (action) => ipcRenderer.invoke('window-control', action),
  onCloseRequested: (callback) => ipcRenderer.on('request-close', callback),
  offCloseRequested: () => ipcRenderer.removeAllListeners('request-close')
});
