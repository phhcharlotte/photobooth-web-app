import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import path from "path";
import fs from "fs";

const isDev = process.env.NODE_ENV === "development";

let mainWindow: BrowserWindow | null = null;

// ---------------------------------------------------------------------------
// Thu muc luu du lieu
// Anh/video chup ra: ~/Pictures/Photobooth  (co the doi tai day)
// Khung vien nguoi dung upload len: luu trong userData/frames de dung lai lan sau
// ---------------------------------------------------------------------------
const OUTPUT_ROOT = path.join(app.getPath("pictures"), "Photobooth");
const PHOTOS_DIR = path.join(OUTPUT_ROOT, "photos");
const VIDEOS_DIR = path.join(OUTPUT_ROOT, "videos");
const EXPORTS_DIR = path.join(OUTPUT_ROOT, "exports");
const FRAMES_DIR = path.join(app.getPath("userData"), "frames");

function ensureDirs() {
  for (const dir of [
    OUTPUT_ROOT,
    PHOTOS_DIR,
    VIDEOS_DIR,
    EXPORTS_DIR,
    FRAMES_DIR,
  ]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1040,
    minHeight: 700,
    backgroundColor: "#0f0d14",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      // Can cho phep truy cap camera/micro
      sandbox: false,
    },
  });

  // Tu dong cap quyen camera/micro khi renderer xin phep
  mainWindow.webContents.session.setPermissionRequestHandler(
    (_wc, permission, callback) => {
      if (permission === "media") callback(true);
      else callback(false);
    },
  );

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  ensureDirs();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function timestamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(
    d.getHours(),
  )}${pad(d.getMinutes())}${pad(d.getSeconds())}-${String(d.getMilliseconds()).padStart(3, "0")}`;
}

function mimeToExt(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4")) return "mp4";
  return "bin";
}

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mime: string } {
  const match = /^data:(.+);base64,(.*)$/.exec(dataUrl);
  if (!match) throw new Error("Dinh dang dataURL khong hop le");
  return { buffer: Buffer.from(match[2], "base64"), mime: match[1] };
}

// ---------------------------------------------------------------------------
// IPC: luu anh (dataURL png) hoac video (ArrayBuffer webm) xuong dia
// kind: "photo" | "video" | "export"
// ---------------------------------------------------------------------------
ipcMain.handle(
  "save-media",
  async (
    _event,
    payload: {
      kind: "photo" | "video" | "export";
      data: string | ArrayBuffer;
      fileNameHint?: string;
      mime?: string;
    },
  ) => {
    ensureDirs();
    const targetDir =
      payload.kind === "photo"
        ? PHOTOS_DIR
        : payload.kind === "video"
          ? VIDEOS_DIR
          : EXPORTS_DIR;

    let buffer: Buffer;
    let ext: string;

    if (typeof payload.data === "string") {
      const parsed = dataUrlToBuffer(payload.data);
      buffer = parsed.buffer;
      ext = mimeToExt(parsed.mime);
    } else {
      buffer = Buffer.from(new Uint8Array(payload.data));
      ext = mimeToExt(payload.mime ?? "video/webm");
    }

    const baseName = payload.fileNameHint
      ? payload.fileNameHint.replace(/[^a-zA-Z0-9-_]/g, "_")
      : payload.kind;
    const fileName = `${baseName}-${timestamp()}.${ext}`;
    const fullPath = path.join(targetDir, fileName);
    fs.writeFileSync(fullPath, buffer);

    return { path: fullPath, fileName };
  },
);

// // ---------------------------------------------------------------------------
// // IPC: chon anh khung vien tu may tinh -> copy vao thu vien frames -> tra ve dataURL
// // ---------------------------------------------------------------------------
// ipcMain.handle("select-frame-image", async () => {
//   if (!mainWindow) return null;
//   const result = await dialog.showOpenDialog(mainWindow, {
//     title: "Chon anh khung vien",
//     properties: ["openFile"],
//     filters: [{ name: "Hinh anh (PNG co nen trong suot)", extensions: ["png", "jpg", "jpeg", "webp"] }],
//   });
//   if (result.canceled || result.filePaths.length === 0) return null;

//   const srcPath = result.filePaths[0];
//   const ext = path.extname(srcPath);
//   const safeName = `frame-${timestamp()}${ext}`;
//   const destPath = path.join(FRAMES_DIR, safeName);
//   fs.copyFileSync(srcPath, destPath);

//   return readFrameAsAsset(destPath);
// });

// ---------------------------------------------------------------------------
// IPC: chon 1 file anh tu may tinh va tra ve NGUYEN BAN (chua qua xu ly).
// Renderer se tu crop cho khop ty le canvas roi goi "save-frame-asset" de luu.
// ---------------------------------------------------------------------------
ipcMain.handle("pick-frame-file", async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Chon anh khung vien",
    properties: ["openFile"],
    filters: [
      {
        name: "Hinh anh (PNG co nen trong suot)",
        extensions: ["png", "jpg", "jpeg", "webp"],
      },
    ],
  });
  if (result.canceled || result.filePaths.length === 0) return null;

  const srcPath = result.filePaths[0];
  const buffer = fs.readFileSync(srcPath);
  const ext = path.extname(srcPath).toLowerCase();
  const mime =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : "image/jpeg";
  const name = path.basename(srcPath, path.extname(srcPath));

  return { name, dataUrl: `data:${mime};base64,${buffer.toString("base64")}` };
});

// ---------------------------------------------------------------------------
// IPC: luu 1 anh khung vien DA XU LY (da crop dung ty le o renderer) vao
// thu vien khung (userData/frames) de dung lai cho lan sau.
// ---------------------------------------------------------------------------
ipcMain.handle(
  "save-frame-asset",
  async (_event, payload: { dataUrl: string; name: string }) => {
    ensureDirs();
    const { buffer } = dataUrlToBuffer(payload.dataUrl);
    const safeName = `${payload.name.replace(/[^a-zA-Z0-9-_]/g, "_")}-${timestamp()}.png`;
    const destPath = path.join(FRAMES_DIR, safeName);
    fs.writeFileSync(destPath, buffer);
    return readFrameAsAsset(destPath);
  },
);

function readFrameAsAsset(filePath: string) {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : "image/jpeg";
  return {
    name: path.basename(filePath),
    path: filePath,
    dataUrl: `data:${mime};base64,${buffer.toString("base64")}`,
  };
}

// ---------------------------------------------------------------------------
// IPC: lay danh sach cac khung vien da tung upload (thu vien khung)
// ---------------------------------------------------------------------------
ipcMain.handle("get-frames-library", async () => {
  ensureDirs();
  const files = fs
    .readdirSync(FRAMES_DIR)
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .sort()
    .reverse();
  return files.map((f) => readFrameAsAsset(path.join(FRAMES_DIR, f)));
});

// ---------------------------------------------------------------------------
// IPC: xoa 1 khung vien khoi thu vien
// ---------------------------------------------------------------------------
ipcMain.handle("delete-frame", async (_event, filePath: string) => {
  if (filePath.startsWith(FRAMES_DIR) && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
});

// ---------------------------------------------------------------------------
// IPC: mo thu muc chua anh/video da luu
// ---------------------------------------------------------------------------
ipcMain.handle(
  "open-output-folder",
  async (_event, kind?: "photo" | "video" | "export") => {
    ensureDirs();
    const dir =
      kind === "photo"
        ? PHOTOS_DIR
        : kind === "video"
          ? VIDEOS_DIR
          : kind === "export"
            ? EXPORTS_DIR
            : OUTPUT_ROOT;
    shell.openPath(dir);
  },
);

ipcMain.handle("get-output-root", async () => {
  ensureDirs();
  return OUTPUT_ROOT;
});
