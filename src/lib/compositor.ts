import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../config";
import type { LayoutType } from "../types";

export interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Khoang le ngoai (de danh cho vien khung khong che mat anh) */
const OUTER_MARGIN = 40;
const GAP = 20;

/**
 * Tra ve vi tri (o) cho tung anh trong canvas tuy theo layout duoc chon.
 * 1 -> 1 anh lon
 * 2 -> 2 anh xep chong (kieu strip doc)
 * 4 -> luoi 2x2
 * 6 -> luoi 2 cot x 3 hang
 */
export function getLayoutSlots(layout: LayoutType): Slot[] {
  const innerX = OUTER_MARGIN;
  const innerY = OUTER_MARGIN;
  const innerW = CANVAS_WIDTH - OUTER_MARGIN * 2;
  const innerH = CANVAS_HEIGHT - OUTER_MARGIN * 2;

  switch (layout) {
    case 1:
      return [{ x: innerX, y: innerY, w: innerW, h: innerH }];

    case 2: {
      const h = (innerH - GAP) / 2;
      return [
        { x: innerX, y: innerY, w: innerW, h },
        { x: innerX, y: innerY + h + GAP, w: innerW, h },
      ];
    }

    case 4: {
      const w = (innerW - GAP) / 2;
      const h = (innerH - GAP) / 2;
      const slots: Slot[] = [];
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 2; col++) {
          slots.push({
            x: innerX + col * (w + GAP),
            y: innerY + row * (h + GAP),
            w,
            h,
          });
        }
      }
      return slots;
    }

    case 6: {
      const w = (innerW - GAP) / 2;
      const h = (innerH - GAP * 2) / 3;
      const slots: Slot[] = [];
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 2; col++) {
          slots.push({
            x: innerX + col * (w + GAP),
            y: innerY + row * (h + GAP),
            w,
            h,
          });
        }
      }
      return slots;
    }

    default:
      return [{ x: innerX, y: innerY, w: innerW, h: innerH }];
  }
}

/** Ve 1 anh vao 1 o theo kieu "cover" (giu ty le, cat phan du, lap day o) */
export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  slot: Slot,
) {
  const slotRatio = slot.w / slot.h;
  const imgRatio = img.width / img.height;

  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (imgRatio > slotRatio) {
    // Anh rong hon o -> cat 2 ben
    sw = img.height * slotRatio;
    sx = (img.width - sw) / 2;
  } else {
    // Anh cao hon o -> cat tren/duoi
    sh = img.width / slotRatio;
    sy = (img.height - sh) / 2;
  }

  ctx.save();
  roundRectPath(ctx, slot.x, slot.y, slot.w, slot.h, 14);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, slot.x, slot.y, slot.w, slot.h);
  ctx.restore();
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Tai 1 anh (dataURL/path) thanh HTMLImageElement, cho phep await */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Tu dong cat (center-crop, kieu "cover") anh khung vien nguoi dung tai len
 * cho khop dung ty le canvas (CANVAS_WIDTH x CANVAS_HEIGHT), giu nguyen
 * vung trong suot cua PNG (khong to nen). Nho vay khi ghep vao anh cuoi
 * cung, khung se khong bi keo meo du anh goc co ty le khac.
 */
export async function cropFrameToCanvasAspect(
  dataUrl: string,
): Promise<string> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Không lấy được context 2D");

  const targetRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
  const srcRatio = img.width / img.height;

  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (srcRatio > targetRatio) {
    // Anh rong hon khung dich -> cat bot 2 ben trai/phai
    sw = img.height * targetRatio;
    sx = (img.width - sw) / 2;
  } else {
    // Anh cao hon khung dich -> cat bot tren/duoi
    sh = img.width / targetRatio;
    sy = (img.height - sh) / 2;
  }

  // KHONG fillRect nen - giu canvas trong suot de PNG alpha duoc bao toan
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  return canvas.toDataURL("image/png");
}

/**
 * Ve toan bo layout: nen trang -> tung anh vao o -> khung vien (neu co) de len tren cung.
 * Khung vien nen la PNG co nen trong suot, kich thuoc bat ky (se duoc keo gian vua canvas).
 */
export async function composeFinalImage(
  canvas: HTMLCanvasElement,
  layout: LayoutType,
  photoDataUrls: string[],
  frameDataUrl: string | null,
): Promise<string> {
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Không lấy được context 2D");

  // Nen trang lam giay in
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const slots = getLayoutSlots(layout);
  const images = await Promise.all(photoDataUrls.map(loadImage));

  slots.forEach((slot, i) => {
    if (images[i]) drawImageCover(ctx, images[i], slot);
  });

  if (frameDataUrl) {
    const frameImg = await loadImage(frameDataUrl);
    ctx.drawImage(frameImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  return canvas.toDataURL("image/png");
}
