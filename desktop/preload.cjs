// SPDX-License-Identifier: GPL-3.0-or-later
const { contextBridge, ipcRenderer, webUtils } = require('electron');
contextBridge.exposeInMainWorld('aletheiaDesktop', {
  filesystem: (operation, args) => ipcRenderer.invoke('proofbundle:filesystem', operation, args),
  call: (operation, args) => ipcRenderer.invoke('aletheia:local', operation, args),
  clipboardWrite: text => ipcRenderer.invoke('aletheia:clipboard-write', text),
  signEvent: bytes => ipcRenderer.invoke('aletheia:sign-event', bytes),
  identity: () => ipcRenderer.invoke('aletheia:identity'),
  catalogue: () => ipcRenderer.invoke('aletheia:catalogue'),
  sourcePath: file => webUtils.getPathForFile(file),
});
