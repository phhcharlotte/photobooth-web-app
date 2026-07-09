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
      console.error("Loi xu ly khung vien:", e);
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
            title="Xoa khung vien nay?"
            okText="Xoa"
            cancelText="Thoi"
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
        <div className="eyebrow">Buoc 4 / 4</div>
        <Title level={2} style={{ margin: "6px 0 2px" }}>
          Ghep khung vien
        </Title>
        <Paragraph style={{ maxWidth: 520, color: "var(--lilac, #a79cc0)" }}>
          Chon 1 khung mau co san, hoac tai anh khung vien rieng tu may tinh —
          anh se duoc tu dong cat cho khop ty le khung in, khong bi meo.
        </Paragraph>
      </div>

      <div className="compose-layout">
        <div className="compose-canvas-wrap">
          <canvas ref={canvasRef} />
        </div>

        <div className="compose-side">
          <div>
            <div className="side-block-title">Khung mau co san</div>
            <div className="frame-lib-grid">
              <div
                className={`frame-lib-item ${!selectedFrame ? "selected" : ""}`}
                onClick={() => setSelectedFrame(null)}
                title="Khong dung khung vien">
                <div className="frame-lib-item__empty-label">Khong khung</div>
              </div>
              {BUILT_IN_FRAMES.map(renderFrameTile)}
            </div>
          </div>

          <div>
            <div className="side-block-title">Khung rieng cua ban</div>
            <Button
              block
              type="dashed"
              size="large"
              icon={<UploadOutlined />}
              loading={uploading}
              onClick={handleUploadFrame}
              style={{ marginBottom: 12 }}>
              {uploading
                ? "Dang xu ly anh..."
                : "Tai anh khung vien tu may tinh"}
            </Button>

            {loadingLib ? (
              <Spin />
            ) : library.length === 0 ? (
              <Empty
                description="Chua co khung nao ban tu tai len"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <div className="frame-lib-grid">
                {library.map(renderFrameTile)}
              </div>
            )}

            <Paragraph className="no-frame-note">
              Goi y: dung file PNG nen trong suot se dep nhat — anh se tu dong
              duoc cat vua ty le khung in (2:3), phan giua van trong suot de lo
              anh chup.
            </Paragraph>
          </div>

          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
              Quay lai chon anh
            </Button>
            <Button
              type="primary"
              icon={<ExportOutlined />}
              loading={exporting}
              onClick={handleExport}>
              {exporting ? "Dang luu..." : "Xuat anh hoan chinh"}
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
}
