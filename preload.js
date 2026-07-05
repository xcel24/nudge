const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('buddy', {
  // main -> renderer
  onShowReminder: (cb) => ipcRenderer.on('show-reminder', (_e, data) => cb(data)),
  onCelebrate: (cb) => ipcRenderer.on('celebrate', (_e, data) => cb(data)),

  // renderer -> main
  respond: (answer) => ipcRenderer.invoke('response', answer),
  setInteractive: (interactive) => ipcRenderer.send('set-interactive', interactive),
});
