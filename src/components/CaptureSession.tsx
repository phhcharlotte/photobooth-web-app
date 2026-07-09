import { useEffect, useRef, useState } from "react";
import { Button, Progress, Result, Spin, Tag, Typography } from "antd";
import { CameraOutlined, VideoCameraOutlined } from "@ant-design/icons";
import {
  COUNTDOWN_SECONDS,
  FLASH_DURATION_MS,
  VIDEO_BITRATE,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "../config";
import { CapturedPhoto, SessionResult } from "../types";

const { Title } = Typography;

interface Props {
  totalShots: number;
  onComplete: (result: SessionResult) => void;
  onCancel: () => void;
}
type Gate = "checking" | "no-device" | "prompt" | "denied" | "recording";
const POSE_HINTS = [
  "Sẵn sàng...",
  "Tạo dáng tự nhiên!",
  "Cười thật tươi",
  "Đổi góc nào",
  "Nhìn thẳng ống kính",
  "Tạo dáng vui nhộn",
  "Gần lại nhau 1 chút",
  "Bùng nổ năng lượng nào!",
  "Nhẹ nhàng một chút",
  "Kiểu cuối cùng, hết mình nào!",
];

function pickMimeType(): string {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const c of candidates) {
    if (window.MediaRecorder && MediaRecorder.isTypeSupported(c)) return c;
  }
  return "video/webm";
}

export default function CaptureSession({
  totalShots,
  onComplete,
  onCancel,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const photosRef = useRef<CapturedPhoto[]>([]);

  const [gate, setGate] = useState<Gate>("checking");
  const [shotIndex, setShotIndex] = useState(0);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [flashState, setFlashState] = useState<"idle" | "active" | "fading">(
    "idle",
  );
  const [finishing, setFinishing] = useState(false);

  // ---- Buoc 0: kiem tra may co webcam khong (chua xin quyen) ----
  useEffect(() => {
    let cancelled = false;

    async function checkDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some((d) => d.kind === "videoinput");
        if (cancelled) return;
        setGate(hasCamera ? "prompt" : "no-device");
      } catch (err) {
        console.error("Loi kiem tra thiet bi camera:", err);
        if (!cancelled) setGate("prompt"); // khong chan luong, de nguoi dung tu bam xin quyen
      }
    }

    checkDevices();
    return () => {
      cancelled = true;
    };
  }, []);

  async function requestCameraAccess() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: pickMimeType(),
        videoBitsPerSecond: VIDEO_BITRATE,
      });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorderRef.current = recorder;
      recorder.start(1000);

      setGate("recording");
    } catch (err: any) {
      console.error(err);
      if (
        err?.name === "NotFoundError" ||
        err?.name === "DevicesNotFoundError"
      ) {
        setGate("no-device");
      } else {
        // NotAllowedError / PermissionDeniedError / SecurityError...
        setGate("denied");
      }
    }
  }

  // Don camera khi roi man hinh trong moi truong hop
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    };
  }, []);

  // ---- Vong dem nguoc cho tung kieu chup (chi chay khi da vao "recording") ----
  useEffect(() => {
    if (gate !== "recording" || finishing) return;
    if (shotIndex >= totalShots) {
      finalizeSession();
      return;
    }

    if (countdown <= 0) {
      capturePhoto();
      return;
    }

    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gate, countdown, shotIndex, finishing]);

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Lat guong lai giong nhu preview (video da bi transform: scaleX(-1) tren man hinh)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/png");
    const photo: CapturedPhoto = {
      id: `shot-${shotIndex}-${Date.now()}`,
      dataUrl,
    };
    photosRef.current = [...photosRef.current, photo];

    // Luu anh xuong may ngay lap tuc (khong cho nguoi dung phai bam luu)
    window.electronAPI
      .saveMedia({
        kind: "photo",
        data: dataUrl,
        fileNameHint: `shot-${shotIndex + 1}`,
      })
      .then((res) => {
        photosRef.current = photosRef.current.map((p) =>
          p.id === photo.id ? { ...p, savedPath: res.path } : p,
        );
      })
      .catch((e) => console.error("Lỗi lưu ảnh:", e));

    // Hieu ung flash
    setFlashState("active");
    setTimeout(() => setFlashState("fading"), FLASH_DURATION_MS);
    setTimeout(() => setFlashState("idle"), FLASH_DURATION_MS + 320);

    setShotIndex((i) => i + 1);
    setCountdown(COUNTDOWN_SECONDS);
  }

  async function finalizeSession() {
    setFinishing(true);
    const recorder = recorderRef.current;

    const videoPath = await new Promise<string | null>((resolve) => {
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }
      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, {
            type: recorder.mimeType || "video/webm",
          });
          const arrayBuffer = await blob.arrayBuffer();
          const res = await window.electronAPI.saveMedia({
            kind: "video",
            data: arrayBuffer,
            fileNameHint: "session",
            mime: blob.type,
          });
          resolve(res.path);
        } catch (e) {
          console.error("Loi luu video:", e);
          resolve(null);
        }
      };
      recorder.stop();
    });

    streamRef.current?.getTracks().forEach((t) => t.stop());
    onComplete({ photos: photosRef.current, videoPath });
  }

  const pct = Math.round(
    ((COUNTDOWN_SECONDS - countdown) / COUNTDOWN_SECONDS) * 100,
  );

  // -------------------------------------------------------------------------
  // Man hinh gac cong: dang kiem tra thiet bi
  // -------------------------------------------------------------------------
  if (gate === "checking") {
    return (
      <div className="screen">
        <Spin size="large" />
        <span className="pose-hint">Đang kiểm tra webcam...</span>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Man hinh gac cong: khong tim thay webcam
  // -------------------------------------------------------------------------
  if (gate === "no-device") {
    return (
      <div className="screen">
        <Result
          status="warning"
          title="Không tìm thấy webcam"
          subTitle="Máy tính của bạn chưa kết nối webcam nào. Hãy cắm webcam vào rồi thử lại."
          extra={
            <Button type="primary" onClick={onCancel}>
              Quay lại
            </Button>
          }
        />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Man hinh gac cong: xin quyen truoc khi vao chup
  // -------------------------------------------------------------------------
  if (gate === "prompt") {
    return (
      <div className="screen">
        <div className="eyebrow">Buoc 2 / 4</div>
        <Title level={2} style={{ margin: 0, textAlign: "center" }}>
          Cho phép sử dụng Camera &amp; Micro
        </Title>
        <p className="pose-hint" style={{ maxWidth: 460, textAlign: "center" }}>
          Ứng dụng cầm quyền truy cập vào camera để chụp ảnh và quyền truy cập
          micro để quay video có tiếng.
        </p>
        <Button
          type="primary"
          size="large"
          icon={<CameraOutlined />}
          onClick={requestCameraAccess}>
          Cho phép Camera &amp; Micro
        </Button>
        <Button onClick={onCancel}>Quay lại</Button>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Man hinh gac cong: nguoi dung tu choi quyen
  // -------------------------------------------------------------------------
  if (gate === "denied") {
    return (
      <div className="screen">
        <Result
          status="error"
          title="Chưa được cấp quyền Camera / Micro"
          subTitle="Bạn đã từ chối hoặc hệ điều hành chặn quyền truy cập. Vào Settings của máy (Privacy & Security -> Camera/Microphone) để cấp quyền cho ứng dụng, rồi bấm thử lại."
          extra={
            <>
              <Button
                type="primary"
                onClick={requestCameraAccess}
                style={{ marginRight: 12 }}>
                Thử lại
              </Button>
              <Button onClick={onCancel}>Quay lại</Button>
            </>
          }
        />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Man hinh dang chup (gate === "recording")
  // -------------------------------------------------------------------------

  return (
    <div className="screen">
      <div className="eyebrow">Bước 2 / 4</div>
      <Title level={2} style={{ margin: 0, textAlign: "center" }}>
        Đang chụp - giữ nguyên dáng xinh
      </Title>
      <p className="pose-hint">
        {POSE_HINTS[Math.min(shotIndex, POSE_HINTS.length - 1)]}
      </p>

      <div className="capture-stage">
        <video ref={videoRef} muted playsInline />
        <canvas ref={canvasRef} style={{ display: "none" }} />

        <div className="rec-badge">
          <Tag color="error" icon={<VideoCameraOutlined />}>
            <span className="rec-badge__dot" style={{ display: "none" }} />
            REC
          </Tag>
        </div>
        <div className="shot-counter">
          {Math.min(shotIndex + 1, totalShots)} / {totalShots}
        </div>

        {!finishing && (
          <div className="countdown-ring-wrap">
            <Progress
              type="circle"
              size={78}
              percent={pct}
              format={() => (
                <span style={{ fontFamily: "monospace", fontSize: 26 }}>
                  {countdown}
                </span>
              )}
              strokeColor="#ffb43c"
              trailColor="rgba(255,255,255,0.12)"
            />
          </div>
        )}

        <div
          className={`flash-overlay ${flashState !== "idle" ? flashState : ""}`}
        />

        {finishing && (
          <div className="capture-overlay-center capture-overlay-center--dim">
            <Spin size="large" />
            <span className="pose-hint">Đang lưu video, chờ xíu...</span>
          </div>
        )}
      </div>

      <Button onClick={onCancel}>Huỷ chụp</Button>
    </div>
  );
}
