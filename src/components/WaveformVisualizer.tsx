'use client';

import { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  audioUrl: string;
  color?: string;
  height?: number;
}

export function WaveformVisualizer({ audioUrl, color = '#818cf8', height = 60 }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!audioUrl || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawWaveform = async () => {
      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        
        const data = audioBuffer.getChannelData(0);
        const step = Math.ceil(data.length / canvas.width);
        const amp = canvas.height / 2;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Waveform
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 4;
        ctx.shadowColor = color;
        
        for (let i = 0; i < canvas.width; i++) {
          let min = 1.0;
          let max = -1.0;
          
          for (let j = 0; j < step; j++) {
            const datum = data[i * step + j];
            if (datum !== undefined) {
              if (datum < min) min = datum;
              if (datum > max) max = datum;
            }
          }
          
          ctx.moveTo(i, (1 + min) * amp);
          ctx.lineTo(i, (1 + max) * amp);
        }
        
        ctx.stroke();
        audioCtx.close();
      } catch {
        // Fallback: draw placeholder
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    drawWaveform();
  }, [audioUrl, color]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={height}
      className="w-full rounded-lg"
      style={{ height: `${height}px` }}
    />
  );
}
