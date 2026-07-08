/**
 * TAT CA CAC THONG SO DE TUY CHINH NAM O DAY
 * Ban muon doi thoi gian dem nguoc, so kieu chup, kich thuoc khung in...
 * chi can sua trong file nay, khong can dong vao logic o noi khac.
 */

/** So giay dem nguoc truoc moi lan chup (mac dinh: 15s) */
export const COUNTDOWN_SECONDS = 15;

/** Tong so kieu anh chup trong 1 phien (mac dinh: 10 kieu) */
export const TOTAL_SHOTS = 10;

/** So anh dep nhat nguoi dung phai chon o buoc "Review" de dat vao khung,
 * key la loai layout (1/2/4/6), value la so anh can chon = dung bang so o cua layout do */
export const REQUIRED_PICKS: Record<number, number> = {
  1: 1,
  2: 2,
  4: 4,
  6: 6,
};

/** Kich thuoc canvas (px) dung de ghep anh cuoi cung, ty le ~ giay in 2x6 hoac 4x6 tuy layout */
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 1800;

/** Do phan giai video quay lai (khuyen nghi giu 1280x720 de file nhe) */
export const VIDEO_WIDTH = 1280;
export const VIDEO_HEIGHT = 720;

/** Bitrate video (bps) - giam neu muon file nho hon */
export const VIDEO_BITRATE = 2_500_000;

/** Thoi gian hien hieu ung flash sau khi chup (ms) */
export const FLASH_DURATION_MS = 220;

/** Doi mau chu de (marquee amber) - dung dong bo voi bien CSS trong styles.css neu doi */
export const THEME_ACCENT = "#ffb43c";
