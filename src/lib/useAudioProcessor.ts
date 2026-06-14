import { useState, useCallback, useRef } from 'react';
import { encodeWAV } from './wavEncoder';

export interface ProcessingResult {
  vocalBlob: Blob;
  instrumentalBlob: Blob;
  vocalUrl: string;
  instrumentalUrl: string;
  originalName: string;
}

export interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  message: string;
  error: string | null;
  result: ProcessingResult | null;
}

// Resolve worker path relative to current page (supports GitHub Pages basePath)
function getWorkerUrl(): string {
  if (typeof window === 'undefined') return '/workers/vocal-remover.worker.js';
  const base = window.location.pathname.replace(/\/[^/]*$/, '').replace(/\/$/, '');
  // If on GitHub Pages like /repo-name/, base would be /repo-name
  return `${base}/workers/vocal-remover.worker.js`;
}

export function useAudioProcessor() {
  const [state, setState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    message: '',
    error: null,
    result: null,
  });

  const workerRef = useRef<Worker | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const cleanupPreviousResult = useCallback(() => {
    setState(prev => {
      if (prev.result) {
        URL.revokeObjectURL(prev.result.vocalUrl);
        URL.revokeObjectURL(prev.result.instrumentalUrl);
      }
      return prev;
    });
  }, []);

  const processAudio = useCallback(async (file: File) => {
    cleanupPreviousResult();

    setState({
      isProcessing: true,
      progress: 0,
      message: 'Membaca file audio...',
      error: null,
      result: null,
    });

    try {
      const arrayBuffer = await file.arrayBuffer();

      setState(s => ({ ...s, progress: 5, message: 'Mendekode audio...' }));

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext();
      }
      const audioCtx = audioContextRef.current;

      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));

      setState(s => ({ ...s, progress: 10, message: 'Mempersiapkan data channel...' }));

      const channels: Float32Array[] = [];
      for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
        channels.push(audioBuffer.getChannelData(ch));
      }

      await new Promise<void>((resolve, reject) => {
        if (workerRef.current) {
          workerRef.current.terminate();
        }

        const workerUrl = getWorkerUrl();
        const worker = new Worker(workerUrl);
        workerRef.current = worker;

        worker.onmessage = (e) => {
          const data = e.data;

          if (data.type === 'progress') {
            setState(s => ({
              ...s,
              progress: data.value,
              message: data.message,
            }));
          } else if (data.type === 'complete') {
            setState(s => ({ ...s, progress: 97, message: 'Mengenkode file WAV...' }));

            const vocalBlob = encodeWAV(
              data.vocalData.left,
              data.vocalData.right,
              data.vocalData.sampleRate
            );
            const instrumentalBlob = encodeWAV(
              data.instrumentalData.left,
              data.instrumentalData.right,
              data.instrumentalData.sampleRate
            );

            const vocalUrl = URL.createObjectURL(vocalBlob);
            const instrumentalUrl = URL.createObjectURL(instrumentalBlob);
            const baseName = file.name.replace(/\.[^/.]+$/, '');

            setState({
              isProcessing: false,
              progress: 100,
              message: 'Selesai!',
              error: null,
              result: {
                vocalBlob,
                instrumentalBlob,
                vocalUrl,
                instrumentalUrl,
                originalName: baseName,
              },
            });

            worker.terminate();
            resolve();
          } else if (data.type === 'error') {
            reject(new Error(data.message));
          }
        };

        worker.onerror = (e) => {
          reject(new Error(e.message || 'Worker gagal memuat'));
        };

        // Copy channels to transfer
        const channelsCopy = channels.map(ch => {
          const copy = new Float32Array(ch.length);
          copy.set(ch);
          return copy;
        });

        worker.postMessage(
          {
            audioData: null,
            sampleRate: audioBuffer.sampleRate,
            channels: channelsCopy,
          },
          channelsCopy.map(ch => ch.buffer)
        );
      });

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak diketahui';
      setState(s => ({
        ...s,
        isProcessing: false,
        progress: 0,
        message: '',
        error: errorMsg,
      }));
    }
  }, [cleanupPreviousResult]);

  const reset = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setState({
      isProcessing: false,
      progress: 0,
      message: '',
      error: null,
      result: null,
    });
  }, []);

  return { state, processAudio, reset };
}
