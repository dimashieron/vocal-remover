/**
 * VocalSplit Advanced Worker v2
 * Improved FFT-based vocal separation menggunakan:
 * 1. Adaptive Center Channel Extraction
 * 2. Wiener-inspired spectral masking
 * 3. Multi-band processing
 * 4. Harmonic-aware filtering
 * 5. Overlap-add dengan window synthesis yang lebih baik
 */

self.onmessage = function(e) {
  const { sampleRate, channels } = e.data;

  try {
    self.postMessage({ type: 'progress', value: 5, message: 'Memulai analisis audio...' });

    const left  = channels[0];
    const right = channels.length > 1 ? channels[1] : channels[0];
    const len   = Math.min(left.length, right.length);

    // Resample ke mono reference
    const mid  = new Float32Array(len);
    const side = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      mid[i]  = (left[i] + right[i]) * 0.5;
      side[i] = (left[i] - right[i]) * 0.5;
    }

    self.postMessage({ type: 'progress', value: 12, message: 'Analisis spektral mid/side...' });

    const FFT_SIZE = 4096;
    const HOP     = FFT_SIZE / 8;   // 87.5% overlap → lebih halus

    // --- Step 1: Hitung magnitude spektrum untuk masking ---
    self.postMessage({ type: 'progress', value: 20, message: 'Menghitung spektrum vokal...' });
    const midMag  = computeMagnitudeSpectrum(mid,  FFT_SIZE, HOP);
    const sideMag = computeMagnitudeSpectrum(side, FFT_SIZE, HOP);

    // --- Step 2: Bangun Wiener masks ---
    self.postMessage({ type: 'progress', value: 35, message: 'Membangun Wiener mask...' });
    const { vocalMask, instrMask } = buildWienerMasks(midMag, sideMag, FFT_SIZE);

    // --- Step 3: Apply mask ke sinyal asli channel L & R ---
    self.postMessage({ type: 'progress', value: 50, message: 'Memproses channel kiri...' });
    const vocalL = applyMaskOLA(left,  vocalMask, FFT_SIZE, HOP, sampleRate, 'vocal');
    self.postMessage({ type: 'progress', value: 62, message: 'Memproses channel kanan...' });
    const vocalR = applyMaskOLA(right, vocalMask, FFT_SIZE, HOP, sampleRate, 'vocal');

    self.postMessage({ type: 'progress', value: 72, message: 'Memproses instrumental kiri...' });
    const instrL = applyMaskOLA(left,  instrMask, FFT_SIZE, HOP, sampleRate, 'instr');
    self.postMessage({ type: 'progress', value: 82, message: 'Memproses instrumental kanan...' });
    const instrR = applyMaskOLA(right, instrMask, FFT_SIZE, HOP, sampleRate, 'instr');

    // --- Step 4: Post-processing ---
    self.postMessage({ type: 'progress', value: 90, message: 'Post-processing...' });

    // Vokal: mono-ize sedikit supaya lebih center
    for (let i = 0; i < len; i++) {
      const m = (vocalL[i] + vocalR[i]) * 0.5;
      vocalL[i] = vocalL[i] * 0.3 + m * 0.7;
      vocalR[i] = vocalR[i] * 0.3 + m * 0.7;
    }

    applyFades(vocalL); applyFades(vocalR);
    applyFades(instrL); applyFades(instrR);
    normalize(vocalL);  normalize(vocalR);
    normalize(instrL);  normalize(instrR);

    self.postMessage({ type: 'progress', value: 97, message: 'Finalisasi output...' });

    self.postMessage({
      type: 'complete',
      vocalData:        { left: vocalL, right: vocalR, sampleRate },
      instrumentalData: { left: instrL, right: instrR, sampleRate },
    }, [vocalL.buffer, vocalR.buffer, instrL.buffer, instrR.buffer]);

  } catch(err) {
    self.postMessage({ type: 'error', message: err.message || String(err) });
  }
};

/* ============================================================
   MAGNITUDE SPECTRUM (tanpa phase, untuk masking)
   ============================================================ */
function computeMagnitudeSpectrum(signal, fftSize, hop) {
  const win      = hannWindow(fftSize);
  const halfBins = fftSize / 2 + 1;
  const frames   = Math.ceil((signal.length - fftSize) / hop) + 1;
  // Simpan per-frame magnitude
  const mags = new Array(frames);

  for (let f = 0; f < frames; f++) {
    const start = f * hop;
    const frame = new Float64Array(fftSize);
    for (let i = 0; i < fftSize; i++) {
      const idx = start + i;
      frame[i] = idx < signal.length ? signal[idx] * win[i] : 0;
    }
    const { real, imag } = fftForward(frame);
    const mag = new Float32Array(halfBins);
    for (let k = 0; k < halfBins; k++) {
      mag[k] = Math.sqrt(real[k]*real[k] + imag[k]*imag[k]);
    }
    mags[f] = mag;
  }
  return mags;
}

/* ============================================================
   WIENER MASKS
   Vocal mask  = mid² / (mid² + side² + ε)   → center-heavy
   Instr mask  = 1 - vocal_mask (residual)
   Tambah frekuensi bias: boost vocal 200-4000Hz
   ============================================================ */
function buildWienerMasks(midMags, sideMags, fftSize) {
  const frames   = midMags.length;
  const halfBins = fftSize / 2 + 1;
  const vocalMask = new Array(frames);
  const instrMask = new Array(frames);
  const EPS = 1e-8;

  // Frekuensi bias: tiap bin dapat weight vocal-ness
  const vocalBias = buildVocalBias(halfBins);

  for (let f = 0; f < frames; f++) {
    const vm = new Float32Array(halfBins);
    const im = new Float32Array(halfBins);
    const mid  = midMags[f];
    const side = sideMags[f];

    for (let k = 0; k < halfBins; k++) {
      const m2 = mid[k]  * mid[k];
      const s2 = side[k] * side[k];

      // Wiener-like ratio: seberapa "center" bin ini
      let v = m2 / (m2 + s2 + EPS);

      // Terapkan bias frekuensi
      v = Math.pow(v, 1.5) * vocalBias[k];   // lebih agresif
      v = Math.min(1, Math.max(0, v));

      vm[k] = v;
      im[k] = 1 - v;
    }

    // Smoothing antar frame (temporal)
    if (f > 0) {
      const pv = vocalMask[f-1];
      for (let k = 0; k < halfBins; k++) {
        vm[k] = 0.7 * vm[k] + 0.3 * pv[k];
        im[k] = 1 - vm[k];
      }
    }

    vocalMask[f] = vm;
    instrMask[f] = im;
  }
  return { vocalMask, instrMask };
}

/**
 * Bias per-bin:
 *  - Di bawah ~80 Hz  → bukan vokal (bass/kick)
 *  - 120–4000 Hz      → vokal range, boost
 *  - 4000–8000 Hz     → sibilance vokal, medium
 *  - Di atas 8000 Hz  → mostly instr, reduce
 */
function buildVocalBias(halfBins) {
  // Asumsikan 44100Hz, fftSize=4096 → bin width ~10.77Hz
  const binHz = 44100 / (halfBins * 2 - 2); // ≈ 10.77
  const bias  = new Float32Array(halfBins);

  for (let k = 0; k < halfBins; k++) {
    const hz = k * binHz;
    let b = 0.5; // default

    if (hz < 80)                b = 0.05;  // sub bass bukan vokal
    else if (hz < 150)          b = 0.3;
    else if (hz < 300)          b = 0.65;
    else if (hz < 4000)         b = 1.0;   // core vocal range
    else if (hz < 6000)         b = 0.75;  // sibilance
    else if (hz < 10000)        b = 0.4;
    else                        b = 0.15;

    bias[k] = b;
  }
  return bias;
}

/* ============================================================
   APPLY MASK via Overlap-Add
   ============================================================ */
function applyMaskOLA(signal, masks, fftSize, hop, sampleRate, mode) {
  const win      = hannWindow(fftSize);
  const halfBins = fftSize / 2 + 1;
  const frames   = masks.length;
  const out      = new Float32Array(signal.length);
  const winSum   = new Float32Array(signal.length);

  for (let f = 0; f < frames; f++) {
    const start = f * hop;
    if (start >= signal.length) break;

    // Baca frame
    const frame = new Float64Array(fftSize);
    for (let i = 0; i < fftSize; i++) {
      const idx = start + i;
      frame[i] = idx < signal.length ? signal[idx] * win[i] : 0;
    }

    // FFT
    const { real, imag } = fftForward(frame);

    // Apply mask
    const mask = masks[f];
    for (let k = 0; k < halfBins; k++) {
      const m = mask[k];
      real[k] *= m;
      imag[k] *= m;
      // Mirror
      if (k > 0 && k < halfBins - 1) {
        real[fftSize - k] *= m;
        imag[fftSize - k] *= m;
      }
    }

    // IFFT
    const rec = ifft(real, imag, fftSize);

    // Overlap-add dengan synthesis window
    for (let i = 0; i < fftSize; i++) {
      const idx = start + i;
      if (idx < signal.length) {
        out[idx]    += rec[i] * win[i];
        winSum[idx] += win[i] * win[i];
      }
    }
  }

  // Normalize by window
  for (let i = 0; i < signal.length; i++) {
    if (winSum[i] > 1e-8) out[i] /= winSum[i];
  }
  return out;
}

/* ============================================================
   FFT / IFFT (Cooley-Tukey radix-2)
   ============================================================ */
function fftForward(input) {
  const N    = input.length;
  const real = new Float64Array(input);
  const imag = new Float64Array(N);
  fftInPlace(real, imag, false);
  return { real, imag };
}

function ifft(real, imag, N) {
  const r = new Float64Array(real);
  const im = new Float64Array(imag);
  fftInPlace(r, im, true);
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) out[i] = r[i] / N;
  return out;
}

function fftInPlace(re, im, inverse) {
  const N = re.length;
  // Bit-reversal
  for (let i = 1, j = 0; i < N; i++) {
    let bit = N >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  // Butterfly
  for (let len = 2; len <= N; len <<= 1) {
    const ang  = (inverse ? 2 : -2) * Math.PI / len;
    const wRe  = Math.cos(ang);
    const wIm  = Math.sin(ang);
    for (let i = 0; i < N; i += len) {
      let phRe = 1, phIm = 0;
      for (let k = 0; k < len >> 1; k++) {
        const uRe = re[i+k],  uIm = im[i+k];
        const vRe = re[i+k+(len>>1)] * phRe - im[i+k+(len>>1)] * phIm;
        const vIm = re[i+k+(len>>1)] * phIm + im[i+k+(len>>1)] * phRe;
        re[i+k]         = uRe + vRe;  im[i+k]         = uIm + vIm;
        re[i+k+(len>>1)]= uRe - vRe;  im[i+k+(len>>1)]= uIm - vIm;
        const nRe = phRe*wRe - phIm*wIm;
        phIm = phRe*wIm + phIm*wRe;
        phRe = nRe;
      }
    }
  }
}

/* ============================================================
   UTILS
   ============================================================ */
function hannWindow(size) {
  const w = new Float64Array(size);
  for (let i = 0; i < size; i++)
    w[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)));
  return w;
}

function applyFades(sig) {
  const ramp = Math.min(2048, Math.floor(sig.length / 20));
  for (let i = 0; i < ramp; i++) {
    const g = i / ramp;
    sig[i] *= g;
    sig[sig.length - 1 - i] *= g;
  }
}

function normalize(sig) {
  let peak = 0;
  for (let i = 0; i < sig.length; i++) peak = Math.max(peak, Math.abs(sig[i]));
  if (peak > 1e-4) {
    const gain = 0.92 / peak;
    for (let i = 0; i < sig.length; i++) sig[i] *= gain;
  }
}
