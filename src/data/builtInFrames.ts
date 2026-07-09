import marqueeGold from "../assets/frames/marquee-gold.svg";
import filmstripNoir from "../assets/frames/filmstrip-noir.svg";
import pastelBloom from "../assets/frames/pastel-bloom.svg";
import confettiParty from "../assets/frames/confetti-party.svg";
import minimalMono from "../assets/frames/minimal-mono.svg";
import { FrameAsset } from "../types";

/**
 * Khung vien dung san co san trong app (khong can tai len).
 * Moi khung co "path" bat dau bang "builtin:" de FrameComposer nhan biet
 * va an nut xoa (khong the xoa khung dung san).
 * Muon them/bot khung mau: sua mang nay va bo file .svg tuong ung vao
 * src/assets/frames/.
 */
export const BUILT_IN_FRAMES: FrameAsset[] = [
  { name: "Marquee Gold", path: "builtin:marquee-gold", dataUrl: marqueeGold },
  {
    name: "Filmstrip Noir",
    path: "builtin:filmstrip-noir",
    dataUrl: filmstripNoir,
  },
  { name: "Pastel Bloom", path: "builtin:pastel-bloom", dataUrl: pastelBloom },
  {
    name: "Confetti Party",
    path: "builtin:confetti-party",
    dataUrl: confettiParty,
  },
  { name: "Minimal Mono", path: "builtin:minimal-mono", dataUrl: minimalMono },
];

export function isBuiltInFrame(asset: FrameAsset): boolean {
  return asset.path.startsWith("builtin:");
}
