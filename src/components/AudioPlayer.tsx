'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Download } from 'lucide-react';
import { WaveformVisualizer } from './WaveformVisualizer';
import { downloadBlob } from '@/lib/wavEncoder';

interface AudioPlayerProps {
  audioUrl: string;
  audioBlob: Blob;
  title: string;
  filename: string;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
  icon: React.ReactNode;
}

export function AudioPlayer({
  audioUrl,
  audioBlob,
  title,
  filename,
  accentColor,
  gradientFrom,
  gradientTo,
  icon,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const vol = parseFloat(e.target.value);
    audio.volume = vol;
    setVolume(vol);
  };

  const handleDownload = () => {
    downloadBlob(audioBlob, filename);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-sm p-5">
      {/* Gradient accent strip */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})` }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${gradientFrom}33, ${gradientTo}33)`, border: `1px solid ${gradientFrom}44` }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm truncate">{title}</h3>
          <p className="text-slate-400 text-xs truncate">{filename}</p>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:scale-105 active:scale-95"
          style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
        >
          <Download size={13} />
          Download
        </button>
      </div>

      {/* Waveform */}
      <div className="mb-3 rounded-lg overflow-hidden">
        <WaveformVisualizer audioUrl={audioUrl} color={accentColor} height={56} />
      </div>

      {/* Controls */}
      <div className="space-y-2">
        {/* Seek bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 w-9 text-right">{formatTime(currentTime)}</span>
          <div className="flex-1 relative group">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.01}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-700"
              style={{
                background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(currentTime / (duration || 1)) * 100}%, #334155 ${(currentTime / (duration || 1)) * 100}%, #334155 100%)`
              }}
            />
          </div>
          <span className="text-xs text-slate-500 w-9">{formatTime(duration)}</span>
        </div>

        {/* Play & Volume */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110 active:scale-95 flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
          >
            {isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" />}
          </button>
          
          <Volume2 size={14} className="text-slate-500 flex-shrink-0" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={handleVolume}
            className="w-20 h-1 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${volume * 100}%, #334155 ${volume * 100}%, #334155 100%)`
            }}
          />
        </div>
      </div>

      <audio ref={audioRef} src={audioUrl} preload="metadata" />
    </div>
  );
}
