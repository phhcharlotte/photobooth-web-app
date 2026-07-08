import { LayoutType } from "../types";

interface Props {
  value: LayoutType | null;
  onSelect: (layout: LayoutType) => void;
  onConfirm: () => void;
  onBack: () => void;
}

const OPTIONS: { layout: LayoutType; cols: number; rows: number; label: string }[] = [
  { layout: 1, cols: 1, rows: 1, label: "1 kieu" },
  { layout: 2, cols: 1, rows: 2, label: "2 kieu" },
  { layout: 4, cols: 2, rows: 2, label: "4 kieu" },
  { layout: 6, cols: 2, rows: 3, label: "6 kieu" },
];

export default function LayoutSelector({ value, onSelect, onConfirm, onBack }: Props) {
  return (
    <div className="screen">
      <div className="eyebrow">Buoc 1 / 4</div>
      <h1 className="headline">Chon so kieu anh trong khung in</h1>
      <p className="subline">
        Chon bo cuc khung anh cuoi cung. Ban van se chup du 10 kieu, sau do tu chon ra so anh dep nhat
        de dat vao cac o cua khung.
      </p>

      <div className="layout-grid">
        {OPTIONS.map((opt) => (
          <button
            key={opt.layout}
            className={`layout-card ${value === opt.layout ? "selected" : ""}`}
            onClick={() => onSelect(opt.layout)}
          >
            <div
              className="layout-preview"
              style={{
                gridTemplateColumns: `repeat(${opt.cols}, 1fr)`,
                gridTemplateRows: `repeat(${opt.rows}, 1fr)`,
              }}
            >
              {Array.from({ length: opt.cols * opt.rows }).map((_, i) => (
                <div className="slot" key={i} />
              ))}
            </div>
            <div className="layout-card-label">{opt.label}</div>
          </button>
        ))}
      </div>

      <div className="btn-row">
        <button className="btn btn-ghost" onClick={onBack}>
          Quay lai
        </button>
        <button className="btn btn-primary" disabled={!value} onClick={onConfirm}>
          Bat dau chup →
        </button>
      </div>
    </div>
  );
}
