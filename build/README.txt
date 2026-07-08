Bo icon rieng cho ung dung vao day (tuy chon):

- icon.png  (1024x1024, dung chung cho Linux)
- icon.icns (dung cho macOS)
- icon.ico  (dung cho Windows)

Sau khi bo file vao, mo package.json va them lai dong:
  "win":   { "target": ["nsis"], "icon": "build/icon.ico" }
  "mac":   { "target": ["dmg"], "icon": "build/icon.icns", ... }
  "linux": { "target": ["AppImage"], "icon": "build/icon.png", ... }

Neu khong co icon rieng, electron-builder se dung icon mac dinh cua Electron.
