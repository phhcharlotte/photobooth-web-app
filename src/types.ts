export type LayoutType = 1 | 2 | 4 | 6;

export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  savedPath?: string;
}

export interface FrameAsset {
  name: string;
  path: string;
  dataUrl: string;
}

export type Screen = "home" | "layout" | "capture" | "review" | "compose" | "done";

export interface SessionResult {
  photos: CapturedPhoto[];
  videoPath: string | null;
}
