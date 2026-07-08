import { useEffect, useRef, useState } from "react";
import { composeFinalImage } from "../lib/compositor";
import { CapturedPhoto, FrameAsset, LayoutType } from "../types";

interface Props {
  layout: LayoutType;
  photos: CapturedPhoto[];
  onExported: (exportPath: string) => void;
  onBack: () => void;
}

export default function FrameComposer({ layout, photos, onExported, onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [library, setLibrary] = useState<FrameAsset[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<FrameAsset | null>(null);
  const [loadingLib, setLoadingLib] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    window.electronAPI
      .getFramesLibrary()
      .then(setLibrary)
      .finally(() => setLoadingLib(false));
  }, []);

  // Ve lai canvas moi khi anh hoac khung vien thay doi
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    composeFinalImage(
      canvas,
      layout,
      photos.map((p) => p.dataUrl),
      selectedFrame?.dataUrl ?? null
    ).catch((e) => console.error("Loi ve canvas:", e));
  }, [layout, photos, selectedFrame]);

  async function handleUploadFrame() {
    setUploading(true);
    try {
      const asset = await window.electronAPI.selectFrameImage();
      if (asset) {
        setLibrary((prev) => [asset, ...prev]);
        setSelectedFrame(asset);
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteFrame(asset: FrameAsset, e: React.MouseEvent) {
    e.stopPropagation();
    const ok = await window.electronAPI.deleteFrame(asset.path);
    if (ok) {
      setLibrary((prev) => prev.filter((f) => f.path !== asset.path));
      if (selectedFrame?.path === asset.path) setSelectedFrame(null);
    }
  }

  async function handleExport() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setExporting(true);
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const res = await window.electronAPI.saveMedia({
        kind: "export",
        data: dataUrl,
        fileNameHint: `photobooth-${layout}up`,
      });
      onExported(res.path);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="screen-scroll" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <div style={{ textAlign: "center" }}>
        <div className="eyebrow">Buoc 4 / 4</div>
        <h1 className="headline">Ghep khung vien</h1>
        <p className="subline">
          Chon 1 khung vien co san hoac tai anh khung vien rieng tu may tinh (PNG nen trong suot se dep nhat).
        </p>
      </div>

      <div className="compose-layout">
        <div className="compose-canvas-wrap">
          <canvas ref={canvasRef} />
        </div>

        <div className="compose-side">
          <div>
            <div className="side-block-title">Khung vien cua ban</div>
            <button className="frame-upload-btn" onClick={handleUploadFrame} disabled={uploading}>
              {uploading ? "Dang mo hop thoai..." : "+ Tai anh khung vien tu may tinh"}
            </button>
            <p className="no-frame-note">
              Goi y: dung file PNG nen trong suot, kich thuoc doc (ty le ~2:3) de khung phu khop toan bo anh.
            </p>
          </div>

          <div>
            <div className="side-block-title">Thu vien khung da luu</div>
            {loadingLib ? (
              <p className="subline" style={{ margin: 0 }}>
                Dang tai...
              </p>
            ) : library.length === 0 ? (
              <p className="no-frame-note">Chua co khung vien nao. Hay tai len khung dau tien!</p>
            ) : (
              <div className="frame-lib-grid">
                <div
                  className={`frame-lib-item ${!selectedFrame ? "selected" : ""}`}
                  onClick={() => setSelectedFrame(null)}
                  title="Khong dung khung vien"
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      fontSize: 11,
                      color: "var(--lilac)",
                      textAlign: "center",
                      padding: 4,
                    }}
                  >
                    Khong khung
                  </div>
                </div>
                {library.map((asset) => (
                  <div
                    key={asset.path}
                    className={`frame-lib-item ${selectedFrame?.path === asset.path ? "selected" : ""}`}
                    onClick={() => setSelectedFrame(asset)}
                    title={asset.name}
                  >
                    <img src={asset.dataUrl} alt={asset.name} />
                    <button
                      onClick={(e) => handleDeleteFrame(asset, e)}
                      style={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(0,0,0,0.6)",
                        color: "#fff",
                        fontSize: 11,
                        cursor: "pointer",
                        lineHeight: "18px",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="btn-row">
            <button className="btn btn-ghost" onClick={onBack}>
              Quay lai chon anh
            </button>
            <button className="btn btn-primary" onClick={handleExport} disabled={exporting}>
              {exporting ? "Dang luu..." : "Xuat anh hoan chinh"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
