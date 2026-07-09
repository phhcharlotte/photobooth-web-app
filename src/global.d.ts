import type { FrameAsset, SaveMediaResult } from "../electron/preload";

declare global {
  interface Window {
    electronAPI: {
      saveMedia: (payload: {
        kind: "photo" | "video" | "export";
        data: string | ArrayBuffer;
        fileNameHint?: string;
        mime?: string;
      }) => Promise<SaveMediaResult>;
      pickFrameFile: () => Promise<{ name: string; dataUrl: string } | null>;
      saveFrameAsset: (payload: {
        dataUrl: string;
        name: string;
      }) => Promise<FrameAsset>;
      getFramesLibrary: () => Promise<FrameAsset[]>;
      deleteFrame: (filePath: string) => Promise<boolean>;
      openOutputFolder: (kind?: "photo" | "video" | "export") => Promise<void>;
      getOutputRoot: () => Promise<string>;
    };
  }
}

export {};
