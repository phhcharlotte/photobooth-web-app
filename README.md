# Photobooth App

Ung dung Photobooth desktop dung **Electron + React + TypeScript**.

## Tinh nang

- Tu dong dem nguoc **15 giay** cho moi kieu tao dang, chup lien tuc **10 kieu**/phien.
- Tu dong **quay video** toan bo phien chup, tu luc bat dau den luc ket thuc.
- Anh (`.png`) va video (`.webm`) duoc **luu truc tiep vao may tinh**:
  - Windows/macOS/Linux: thu muc `Pictures/Photobooth/` (`photos/`, `videos/`, `exports/`)
- Chon bo cuc khung truoc khi chup: **1 / 2 / 4 / 6** kieu anh.
- Sau khi chup, chon ra cac kieu anh ung y nhat de dat vao khung.
- **Tai khung vien (border) tu may tinh len** (PNG nen trong suot) de tao khung rieng, khung se
  duoc luu lai de dung cho cac lan sau (thu vien khung).
- Xuat ra 1 anh hoan chinh da ghep khung, luu vao thu muc `exports/`.

## Cau truc du an

```
photobooth-app/
├─ electron/            # Ma nguon tien trinh Electron (main + preload)
│  ├─ main.ts           # Tao cua so, xu ly luu anh/video, chon khung vien...
│  └─ preload.ts        # Cau noi an toan giua renderer (React) va main process
├─ src/                 # Ma nguon giao dien React
│  ├─ components/       # LayoutSelector, CaptureSession, ReviewGallery, FrameComposer
│  ├─ lib/compositor.ts # Logic ve/ghep anh vao khung tren canvas
│  ├─ config.ts         # <-- CAC THONG SO DE TUY CHINH (thoi gian dem, so kieu chup...)
│  ├─ App.tsx            # Dieu huong cac man hinh
│  └─ styles.css        # Giao dien (theme "marquee/filmstrip")
├─ package.json
└─ vite.config.ts
```

## Cai dat & chay thu (development)

Yeu cau: Node.js >= 18.

```bash
npm install
npm run dev
```

Lenh nay se mo Vite dev server + cua so Electron, tu tai lai khi ban sua code.

> Luu y: lan dau chay, he dieu hanh se hoi xin quyen truy cap **Camera** va **Microphone** —
> ban can dong y de tinh nang chup anh/quay video hoat dong.

## Dong goi de gui cho nguoi khac dung (build ra file cai dat)

```bash
npm run dist          # build cho he dieu hanh hien tai
npm run dist:win      # build file .exe (NSIS) cho Windows
npm run dist:mac      # build file .dmg cho macOS
npm run dist:linux    # build file .AppImage cho Linux
```

File cai dat/chay duoc se nam trong thu muc `release/`. Ban gui file trong thu muc do
cho nguoi khac la ho cai duoc, khong can cai Node.js hay bat ky thu gi khac.

> Muon co icon rieng cho app: xem huong dan trong `build/README.txt`.

## Tuy chinh nhanh (khong can dong vao logic)

Mo file `src/config.ts`:

- `COUNTDOWN_SECONDS` — so giay dem nguoc moi kieu (mac dinh 15s)
- `TOTAL_SHOTS` — tong so kieu chup 1 phien (mac dinh 10)
- `REQUIRED_PICKS` — so anh phai chon o buoc Review theo tung layout (1/2/4/6)
- `CANVAS_WIDTH` / `CANVAS_HEIGHT` — kich thuoc anh in cuoi cung
- `VIDEO_WIDTH` / `VIDEO_HEIGHT` / `VIDEO_BITRATE` — chat luong video quay lai

Muon doi bo cuc cac o anh trong khung (vi du muon layout 4 la 1 hang ngang thay vi luoi 2x2),
sua trong `src/lib/compositor.ts`, ham `getLayoutSlots()`.

Muon doi giao dien/mau sac, sua cac bien CSS o dau file `src/styles.css` (phan `:root`).

## Ghi chu ky thuat

- Video duoc quay bang `MediaRecorder` (dinh dang `.webm`) — day la dinh dang duoc trinh duyet/Chromium
  ho tro tot nhat khong can them thu vien ngoai. Neu ban can xuat `.mp4`, co the tich hop them `ffmpeg`
  (goi y: dung goi `ffmpeg-static` + `fluent-ffmpeg` trong `electron/main.ts` de convert sau khi luu).
- Khung vien nen la anh PNG **nen trong suot**, ty le canh gan voi khung in (mac dinh 1200x1800, ty le 2:3)
  de khi keo gian vao canvas khong bi meo.
- Anh trong khung duoc ve theo kieu "cover" (giu ty le, cat bot phan du) de lap day tung o.
