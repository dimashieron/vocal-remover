'use client';

import { useState } from 'react';
import { Mic2, Music2, Zap, GitBranch, Info, X } from 'lucide-react';
import { DropZone } from '@/components/DropZone';
import { ProgressBar } from '@/components/ProgressBar';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useAudioProcessor } from '@/lib/useAudioProcessor';

export default function Home() {
  const { state, processAudio, reset } = useAudioProcessor();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    processAudio(file);
  };

  const handleReset = () => {
    reset();
    setSelectedFile(null);
  };

  return (
    <div className="min-h-screen bg-[#050812] text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full bg-violet-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] rounded-full bg-indigo-900/15 blur-[100px]" />
        <div className="absolute top-[40%] left-[-5%] w-[300px] h-[300px] rounded-full bg-purple-900/10 blur-[80px]" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Mic2 size={16} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">VocalSplit</span>
              <span className="ml-2 text-xs text-slate-500 hidden sm:inline">AI Vocal Remover</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              100% Browser-Based
            </div>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Info size={16} />
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <GitBranch size={16} />
            </a>
          </div>
        </div>
      </header>

      {/* Info panel */}
      {showInfo && (
        <div className="relative z-20 bg-indigo-950/90 border-b border-indigo-500/20 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="grid sm:grid-cols-3 gap-4 flex-1">
                {[
                  { icon: '🔒', title: 'Privasi Total', desc: 'Audio tidak pernah meninggalkan browser kamu. Zero upload ke server.' },
                  { icon: '⚡', title: 'FFT Processing', desc: 'Pemisahan berbasis Fast Fourier Transform langsung di WebAssembly.' },
                  { icon: '🆓', title: 'Gratis Selamanya', desc: 'Deploy ke GitHub Pages, tidak ada biaya hosting sama sekali.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-xl flex-shrink-0">{item.icon}</span>
                    <div>
                      <p className="text-white text-sm font-medium">{item.title}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowInfo(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Hero section */}
        {!state.isProcessing && !state.result && !state.error && (
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-xs text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-6">
              <Zap size={12} />
              Tidak perlu install apapun — langsung jalan di browser
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              Pisahkan{' '}
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Vokal
              </span>
              {' '}dari{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Instrumental
              </span>
            </h1>
            <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
              Upload lagu, dan dapatkan track vokal + instrumental secara terpisah.
              Semua diproses langsung di browser — tidak ada server, tidak ada biaya.
            </p>
          </div>
        )}

        {/* Main card */}
        <div className="bg-slate-900/40 backdrop-blur-sm border border-white/8 rounded-3xl p-6 sm:p-8 shadow-2xl">
          
          {/* Error state */}
          {state.error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-400 text-sm">✕</span>
                </div>
                <div className="flex-1">
                  <p className="text-red-400 font-medium text-sm">Gagal memproses audio</p>
                  <p className="text-red-400/70 text-xs mt-1">{state.error}</p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="mt-4 w-full py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm font-medium transition-colors border border-red-500/20"
              >
                Coba lagi
              </button>
            </div>
          )}

          {/* Drop zone - show when idle */}
          {!state.isProcessing && !state.result && (
            <DropZone onFileSelect={handleFileSelect} disabled={state.isProcessing} />
          )}

          {/* Processing state */}
          {state.isProcessing && (
            <div className="py-8 px-4">
              {/* File info */}
              {selectedFile && (
                <div className="flex items-center gap-3 mb-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <Music2 size={18} className="text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-slate-400 text-xs">
                      {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-violet-400 rounded-full animate-pulse"
                        style={{
                          height: `${12 + i * 6}px`,
                          animationDelay: `${i * 0.2}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <ProgressBar progress={state.progress} message={state.message} />
            </div>
          )}

          {/* Results */}
          {state.result && !state.isProcessing && (
            <div className="space-y-5">
              {/* Success banner */}
              <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <span>✨</span>
                </div>
                <div className="flex-1">
                  <p className="text-emerald-400 font-medium text-sm">Pemisahan berhasil!</p>
                  <p className="text-emerald-400/70 text-xs mt-0.5">
                    {selectedFile?.name} → 2 track terpisah
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors border border-white/10"
                >
                  Upload lagi
                </button>
              </div>

              {/* Audio players grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Vocal track */}
                <AudioPlayer
                  audioUrl={state.result.vocalUrl}
                  audioBlob={state.result.vocalBlob}
                  title="Track Vokal"
                  filename={`${state.result.originalName}_vocal.wav`}
                  accentColor="#c084fc"
                  gradientFrom="#9333ea"
                  gradientTo="#7c3aed"
                  icon={<Mic2 size={18} className="text-purple-400" />}
                />

                {/* Instrumental track */}
                <AudioPlayer
                  audioUrl={state.result.instrumentalUrl}
                  audioBlob={state.result.instrumentalBlob}
                  title="Track Instrumental"
                  filename={`${state.result.originalName}_instrumental.wav`}
                  accentColor="#67e8f9"
                  gradientFrom="#0284c7"
                  gradientTo="#0891b2"
                  icon={<Music2 size={18} className="text-cyan-400" />}
                />
              </div>

              {/* Tips */}
              <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                <p className="text-amber-300/80 text-xs">
                  💡 <strong>Tips:</strong> Kualitas pemisahan tergantung pada mixing lagu aslinya. 
                  Lagu dengan vokal di center stereo menghasilkan hasil terbaik. 
                  Format WAV 16-bit stereo, sample rate sama seperti file asli.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Features grid */}
        {!state.isProcessing && !state.result && (
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: '🎤', label: 'Vokal Separation', desc: 'Isolasi track vokal' },
              { icon: '🎸', label: 'Instrumental', desc: 'Background music bersih' },
              { icon: '📥', label: 'Download WAV', desc: 'Kualitas lossless 16-bit' },
              { icon: '🔒', label: 'Zero Upload', desc: 'Privasi terjamin 100%' },
            ].map((feat, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-slate-900/40 border border-white/6 hover:border-violet-500/20 transition-colors"
              >
                <span className="text-2xl">{feat.icon}</span>
                <p className="text-white text-xs font-semibold mt-2">{feat.label}</p>
                <p className="text-slate-500 text-xs mt-0.5">{feat.desc}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 mt-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-600 text-xs text-center sm:text-left">
            VocalSplit — Open source, gratis selamanya, tidak ada server
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span>FFT-based Processing</span>
            <span>•</span>
            <span>Web Audio API</span>
            <span>•</span>
            <span>Web Workers</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
