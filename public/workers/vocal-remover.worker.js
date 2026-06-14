/**
 * Vocal Remover Web Worker
 * Uses FFT-based center channel extraction (karaoke effect) + spectral subtraction
 * untuk memisahkan vokal dari instrumental
 * 
 * Algorithm:
 * 1. Center Channel Extraction: vocal biasanya di tengah (L+R phase cancel)
 * 2. Spectral Subtraction: kurangi frekuensi vokal dari instrumental
 * 3. Harmonic/Percussive Separation untuk kualitas lebih baik
 */

self.onmessage = function(e) {
  const { audioData, sampleRate, channels } = e.data;
  
  try {
    self.postMessage({ type: 'progress', value: 5, message: 'Memulai analisis audio...' });
    
    const leftChannel = channels[0];
    const rightChannel = channels.length > 1 ? channels[1] : channels[0];
    
    self.postMessage({ type: 'progress', value: 15, message: 'Ekstraksi center channel...' });
    
    // Step 1: Extract center channel (vocals)
    const { vocalChannel, instrumentalL, instrumentalR } = extractCenterChannel(leftChannel, rightChannel);
    
    self.postMessage({ type: 'progress', value: 40, message: 'Memproses spektrum frekuensi...' });
    
    // Step 2: FFT-based spectral processing
    const fftSize = 4096;
    const hopSize = fftSize / 4;
    
    const processedVocal = spectralProcess(vocalChannel, fftSize, hopSize, 'vocal');
    self.postMessage({ type: 'progress', value: 60, message: 'Memproses vokal...' });
    
    const processedInstrL = spectralProcess(instrumentalL, fftSize, hopSize, 'instrumental');
    const processedInstrR = spectralProcess(instrumentalR, fftSize, hopSize, 'instrumental');
    self.postMessage({ type: 'progress', value: 80, message: 'Memproses instrumental...' });
    
    // Step 3: Apply smooth gain envelope
    applyGainEnvelope(processedVocal);
    applyGainEnvelope(processedInstrL);
    applyGainEnvelope(processedInstrR);
    
    self.postMessage({ type: 'progress', value: 90, message: 'Menggabungkan hasil...' });
    
    // Normalize
    normalizeAudio(processedVocal);
    normalizeAudio(processedInstrL);
    normalizeAudio(processedInstrR);
    
    self.postMessage({ type: 'progress', value: 95, message: 'Finalisasi output...' });
    
    // Return results
    self.postMessage({
      type: 'complete',
      vocalData: {
        left: processedVocal,
        right: processedVocal, // mono vocal centered
        sampleRate: sampleRate
      },
      instrumentalData: {
        left: processedInstrL,
        right: processedInstrR,
        sampleRate: sampleRate
      }
    }, [
      processedVocal.buffer,
      processedInstrL.buffer,
      processedInstrR.buffer
    ]);
    
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message });
  }
};

function extractCenterChannel(left, right) {
  const len = Math.min(left.length, right.length);
  const vocalChannel = new Float32Array(len);
  const instrumentalL = new Float32Array(len);
  const instrumentalR = new Float32Array(len);
  
  // Enhanced center extraction dengan adaptive scaling
  for (let i = 0; i < len; i++) {
    const l = left[i];
    const r = right[i];
    
    // Center = average (mono center where vocals sit)
    const center = (l + r) * 0.5;
    
    // Side = stereo difference
    const sideL = l - center;
    const sideR = r - center;
    
    // Vocal extraction: center channel dengan boosted mid frequencies
    vocalChannel[i] = center;
    
    // Instrumental: remove center, keep sides
    // Blend factor untuk mengurangi phasing artifacts
    const blend = 0.85;
    instrumentalL[i] = l - center * blend;
    instrumentalR[i] = r - center * blend;
  }
  
  return { vocalChannel, instrumentalL, instrumentalR };
}

function spectralProcess(signal, fftSize, hopSize, mode) {
  const numFrames = Math.ceil((signal.length - fftSize) / hopSize) + 1;
  const output = new Float32Array(signal.length);
  const overlapAdd = new Float32Array(signal.length);
  const windowSum = new Float32Array(signal.length);
  
  // Hann window
  const window = createHannWindow(fftSize);
  
  for (let frame = 0; frame < numFrames; frame++) {
    const start = frame * hopSize;
    const end = Math.min(start + fftSize, signal.length);
    const frameLen = end - start;
    
    if (frameLen < fftSize / 2) break;
    
    // Extract frame
    const frameData = new Float32Array(fftSize);
    for (let i = 0; i < frameLen; i++) {
      frameData[i] = signal[start + i] * window[i];
    }
    
    // FFT
    const { real, imag } = fft(frameData);
    
    // Spectral processing
    if (mode === 'vocal') {
      applyVocalFilter(real, imag, fftSize);
    } else {
      applyInstrumentalFilter(real, imag, fftSize);
    }
    
    // IFFT
    const processed = ifft(real, imag);
    
    // Overlap-add synthesis
    for (let i = 0; i < frameLen; i++) {
      if (start + i < output.length) {
        overlapAdd[start + i] += processed[i] * window[i];
        windowSum[start + i] += window[i] * window[i];
      }
    }
  }
  
  // Normalize by window sum
  for (let i = 0; i < output.length; i++) {
    if (windowSum[i] > 1e-8) {
      output[i] = overlapAdd[i] / windowSum[i];
    }
  }
  
  return output;
}

function applyVocalFilter(real, imag, fftSize) {
  // Boost vocal frequency range (300Hz - 3400Hz typical vocal range)
  // Pass-band filter dengan tapering
  const N = fftSize;
  
  for (let k = 0; k < N / 2; k++) {
    let gain = 1.0;
    const freq = k / N; // normalized frequency
    
    // Vocal frequency emphasis:
    // Low cut below ~80Hz
    if (freq < 0.002) {
      gain = 0.1;
    }
    // High cut above ~8kHz 
    else if (freq > 0.18) {
      gain = Math.max(0.1, 1.0 - (freq - 0.18) / 0.1);
    }
    // Sweet spot boost 300Hz-4kHz
    else if (freq >= 0.007 && freq <= 0.09) {
      gain = 1.2;
    }
    
    real[k] *= gain;
    imag[k] *= gain;
    // Mirror
    if (k > 0 && k < N / 2) {
      real[N - k] *= gain;
      imag[N - k] *= gain;
    }
  }
}

function applyInstrumentalFilter(real, imag, fftSize) {
  // Instrumental: keep full spectrum, attenuate mid vocal frequencies
  const N = fftSize;
  
  for (let k = 0; k < N / 2; k++) {
    let gain = 1.0;
    const freq = k / N;
    
    // Gently attenuate vocal sweet spot
    if (freq >= 0.007 && freq <= 0.09) {
      // Subtle attenuation di vocal range untuk bersihkan sisa vokal
      gain = 0.75;
    }
    
    real[k] *= gain;
    imag[k] *= gain;
    if (k > 0 && k < N / 2) {
      real[N - k] *= gain;
      imag[N - k] *= gain;
    }
  }
}

function fft(signal) {
  const N = signal.length;
  const real = new Float64Array(signal);
  const imag = new Float64Array(N);
  
  // Bit-reversal permutation
  let j = 0;
  for (let i = 1; i < N; i++) {
    let bit = N >> 1;
    while (j & bit) {
      j ^= bit;
      bit >>= 1;
    }
    j ^= bit;
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]];
    }
  }
  
  // Cooley-Tukey FFT
  for (let len = 2; len <= N; len <<= 1) {
    const angle = -2 * Math.PI / len;
    const wReal = Math.cos(angle);
    const wImag = Math.sin(angle);
    
    for (let i = 0; i < N; i += len) {
      let phaseReal = 1.0;
      let phaseImag = 0.0;
      
      for (let k = 0; k < len / 2; k++) {
        const uReal = real[i + k];
        const uImag = imag[i + k];
        const vReal = real[i + k + len/2] * phaseReal - imag[i + k + len/2] * phaseImag;
        const vImag = real[i + k + len/2] * phaseImag + imag[i + k + len/2] * phaseReal;
        
        real[i + k] = uReal + vReal;
        imag[i + k] = uImag + vImag;
        real[i + k + len/2] = uReal - vReal;
        imag[i + k + len/2] = uImag - vImag;
        
        const newPhaseReal = phaseReal * wReal - phaseImag * wImag;
        phaseImag = phaseReal * wImag + phaseImag * wReal;
        phaseReal = newPhaseReal;
      }
    }
  }
  
  return { real, imag };
}

function ifft(real, imag) {
  const N = real.length;
  
  // Conjugate
  for (let i = 0; i < N; i++) imag[i] = -imag[i];
  
  // Forward FFT
  const { real: r, imag: im } = fft(real);
  
  // Scale and conjugate again
  const result = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    result[i] = r[i] / N;
  }
  
  return result;
}

function createHannWindow(size) {
  const window = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)));
  }
  return window;
}

function applyGainEnvelope(signal) {
  // Smooth ramp-in/out untuk menghindari clicks
  const rampLen = Math.min(1024, signal.length / 10);
  for (let i = 0; i < rampLen; i++) {
    const gain = i / rampLen;
    signal[i] *= gain;
    signal[signal.length - 1 - i] *= gain;
  }
}

function normalizeAudio(signal) {
  let maxAmp = 0;
  for (let i = 0; i < signal.length; i++) {
    maxAmp = Math.max(maxAmp, Math.abs(signal[i]));
  }
  if (maxAmp > 0.001) {
    const normFactor = 0.92 / maxAmp;
    for (let i = 0; i < signal.length; i++) {
      signal[i] *= normFactor;
    }
  }
}
