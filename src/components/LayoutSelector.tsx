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
      <div className="eyebrow">Buoc 1 / 4</div>
      <Title level={2} style={{ margin: 0, textAlign: "center" }}>
        Chon so kieu anh trong khung in
      </Title>
      <Paragraph
        style={{
          maxWidth: 520,
          textAlign: "center",
          color: "var(--lilac, #a79cc0)",
        }}>
        Chon bo cuc khung anh cuoi cung, sau do chon so kieu se chup trong phien
        nay (mac dinh {DEFAULT_TOTAL_SHOTS}, toi da {MAX_TOTAL_SHOTS}). Ban se
        tu chon ra anh dep nhat de dat vao cac o cua khung.
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
            So kieu se chup trong phien nay
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
          Quay lai
        </Button>
        <Button
          type="primary"
          disabled={!value}
          onClick={onConfirm}
          iconPosition="end"
          icon={<ArrowRightOutlined />}>
          Bat dau chup
        </Button>
      </Space>
    </div>
  );
}
