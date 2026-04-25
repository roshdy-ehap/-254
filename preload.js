const { contextBridge, ipcRenderer } = require('electron');

// ── Expose safe API to renderer (index.html) ─────────────────────────
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform:   process.platform,

  // DB persistence
  saveDB:    (data)           => ipcRenderer.invoke('db:save', data),
  loadDB:    ()               => ipcRenderer.invoke('db:load'),

  // File dialogs
  saveDialog:(filename, data) => ipcRenderer.invoke('dialog:save', filename, data),
  openDialog:()               => ipcRenderer.invoke('dialog:open'),
  selectFolder:()             => ipcRenderer.invoke('dialog:folder'),

  // Backups
  autoBackup:(data)           => ipcRenderer.invoke('backup:auto', data),
  listBackups:()              => ipcRenderer.invoke('backup:list'),

  // File read/write
  readFile:  (p)              => ipcRenderer.invoke('file:read', p),
  writeFile: (p, data)        => ipcRenderer.invoke('file:write', p, data),

  // App info
  appInfo:   ()               => ipcRenderer.invoke('app:info'),

  // Window
  minimize:  ()               => ipcRenderer.send('win:minimize'),
  maximize:  ()               => ipcRenderer.send('win:maximize'),
  close:     ()               => ipcRenderer.send('win:close'),
});
