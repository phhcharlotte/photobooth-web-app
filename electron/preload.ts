import { contextBridge, ipcRenderer } from "electron";

export interface FrameAsset {
  name: string;
  path: string;
  dataUrl: string;
}

export interface SaveMediaResult {
  path: string;
  fileName: string;
}

const electronAPI = {
  /** Luu 1 anh (dataURL) hoac 1 video (ArrayBuffer) xuong may */
  saveMedia: (payload: {
    kind: "photo" | "video" | "export";
    data: string | ArrayBuffer;
    fileNameHint?: string;
    mime?: string;
  }): Promise<SaveMediaResult> => ipcRenderer.invoke("save-media", payload),

  /** Mo hop thoai chon 1 file anh khung vien tu may tinh (chua qua xu ly) */
  pickFrameFile: (): Promise<{ name: string; dataUrl: string } | null> =>
    ipcRenderer.invoke("pick-frame-file"),

  /** Luu 1 anh khung vien da xu ly (da crop dung ty le o renderer) vao thu vien */
  saveFrameAsset: (payload: {
    dataUrl: string;
    name: string;
  }): Promise<FrameAsset> => ipcRenderer.invoke("save-frame-asset", payload),

  /** Lay danh sach khung vien da tung upload */
  getFramesLibrary: (): Promise<FrameAsset[]> =>
    ipcRenderer.invoke("get-frames-library"),

  /** Xoa 1 khung vien khoi thu vien */
  deleteFrame: (filePath: string): Promise<boolean> =>
    ipcRenderer.invoke("delete-frame", filePath),

  /** Mo thu muc luu tru trong File Explorer / Finder */
  openOutputFolder: (kind?: "photo" | "video" | "export"): Promise<void> =>
    ipcRenderer.invoke("open-output-folder", kind),

  /** Lay duong dan goc noi luu anh/video */
  getOutputRoot: (): Promise<string> => ipcRenderer.invoke("get-output-root"),
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);

export type ElectronAPI = typeof electronAPI;
