const { app, BrowserWindow, WebContents, Menu } = require('electron');
var screen
var kiosk_url = "https://example.com/"
const prompt = require('electron-prompt');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

var previousPos = {x: 0, y: 0};
var current_url = kiosk_url;

const removeMenu = () => {
  mainWindow.setMenu(null);
  mainWindow.removeMenu();
  mainWindow.setMenuBarVisibility(false)
}

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    fullscreen: true,
    webPreferences: {webviewTag: true}
  });

  mainWindow.setMenu(Menu.buildFromTemplate([{label: 'Setup',submenu:[
    {role:'quit'},
    {label:'Hide Menu', click() { removeMenu(); }}
  ]}]));

  mainWindow.webContents.on('new-window', (event, url, frameName, disposition, options) => {
    event.preventDefault();
    console.log("new window prevented")
    mainWindow.loadURL(url);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log("loaded new page");
    current_url = mainWindow.webContents.getURL();
    if (current_url != kiosk_url) {
      mainWindow.webContents.executeJavaScript("function idleDetection() {\
        var t;\
        window.onload = resetTimer;\
        window.onmousemove = resetTimer;\
        window.onmousedown = resetTimer;\
        window.ontouchstart = resetTimer;\
        window.onclick = resetTimer;\
        window.onkeypress = resetTimer;\
        window.addEventListener('scroll', resetTimer, true);\
        function resetTimer() {\
          console.log('timer reset');\
          clearTimeout(t);\
          t = setTimeout(() => {window.location.assign('" + kiosk_url + "');}, 10000);\
        }\
      }\
      idleDetection();", true);
      mainWindow.webContents.executeJavaScript('var link = document.createElement("a"); link.href="' + kiosk_url + '"; var btn = document.createElement("BUTTON"); btn.innerHTML = "<<<<<< ZURÜCK"; btn.style.position = "fixed"; btn.style.bottom="1em"; btn.style.left="1em"; btn.style.zIndex = "99"; btn.style.height="3em"; link.appendChild(btn); document.body.appendChild(link);', true);
    }
  });

  // and load the index.html of the app.
  mainWindow.loadURL(kiosk_url);

  setTimeout(() => {
    prompt({
      title: 'Welche Website soll angezeigt werden?',
      label: 'URL:',
      value: 'https://gesellschaft-fuer-neuropaediatrie.org/info-fuer-aerzte/skillslab/',
      inputAttrs: {
        type: 'url'
      }
    })
    .then((r) => {
      kiosk_url = r;
      mainWindow.loadURL(kiosk_url);
      screen = require('electron').screen;
      setInterval(() => {
        let currentPos = screen.getCursorScreenPoint();
      },30000);
    })
    .catch(console.error);
  },1000)

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
