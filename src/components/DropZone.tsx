'use client';

import { useCallback, useState } from 'react';
import { Upload, Music, AlertCircle } from 'lucide-react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'];
const MAX_SIZE_MB = 100;

export function DropZone({ onFileSelect, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState('');

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(mp3|wav|flac|aac|ogg|m4a)$/i)) {
      return 'Format tidak didukung. Gunakan MP3, WAV, FLAC, AAC, OGG, atau M4A.';
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File terlalu besar. Maksimal ${MAX_SIZE_MB}MB.`;
    }
    return null;
  };

  const handleFile = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setDragError(error);
      setTimeout(() => setDragError(''), 4000);
      return;
    }
    setDragError('');
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <div className="w-full">
      <label
        className={`
          relative flex flex-col items-center justify-center gap-4 
          w-full min-h-[220px] rounded-2xl cursor-pointer
          border-2 border-dashed transition-all duration-300
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isDragging
            ? 'border-violet-400 bg-violet-500/10 scale-[1.01]'
            : 'border-slate-600/60 bg-slate-900/40 hover:border-violet-500/60 hover:bg-slate-800/40'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Glow effect when dragging */}
        {isDragging && (
          <div className="absolute inset-0 rounded-2xl bg-violet-500/5 blur-xl pointer-events-none" />
        )}

        {/* Animated music icon */}
        <div className={`relative transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`}>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 flex items-center justify-center">
            <Music size={28} className="text-violet-400" />
          </div>
          {/* Pulse ring */}
          <div className={`absolute inset-0 rounded-2xl border-2 border-violet-400/30 ${isDragging ? 'animate-ping' : 'hidden'}`} />
        </div>

        <div className="text-center px-4">
          <p className="text-white font-semibold text-base mb-1">
            {isDragging ? 'Lepaskan file di sini' : 'Drop file audio atau klik untuk browse'}
          </p>
          <p className="text-slate-400 text-sm">
            MP3, WAV, FLAC, AAC, OGG, M4A • Maks {MAX_SIZE_MB}MB
          </p>
        </div>

        <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 text-sm font-medium hover:bg-violet-600/30 transition-colors">
          <Upload size={15} />
          Pilih File Audio
        </div>

        {!disabled && (
          <input
            type="file"
            accept=".mp3,.wav,.flac,.aac,.ogg,.m4a,audio/*"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleInputChange}
          />
        )}
      </label>

      {dragError && (
        <div className="mt-3 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="flex-shrink-0" />
          {dragError}
        </div>
      )}
    </div>
  );
}
