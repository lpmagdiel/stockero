// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  const { ipcRenderer, remote } = require('electron');
  const dialog = remote.dialog;
  const Dialogs = require('dialogs');
  const dialogs = Dialogs();
})
