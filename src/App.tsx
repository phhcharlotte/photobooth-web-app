import { useState } from "react";
import LayoutSelector from "./components/LayoutSelector";
import CaptureSession from "./components/CaptureSession";
import ReviewGallery from "./components/ReviewGallery";
import FrameComposer from "./components/FrameComposer";
import { CapturedPhoto, LayoutType, Screen, SessionResult } from "./types";

function FilmRail() {
  return (
    <div className="filmstrip-rail">
      {Array.from({ length: 40 }).map((_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [layout, setLayout] = useState<LayoutType | null>(null);
  const [sessionPhotos, setSessionPhotos] = useState<CapturedPhoto[]>([]);
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [pickedPhotos, setPickedPhotos] = useState<CapturedPhoto[]>([]);
  const [exportPath, setExportPath] = useState<string | null>(null);

  function resetAll() {
    setLayout(null);
    setSessionPhotos([]);
    setVideoPath(null);
    setPickedPhotos([]);
    setExportPath(null);
    setScreen("home");
  }

  function handleSessionComplete(result: SessionResult) {
    setSessionPhotos(result.photos);
    setVideoPath(result.videoPath);
    setScreen("review");
  }

  return (
    <div className="app-shell">
      <FilmRail />

      <div className="app-content">
        <header className="marquee-header">
          <div className="marquee-title">
            <span className="bulb" />
            PHOTOBOOTH
          </div>
          <div className="marquee-sub">
            {screen === "home" && "San sang cho buoi chup cua ban"}
            {screen === "layout" && "Chon bo cuc khung anh"}
            {screen === "capture" && "Dang chup tu dong"}
            {screen === "review" && "Chon anh dep nhat"}
            {screen === "compose" && "Ghep khung vien"}
            {screen === "done" && "Hoan tat!"}
          </div>
        </header>

        {screen === "home" && (
          <div className="screen">
            <div className="home-hero" />
            <div className="eyebrow">Chao mung</div>
            <h1 className="headline">Photobooth cua rieng ban</h1>
            <p className="subline">
              Tu dong dem nguoc 15 giay cho moi kieu, chup lien tuc 10 kieu va quay video toan bo buoi
              chup. Anh va video se duoc luu truc tiep vao may tinh cua ban.
            </p>
            <button className="btn btn-primary" onClick={() => setScreen("layout")}>
              Bat dau
            </button>
          </div>
        )}

        {screen === "layout" && (
          <LayoutSelector
            value={layout}
            onSelect={setLayout}
            onConfirm={() => setScreen("capture")}
            onBack={() => setScreen("home")}
          />
        )}

        {screen === "capture" && (
          <CaptureSession onComplete={handleSessionComplete} onCancel={resetAll} />
        )}

        {screen === "review" && layout && (
          <ReviewGallery
            photos={sessionPhotos}
            layout={layout}
            onConfirm={(picked) => {
              setPickedPhotos(picked);
              setScreen("compose");
            }}
            onBack={() => setScreen("capture")}
          />
        )}

        {screen === "compose" && layout && (
          <FrameComposer
            layout={layout}
            photos={pickedPhotos}
            onExported={(path) => {
              setExportPath(path);
              setScreen("done");
            }}
            onBack={() => setScreen("review")}
          />
        )}

        {screen === "done" && (
          <div className="screen">
            <div className="done-check">✓</div>
            <h1 className="headline">Da luu xong!</h1>
            <p className="subline">Anh ghep, tung tam anh va video buoi chup da duoc luu vao may tinh.</p>
            {exportPath && <div className="path-chip">{exportPath}</div>}
            {videoPath && <div className="path-chip">{videoPath}</div>}
            <div className="btn-row">
              <button className="btn btn-ghost" onClick={() => window.electronAPI.openOutputFolder()}>
                Mo thu muc luu tru
              </button>
              <button className="btn btn-primary" onClick={resetAll}>
                Chup phien moi
              </button>
            </div>
          </div>
        )}
      </div>

      <FilmRail />
    </div>
  );
}
