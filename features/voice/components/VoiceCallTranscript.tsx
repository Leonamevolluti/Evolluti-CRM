'use client';

/**
 * @fileoverview Voice Call Transcript
 *
 * Exibe transcript de uma chamada de voz completa.
 * Usado no deal cockpit para visualizar chamadas passadas.
 *
 * @module features/voice/components/VoiceCallTranscript
 */

import React from 'react';
import { Mic, Phone, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TranscriptEntry, CallAnalysis } from '@/lib/voice/elevenlabs.types';

// =============================================================================
// Types
// =============================================================================

interface VoiceCallTranscriptProps {
  transcript: TranscriptEntry[];
  analysis?: CallAnalysis | null;
  durationSeconds?: number | null;
  mode: 'ai_agent' | 'human_call';
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function VoiceCallTranscript({
  transcript,
  analysis,
  durationSeconds,
  mode,
  className,
}: VoiceCallTranscriptProps) {
  if (!transcript || transcript.length === 0) {
    return (
      <div className={cn('rounded-xl border border-white/5 bg-white/2 p-4', className)}>
        <p className="text-xs text-slate-500">Transcript não disponível</p>
      </div>
    );
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('rounded-xl border border-white/5 bg-white/2', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5">
        {mode === 'ai_agent' ? (
          <Mic className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <Phone className="h-3.5 w-3.5 text-blue-400" />
        )}
        <span className="text-xs font-medium text-slate-300">
          {mode === 'ai_agent' ? 'Chamada IA' : 'Chamada'}
        </span>
        {durationSeconds != null && (
          <span className="ml-auto flex items-center gap-1 text-xs text-slate-500">
            <Clock className="h-3 w-3" />
            {formatTime(durationSeconds)}
          </span>
        )}
      </div>

      {/* Summary */}
      {analysis?.transcript_summary && (
        <div className="border-b border-white/5 px-4 py-2.5">
          <p className="text-xs leading-relaxed text-slate-400">
            {analysis.transcript_summary}
          </p>
        </div>
      )}

      {/* Transcript lines */}
      <div className="max-h-64 space-y-2 overflow-y-auto px-4 py-3">
        {transcript.map((entry, i) => (
          <div key={i} className="flex gap-2">
            <span
              className={cn(
                'mt-0.5 shrink-0 text-[10px] font-semibold',
                entry.role === 'agent' ? 'text-emerald-400' : 'text-blue-400'
              )}
            >
              {entry.role === 'agent'
                ? mode === 'ai_agent'
                  ? 'IA'
                  : 'Vendedor'
                : 'Lead'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs leading-relaxed text-slate-300">{entry.message}</p>
              <span className="text-[10px] text-slate-600">
                {formatTime(entry.time_in_call_secs)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
