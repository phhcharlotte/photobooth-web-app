import { Button, Select, Space, Typography } from "antd";
import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";
import {
  DEFAULT_TOTAL_SHOTS,
  MAX_TOTAL_SHOTS,
  REQUIRED_PICKS,
} from "../config";
import { LayoutType } from "../types";

const { Title, Paragraph } = Typography;

interface Props {
  value: LayoutType | null;
  shotCount: number;
  onSelect: (layout: LayoutType) => void;
  onShotCountChange: (count: number) => void;
  onConfirm: () => void;
  onBack: () => void;
}

const OPTIONS: {
  layout: LayoutType;
  cols: number;
  rows: number;
  label: string;
}[] = [
  { layout: 1, cols: 1, rows: 1, label: "1 kieu" },
  { layout: 2, cols: 1, rows: 2, label: "2 kieu" },
  { layout: 4, cols: 2, rows: 2, label: "4 kieu" },
  { layout: 6, cols: 2, rows: 3, label: "6 kieu" },
];

export default function LayoutSelector({
  value,
  shotCount,
  onSelect,
  onShotCountChange,
  onConfirm,
  onBack,
}: Props) {
  const minShots = value ? (REQUIRED_PICKS[value] ?? 1) : 1;
  const shotOptions = Array.from(
    { length: MAX_TOTAL_SHOTS - minShots + 1 },
    (_, i) => minShots + i,
  );

  return (
    <div className="screen">
      <div className="eyebrow">Bước 1 / 4</div>
      <Title level={2} style={{ margin: 0, textAlign: "center" }}>
        Chọn số kiểu ảnh trong khung in
      </Title>
      <Paragraph
        style={{
          maxWidth: 520,
          textAlign: "center",
          color: "var(--lilac, #a79cc0)",
        }}>
        Chọn bố cục khung ảnh cuối cùng, sau đó chọn số lần chụp ảnh trong lần
        này (mặc định {DEFAULT_TOTAL_SHOTS}, tối đa {MAX_TOTAL_SHOTS}). Bạn sẽ
        lựa chọn ảnh ưng ý nhất đẻ lựa vào các khung ảnh.
      </Paragraph>

      <div className="layout-grid">
        {OPTIONS.map((opt) => (
          <button
            key={opt.layout}
            className={`layout-card ${value === opt.layout ? "selected" : ""}`}
            onClick={() => onSelect(opt.layout)}>
            <div
              className="layout-card__preview"
              style={{
                gridTemplateColumns: `repeat(${opt.cols}, 1fr)`,
                gridTemplateRows: `repeat(${opt.rows}, 1fr)`,
              }}>
              {Array.from({ length: opt.cols * opt.rows }).map((_, i) => (
                <div className="slot" key={i} />
              ))}
            </div>
            <div className="layout-card__label">{opt.label}</div>
          </button>
        ))}
      </div>

      {value && (
        <div className="shotcount-block">
          <label className="shotcount-block__label" htmlFor="shotCount">
            Số kiểu chụp trong lần này
          </label>
          <Select
            id="shotCount"
            value={shotCount}
            onChange={onShotCountChange}
            style={{ width: 120 }}
            options={shotOptions.map((n) => ({ value: n, label: `${n} kieu` }))}
          />
        </div>
      )}

      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          Quay lại
        </Button>
        <Button
          type="primary"
          disabled={!value}
          onClick={onConfirm}
          iconPosition="end"
          icon={<ArrowRightOutlined />}>
          Bắt đầu chụp
        </Button>
      </Space>
    </div>
  );
}
