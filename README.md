# 🎤 VocalSplit — AI Vocal Remover

> Pisahkan vokal dari instrumental langsung di browser. Zero server, zero cost, 100% privat.

**Live demo:** `https://username.github.io/vocal-remover`

---

## ✨ Fitur

- 🎤 **Vocal Separation** — isolasi track vokal dari lagu
- 🎸 **Instrumental Extraction** — ambil background music tanpa vokal
- 📊 **Waveform Visualizer** — lihat gelombang audio secara visual
- ▶️ **Audio Preview** — putar langsung di browser sebelum download
- 📥 **Download WAV** — export kualitas lossless 16-bit stereo
- 📊 **Progress Bar** — real-time status pemrosesan
- 🔒 **Zero Upload** — audio tidak pernah keluar dari browser kamu
- 💸 **Gratis Selamanya** — deploy ke GitHub Pages, no hosting cost

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16 (Static Export) |
| UI | React 19 + TypeScript + Tailwind CSS 4 |
| Audio Processing | Web Audio API + Web Workers |
| Algorithm | FFT-based Center Channel Extraction |
| Deployment | GitHub Pages via GitHub Actions |

## 🚀 Deploy ke GitHub Pages

### 1. Fork / Clone repo ini

```bash
git clone https://github.com/username/vocal-remover.git
cd vocal-remover
```

### 2. Sesuaikan basePath (WAJIB untuk GitHub Pages)

Edit `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: '/vocal-remover',       // ← ganti dengan nama repo kamu
  assetPrefix: '/vocal-remover/',   // ← sama dengan basePath
};
```

### 3. Push ke GitHub

```bash
git add .
git commit -m "Deploy VocalSplit"
git push origin main
```

### 4. Aktifkan GitHub Pages

1. Buka repo di GitHub → **Settings** → **Pages**
2. Source: pilih **GitHub Actions**
3. Tunggu workflow selesai (~2 menit)
4. Akses di: `https://username.github.io/vocal-remover`

## 💻 Development Lokal

```bash
npm install
npm run dev
# Buka http://localhost:3000
```

## 📦 Build Manual

```bash
npm run build
# Output ada di folder ./out
```

## 🎵 Format Audio yang Didukung

| Format | Extension |
|--------|-----------|
| MP3 | `.mp3` |
| WAV | `.wav` |
| FLAC | `.flac` |
| AAC | `.aac` |
| OGG Vorbis | `.ogg` |
| M4A | `.m4a` |

Maks ukuran file: **100MB**

## ⚙️ Cara Kerja

VocalSplit menggunakan **FFT-based Center Channel Extraction**:

1. **Stereo Decoding** — audio di-decode via Web Audio API
2. **Center Channel Extraction** — vokal di-isolasi dari center stereo image `Center = (L + R) / 2`
3. **Spectral Processing** — FFT 4096-point dengan Hann window untuk filter frekuensi
4. **Vocal Filter** — boost 300Hz–4kHz (vocal range), attenuate yang lain
5. **Instrumental Filter** — kurangi vocal range, pertahankan full spectrum
6. **WAV Encoding** — output 16-bit PCM stereo, langsung bisa di-download

> **Note:** Kualitas terbaik pada lagu dengan vokal di center stereo (mayoritas lagu pop/rock modern).

## 📁 Struktur Project

```
vocal-remover/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD
├── public/
│   └── workers/
│       └── vocal-remover.worker.js  # Web Worker FFT processing
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Main UI
│   │   └── globals.css
│   ├── components/
│   │   ├── AudioPlayer.tsx     # Player dengan waveform
│   │   ├── DropZone.tsx        # Upload area
│   │   ├── ProgressBar.tsx     # Progress indicator
│   │   └── WaveformVisualizer.tsx
│   └── lib/
│       ├── useAudioProcessor.ts # React hook
│       └── wavEncoder.ts        # WAV file encoder
├── next.config.ts
└── package.json
```

## 📄 Lisensi

MIT License — bebas digunakan, dimodifikasi, dan didistribusikan.
