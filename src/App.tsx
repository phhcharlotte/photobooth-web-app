import { useState } from "react";
import { Button, Steps, Typography } from "antd";
import {
  CameraOutlined,
  CheckCircleFilled,
  FolderOpenOutlined,
} from "@ant-design/icons";
import LayoutSelector from "./components/LayoutSelector";
import CaptureSession from "./components/CaptureSession";
import ReviewGallery from "./components/ReviewGallery";
import FrameComposer from "./components/FrameComposer";
import { DEFAULT_TOTAL_SHOTS } from "./config";
import { CapturedPhoto, LayoutType, Screen, SessionResult } from "./types";

const { Title, Paragraph } = Typography;

const STEP_ORDER: Screen[] = ["layout", "capture", "review", "compose"];
const STEP_TITLES = ["Bố cục", "Chụp ảnh", "Chọn ảnh", "Ghép khung"];

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
  const [shotCount, setShotCount] = useState<number>(DEFAULT_TOTAL_SHOTS);
  const [sessionPhotos, setSessionPhotos] = useState<CapturedPhoto[]>([]);
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [pickedPhotos, setPickedPhotos] = useState<CapturedPhoto[]>([]);
  const [exportPath, setExportPath] = useState<string | null>(null);

  function resetAll() {
    setLayout(null);
    setShotCount(DEFAULT_TOTAL_SHOTS);
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

  const currentStepIndex = STEP_ORDER.indexOf(screen);

  return (
    <div className="app-shell">
      <FilmRail />

      <div className="app-content">
        <header className="marquee-header">
          <div className="marquee-header__title">
            <span className="marquee-header__bulb" />
            PHOTOBOOTH
          </div>

          {currentStepIndex !== -1 && (
            <div className="marquee-header__steps">
              <Steps
                current={currentStepIndex}
                size="small"
                items={STEP_TITLES.map((t) => ({ title: t }))}
              />
            </div>
          )}
        </header>

        {screen === "home" && (
          <div className="screen">
            <div className="home-hero" />
            <div className="eyebrow">Chào mừng</div>
            <Title level={2} style={{ margin: 0, textAlign: "center" }}>
              Photobooth của riêng bạn
            </Title>
            <Paragraph
              style={{
                maxWidth: 520,
                textAlign: "center",
                color: "var(--lilac, #a79cc0)",
              }}>
              Tự động đếm ngược cho mọi kiểu, chụp liên tục nhiều kiểu và quay
              video toàn bộ buổi chụp. Ảnh và video sẽ được lưu trực tiếp vào
              máy tính của bạn.
            </Paragraph>
            <Button
              type="primary"
              size="large"
              icon={<CameraOutlined />}
              onClick={() => setScreen("layout")}>
              Bắt đầu
            </Button>
          </div>
        )}

        {screen === "layout" && (
          <LayoutSelector
            value={layout}
            shotCount={shotCount}
            onSelect={setLayout}
            onShotCountChange={setShotCount}
            onConfirm={() => setScreen("capture")}
            onBack={() => setScreen("home")}
          />
        )}

        {screen === "capture" && (
          <CaptureSession
            totalShots={shotCount}
            onComplete={handleSessionComplete}
            onCancel={resetAll}
          />
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
            <div className="done-check">
              <CheckCircleFilled />
            </div>
            <Title level={2} style={{ margin: 0 }}>
              Đã lưu xong!
            </Title>
            <Paragraph
              style={{
                maxWidth: 480,
                textAlign: "center",
                color: "var(--lilac, #a79cc0)",
              }}>
              Ảnh ghép, từng tấm ảnh và video buổi chụp đã được lưu vào máy tính
              của bạn.
            </Paragraph>
            {exportPath && <div className="path-chip">{exportPath}</div>}
            {videoPath && <div className="path-chip">{videoPath}</div>}
            <div style={{ display: "flex", gap: 12 }}>
              <Button
                icon={<FolderOpenOutlined />}
                onClick={() => window.electronAPI.openOutputFolder()}>
                Mở thư mục lưu trữ
              </Button>
              <Button type="primary" onClick={resetAll}>
                Chụp ảnh mới
              </Button>
            </div>
          </div>
        )}
      </div>

      <FilmRail />
    </div>
  );
}
