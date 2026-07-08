import { useState } from "react";
import { REQUIRED_PICKS } from "../config";
import { CapturedPhoto, LayoutType } from "../types";

interface Props {
  photos: CapturedPhoto[];
  layout: LayoutType;
  onConfirm: (pickedInOrder: CapturedPhoto[]) => void;
  onBack: () => void;
}

export default function ReviewGallery({ photos, layout, onConfirm, onBack }: Props) {
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
    <div className="screen-scroll" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <div style={{ textAlign: "center" }}>
        <div className="eyebrow">Buoc 3 / 4</div>
        <h1 className="headline">Chon anh ung y nhat</h1>
        <p className="subline">
          Khung ban chon co <strong>{required}</strong> o anh. Hay chon dung {required} kieu dep nhat
          trong 10 kieu vua chup — thu tu ban chon se la thu tu dat vao khung.
        </p>
        <p className="pick-status">
          Da chon <strong>{picked.length}</strong> / {required}
        </p>
      </div>

      <div className="review-grid">
        {photos.map((photo) => {
          const order = picked.indexOf(photo.id);
          const isPicked = order !== -1;
          return (
            <div
              key={photo.id}
              className={`review-thumb ${isPicked ? "picked" : ""}`}
              onClick={() => toggle(photo.id)}
            >
              <img src={photo.dataUrl} alt="Kieu anh da chup" />
              {isPicked && <div className="pick-badge">{order + 1}</div>}
            </div>
          );
        })}
      </div>

      <div className="btn-row">
        <button className="btn btn-ghost" onClick={onBack}>
          Chup lai tu dau
        </button>
        <button className="btn btn-primary" disabled={!canConfirm} onClick={handleConfirm}>
          Ghep vao khung →
        </button>
      </div>
    </div>
  );
}
