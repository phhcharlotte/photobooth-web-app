import { useEffect, useRef, useState } from "react";
import { Button, Empty, Popconfirm, Space, Spin, Typography } from "antd";
import {
  ArrowLeftOutlined,
  CloseOutlined,
  ExportOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { composeFinalImage, cropFrameToCanvasAspect } from "../lib/compositor";
import { BUILT_IN_FRAMES, isBuiltInFrame } from "../data/builtInFrames";
import { CapturedPhoto, FrameAsset, LayoutType } from "../types";

const { Title, Paragraph } = Typography;

interface Props {
  layout: LayoutType;
  photos: CapturedPhoto[];
  onExported: (exportPath: string) => void;
  onBack: () => void;
}

export default function FrameComposer({
  layout,
  photos,
  onExported,
  onBack,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [library, setLibrary] = useState<FrameAsset[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<FrameAsset | null>(
    BUILT_IN_FRAMES[0] ?? null,
  );
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
      selectedFrame?.dataUrl ?? null,
    ).catch((e) => console.error("Loi ve canvas:", e));
  }, [layout, photos, selectedFrame]);

  async function handleUploadFrame() {
    setUploading(true);
    try {
      // Buoc 1: mo hop thoai chon file goc (chua qua xu ly)
      const picked = await window.electronAPI.pickFrameFile();
      if (!picked) return;

      // Buoc 2: tu dong cat (center-crop) cho khop dung ty le khung in,
      // tranh bi keo meo khi ghep vao anh cuoi cung
      const croppedDataUrl = await cropFrameToCanvasAspect(picked.dataUrl);

      // Buoc 3: luu ban da xu ly vao thu vien tren may
      const asset = await window.electronAPI.saveFrameAsset({
        dataUrl: croppedDataUrl,
        name: picked.name,
      });

      setLibrary((prev) => [asset, ...prev]);
      setSelectedFrame(asset);
    } catch (e) {
      console.error("Lỗi xử lý khung viền:", e);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteFrame(asset: FrameAsset) {
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

  function renderFrameTile(asset: FrameAsset) {
    const deletable = !isBuiltInFrame(asset);
    return (
      <div
        key={asset.path}
        className={`frame-lib-item ${selectedFrame?.path === asset.path ? "selected" : ""}`}
        onClick={() => setSelectedFrame(asset)}
        title={asset.name}>
        <img src={asset.dataUrl} alt={asset.name} />
        {deletable && (
          <Popconfirm
            title="Xoá khung viền này?"
            okText="Xoá"
            cancelText="Thôi"
            onConfirm={(e) => {
              e?.stopPropagation();
              handleDeleteFrame(asset);
            }}
            onCancel={(e) => e?.stopPropagation()}>
            <Button
              className="frame-lib-item__delete"
              size="small"
              shape="circle"
              danger
              icon={<CloseOutlined />}
              onClick={(e) => e.stopPropagation()}
            />
          </Popconfirm>
        )}
      </div>
    );
  }

  return (
    <div
      className="screen-scroll"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
      }}>
      <div style={{ textAlign: "center" }}>
        <div className="eyebrow">Bước 4 / 4</div>
        <Title level={2} style={{ margin: "6px 0 2px" }}>
          Ghép khung viền
        </Title>
        <Paragraph style={{ maxWidth: 520, color: "var(--lilac, #a79cc0)" }}>
          Chọn khung mẫu có sẵn, hoặc tải từ máy tính của bạn — ảnh sẽ tự động
          cắt theo khung hình.
        </Paragraph>
      </div>

      <div className="compose-layout">
        <div className="compose-canvas-wrap">
          <canvas ref={canvasRef} />
        </div>

        <div className="compose-side">
          <div>
            <div className="side-block-title">Khung mẫu có sẵn</div>
            <div className="frame-lib-grid">
              <div
                className={`frame-lib-item ${!selectedFrame ? "selected" : ""}`}
                onClick={() => setSelectedFrame(null)}
                title="Không dùng khung viền">
                <div className="frame-lib-item__empty-label">Không khung</div>
              </div>
              {BUILT_IN_FRAMES.map(renderFrameTile)}
            </div>
          </div>

          <div>
            <div className="side-block-title">Khung riêng của bạn</div>
            <Button
              block
              type="dashed"
              size="large"
              icon={<UploadOutlined />}
              loading={uploading}
              onClick={handleUploadFrame}
              style={{ marginBottom: 12 }}>
              {uploading ? "Đang xử lý ảnh..." : "Tải ảnh từ máy tính"}
            </Button>

            {loadingLib ? (
              <Spin />
            ) : library.length === 0 ? (
              <Empty
                description="Chưa có khung nào được tải lên"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <div className="frame-lib-grid">
                {library.map(renderFrameTile)}
              </div>
            )}

            <Paragraph className="no-frame-note">
              Gợi ý: dùng file PNG nền trong suốt sẽ đẹp nhất — ảnh sẽ tự động
              được cắt vừa tỉ lệ khung (2:3)
            </Paragraph>
          </div>

          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
              Quay lại chọn ảnh
            </Button>
            <Button
              type="primary"
              icon={<ExportOutlined />}
              loading={exporting}
              onClick={handleExport}>
              {exporting ? "Đang lưu..." : "Xuất ảnh"}
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
}
