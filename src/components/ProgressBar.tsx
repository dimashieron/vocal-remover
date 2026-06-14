'use client';

import { useEffect, useState } from 'react';

interface ProgressBarProps {
  progress: number;
  message: string;
}

const STAGES = [
  { threshold: 0,  label: 'Inisialisasi', icon: '⚙️' },
  { threshold: 10, label: 'Dekode Audio', icon: '🔊' },
  { threshold: 30, label: 'Analisis Spektral', icon: '📊' },
  { threshold: 55, label: 'Pemisahan Vokal', icon: '🎤' },
  { threshold: 75, label: 'Pemrosesan Instrumental', icon: '🎸' },
  { threshold: 90, label: 'Enkode Output', icon: '💾' },
  { threshold: 99, label: 'Selesai!', icon: '✨' },
];

export function ProgressBar({ progress, message }: ProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  
  const currentStage = STAGES.filter(s => progress >= s.threshold).slice(-1)[0] || STAGES[0];

  useEffect(() => {
    // Smooth progress animation
    const target = progress;
    const step = () => {
      setDisplayProgress(prev => {
        const diff = target - prev;
        if (Math.abs(diff) < 0.5) return target;
        return prev + diff * 0.1;
      });
    };
    const id = setInterval(step, 16);
    return () => clearInterval(id);
  }, [progress]);

  return (
    <div className="w-full space-y-4">
      {/* Stage indicator */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">{currentStage.icon}</span>
          <span className="text-white font-medium">{currentStage.label}</span>
        </div>
        <span className="text-violet-400 font-mono font-bold text-base">
          {Math.round(displayProgress)}%
        </span>
      </div>

      {/* Progress track */}
      <div className="relative">
        <div className="w-full h-3 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
          {/* Animated background shimmer */}
          <div
            className="h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden"
            style={{
              width: `${displayProgress}%`,
              background: 'linear-gradient(90deg, #7c3aed, #6366f1, #4f46e5)',
            }}
          >
            {/* Shimmer effect */}
            <div
              className="absolute inset-0 opacity-60"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                animation: 'shimmer 1.5s infinite',
                backgroundSize: '200% 100%',
              }}
            />
          </div>
        </div>
      </div>

      {/* Message */}
      <p className="text-slate-400 text-sm text-center">{message}</p>

      {/* Processing stages dots */}
      <div className="flex items-center justify-center gap-2">
        {STAGES.slice(0, 6).map((stage, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              progress >= stage.threshold
                ? 'bg-violet-400 scale-125'
                : 'bg-slate-600'
            }`}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
}
