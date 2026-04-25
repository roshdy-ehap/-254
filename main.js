const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const fs   = require('fs');
const os   = require('os');

// ── Data directory next to .exe ──────────────────────────────────────
const DATA_DIR    = path.join(path.dirname(app.getPath('exe')), 'ميزان-بيانات');
const BACKUP_DIR  = path.join(DATA_DIR, 'نسخ-احتياطية');
const DB_FILE     = path.join(DATA_DIR, 'db.json');

function ensureDirs() {
  [DATA_DIR, BACKUP_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });
}

let win;

function createWindow() {
  ensureDirs();

  win = new BrowserWindow({
    width:  1280,
    height: 820,
    minWidth:  900,
    minHeight: 580,
    title: 'ميزان POS',
    icon: path.join(__dirname, 'icon.png'),
    backgroundColor: '#07090f',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Remove default menu
  Menu.setApplicationMenu(null);

  // Load the HTML file
  win.loadFile(path.join(__dirname, 'src', 'index.html'));

  win.once('ready-to-show', () => win.show());

  win.on('closed', () => { win = null; });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (!win) createWindow(); });

// ════════════════════════════════════════════════════════════════════
//  IPC HANDLERS
// ════════════════════════════════════════════════════════════════════

// ── Save DB ──────────────────────────────────────────────────────────
ipcMain.handle('db:save', async (_, data) => {
  try {
    ensureDirs();
    const tmp = DB_FILE + '.tmp';
    fs.writeFileSync(tmp, data, 'utf-8');
    fs.renameSync(tmp, DB_FILE);
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

// ── Load DB ──────────────────────────────────────────────────────────
ipcMain.handle('db:load', async () => {
  try {
    if (fs.existsSync(DB_FILE)) return { ok: true, data: fs.readFileSync(DB_FILE, 'utf-8') };
    return { ok: true, data: null };
  } catch (e) { return { ok: false, error: e.message }; }
});

// ── Save dialog ───────────────────────────────────────────────────────
ipcMain.handle('dialog:save', async (_, filename, data) => {
  try {
    const { filePath } = await dialog.showSaveDialog(win, {
      defaultPath: path.join(os.homedir(), 'Desktop', filename || 'backup.json'),
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (!filePath) return { ok: false };
    fs.writeFileSync(filePath, data, 'utf-8');
    return { ok: true, path: filePath };
  } catch (e) { return { ok: false, error: e.message }; }
});

// ── Open dialog ───────────────────────────────────────────────────────
ipcMain.handle('dialog:open', async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog(win, {
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile'],
    });
    if (!filePaths?.length) return { ok: false };
    const data = fs.readFileSync(filePaths[0], 'utf-8');
    return { ok: true, data, path: filePaths[0] };
  } catch (e) { return { ok: false, error: e.message }; }
});

// ── Select folder ─────────────────────────────────────────────────────
ipcMain.handle('dialog:folder', async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog(win, { properties: ['openDirectory'] });
    if (!filePaths?.length) return { ok: false };
    return { ok: true, path: filePaths[0] };
  } catch (e) { return { ok: false, error: e.message }; }
});

// ── Auto backup to DATA_DIR ───────────────────────────────────────────
ipcMain.handle('backup:auto', async (_, data) => {
  try {
    ensureDirs();
    const ts   = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const file = path.join(BACKUP_DIR, `backup-${ts}.json`);
    fs.writeFileSync(file, data, 'utf-8');
    // Keep last 50 backups
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse();
    files.slice(50).forEach(f => { try { fs.unlinkSync(path.join(BACKUP_DIR, f)); } catch {} });
    return { ok: true, path: file };
  } catch (e) { return { ok: false, error: e.message }; }
});

// ── List backups ──────────────────────────────────────────────────────
ipcMain.handle('backup:list', async () => {
  try {
    ensureDirs();
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const fp = path.join(BACKUP_DIR, f);
        const st = fs.statSync(fp);
        return { name: f, path: fp, size: st.size, mtime: st.mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime);
    return { ok: true, files };
  } catch (e) { return { ok: false, files: [] }; }
});

// ── Read file ─────────────────────────────────────────────────────────
ipcMain.handle('file:read', async (_, filePath) => {
  try {
    if (!fs.existsSync(filePath)) return { ok: false, error: 'not found' };
    return { ok: true, data: fs.readFileSync(filePath, 'utf-8') };
  } catch (e) { return { ok: false, error: e.message }; }
});

// ── Write file ────────────────────────────────────────────────────────
ipcMain.handle('file:write', async (_, filePath, data) => {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, data, 'utf-8');
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

// ── App info ──────────────────────────────────────────────────────────
ipcMain.handle('app:info', () => ({
  version: app.getVersion(),
  dataDir: DATA_DIR,
  backupDir: BACKUP_DIR,
  platform: process.platform,
  isElectron: true,
}));

// ── Window controls ───────────────────────────────────────────────────
ipcMain.on('win:minimize', () => win?.minimize());
ipcMain.on('win:maximize', () => win?.isMaximized() ? win.unmaximize() : win.maximize());
ipcMain.on('win:close',    () => win?.close());
