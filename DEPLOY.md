# 🚀 Panduan Deploy ke GitHub Pages

## Langkah-langkah

### 1. Buat repo baru di GitHub

Pergi ke https://github.com/new dan buat repo dengan nama misalnya `vocal-remover`.

### 2. Clone dan setup

```bash
git clone https://github.com/USERNAME/vocal-remover.git
cd vocal-remover
```

Copy semua file project ini ke dalam folder tersebut.

### 3. ⚠️ WAJIB: Set basePath di next.config.ts

```ts
// next.config.ts
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: '/vocal-remover',       // ← nama repo kamu
  assetPrefix: '/vocal-remover/',   // ← sama persis
};
```

Kalau nama repo kamu `my-app`, ganti menjadi `/my-app`.

### 4. Push ke GitHub

```bash
git add .
git commit -m "Initial commit: VocalSplit"
git push origin main
```

### 5. Aktifkan GitHub Pages

1. Buka repo di GitHub
2. Klik **Settings** (tab paling kanan)
3. Scroll ke bawah ke section **Pages**
4. Di **Source**, pilih: **GitHub Actions**
5. Klik **Save**

### 6. Tunggu deployment

- Buka tab **Actions** di repo kamu
- Tunggu workflow `Deploy VocalSplit to GitHub Pages` selesai
- Biasanya 1-3 menit

### 7. Akses app

```
https://USERNAME.github.io/vocal-remover/
```

---

## ❓ FAQ

**Q: Worker tidak jalan / audio tidak diproses?**
A: Pastikan `basePath` di `next.config.ts` sudah sesuai nama repo. Worker di-serve dari `/repo-name/workers/vocal-remover.worker.js`.

**Q: Halaman 404 setelah deploy?**
A: Pastikan GitHub Pages source diset ke "GitHub Actions", bukan "Deploy from branch".

**Q: Apakah perlu bayar?**
A: Tidak sama sekali. GitHub Pages gratis untuk repo public.
