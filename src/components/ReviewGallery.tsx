import { useState } from "react";
import { Badge, Button, Space, Typography } from "antd";
import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { REQUIRED_PICKS } from "../config";
import { CapturedPhoto, LayoutType } from "../types";

const { Title, Paragraph, Text } = Typography;

interface Props {
  photos: CapturedPhoto[];
  layout: LayoutType;
  onConfirm: (pickedInOrder: CapturedPhoto[]) => void;
  onBack: () => void;
}

export default function ReviewGallery({
  photos,
  layout,
  onConfirm,
  onBack,
}: Props) {
  const required = REQUIRED_PICKS[layout] ?? 1;
  const [picked, setPicked] = useState<string[]>([]);

  function toggle(id: string) {
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= required) return prev; // du so luong roi, khong cho chon them
      return [...prev, id];
    });
  }

  const canConfirm = picked.length === required;

  function handleConfirm() {
    const orderedPhotos = picked
      .map((id) => photos.find((p) => p.id === id))
      .filter((p): p is CapturedPhoto => Boolean(p));
    onConfirm(orderedPhotos);
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
        <div className="eyebrow">Buoc 3 / 4</div>
        <Title level={2} style={{ margin: "6px 0 2px" }}>
          Chon anh ung y nhat
        </Title>
        <Paragraph style={{ maxWidth: 520, color: "var(--lilac, #a79cc0)" }}>
          Khung ban chon co{" "}
          <Text strong style={{ color: "#ffb43c" }}>
            {required}
          </Text>{" "}
          o anh. Hay chon dung {required} kieu dep nhat — thu tu ban chon se la
          thu tu dat vao khung.
        </Paragraph>
        <Text
          style={{ fontFamily: "monospace", color: "var(--lilac, #a79cc0)" }}>
          Da chon{" "}
          <Text strong style={{ color: "#ffb43c" }}>
            {picked.length}
          </Text>{" "}
          / {required}
        </Text>
      </div>

      <div className="review-grid">
        {photos.map((photo) => {
          const order = picked.indexOf(photo.id);
          const isPicked = order !== -1;
          return (
            <div
              key={photo.id}
              className={`review-thumb ${isPicked ? "picked" : ""}`}
              onClick={() => toggle(photo.id)}>
              <img src={photo.dataUrl} alt="Kieu anh da chup" />
              {isPicked && (
                <Badge
                  count={order + 1}
                  color="#ffb43c"
                  className="review-thumb__badge"
                  style={{ color: "#201406", fontWeight: 700 }}
                />
              )}
            </div>
          );
        })}
      </div>

      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          Chụp lại từ đầu
        </Button>
        <Button
          type="primary"
          disabled={!canConfirm}
          onClick={handleConfirm}
          iconPosition="end"
          icon={<ArrowRightOutlined />}>
          Ghép vào khung
        </Button>
      </Space>
    </div>
  );
}
