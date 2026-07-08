import { useEffect, useRef, useState } from "react";
import {
  COUNTDOWN_SECONDS,
  FLASH_DURATION_MS,
  TOTAL_SHOTS,
  VIDEO_BITRATE,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "../config";
import { CapturedPhoto, SessionResult } from "../types";

interface Props {
  onComplete: (result: SessionResult) => void;
  onCancel: () => void;
}

const POSE_HINTS = [
  "San sang...",
  "Tao dang tu nhien nhe!",
  "Cuoi that tuoi ✨",
  "Doi goc nghieng nao",
  "Nhin thang ong kinh",
  "Tao dang vui nhon",
  "Gan lai nhau chut",
  "Bung no nang luong!",
  "Nhe nhang mot chut",
  "Kieu cuoi cung, het minh nao!",
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

export default function CaptureSession({ onComplete, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const photosRef = useRef<CapturedPhoto[]>([]);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shotIndex, setShotIndex] = useState(0);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [flashState, setFlashState] = useState<"idle" | "active" | "fading">("idle");
  const [finishing, setFinishing] = useState(false);

  // ---- Khoi dong camera + bat dau ghi hinh video ----
  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT },
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
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

        setReady(true);
      } catch (err) {
        console.error(err);
        setError(
          "Khong the truy cap camera/micro. Hay kiem tra quyen truy cap camera cho ung dung trong Settings."
        );
      }
    }

    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Vong dem nguoc cho tung kieu chup ----
  useEffect(() => {
    if (!ready || finishing) return;
    if (shotIndex >= TOTAL_SHOTS) {
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
  }, [ready, countdown, shotIndex, finishing]);

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
    const photo: CapturedPhoto = { id: `shot-${shotIndex}-${Date.now()}`, dataUrl };
    photosRef.current = [...photosRef.current, photo];

    // Luu anh xuong may ngay lap tuc (khong cho nguoi dung phai bam luu)
    window.electronAPI
      .saveMedia({ kind: "photo", data: dataUrl, fileNameHint: `shot-${shotIndex + 1}` })
      .then((res) => {
        photosRef.current = photosRef.current.map((p) =>
          p.id === photo.id ? { ...p, savedPath: res.path } : p
        );
      })
      .catch((e) => console.error("Loi luu anh:", e));

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
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
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

  const pct = ((COUNTDOWN_SECONDS - countdown) / COUNTDOWN_SECONDS) * 100;

  return (
    <div className="screen">
      <div className="eyebrow">Buoc 2 / 4</div>
      <h1 className="headline">Dang chup — giu nguyen nu cuoi!</h1>
      <p className="pose-hint">{POSE_HINTS[Math.min(shotIndex, POSE_HINTS.length - 1)]}</p>

      <div className="capture-stage">
        <video ref={videoRef} muted playsInline />
        <canvas ref={canvasRef} style={{ display: "none" }} />

        <div className="rec-badge">
          <span className="rec-dot" />
          REC
        </div>
        <div className="shot-counter">
          {Math.min(shotIndex + 1, TOTAL_SHOTS)} / {TOTAL_SHOTS}
        </div>

        {!finishing && (
          <div className="countdown-ring-wrap">
            <div className="countdown-ring" style={{ ["--pct" as any]: pct }}>
              <div className="countdown-ring-inner">{countdown}</div>
            </div>
          </div>
        )}

        <div className={`flash-overlay ${flashState !== "idle" ? flashState : ""}`} />

        {!ready && !error && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div className="spinner" />
            <span className="pose-hint">Dang khoi dong camera...</span>
          </div>
        )}

        {error && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
              textAlign: "center",
            }}
          >
            <span className="subline">{error}</span>
          </div>
        )}

        {finishing && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 12,
              background: "rgba(12, 10, 17, 0.7)",
            }}
          >
            <div className="spinner" />
            <span className="pose-hint">Dang luu video, cho chut...</span>
          </div>
        )}
      </div>

      <div className="btn-row">
        <button className="btn btn-ghost" onClick={onCancel}>
          Huy phien chup
        </button>
      </div>
    </div>
  );
}
