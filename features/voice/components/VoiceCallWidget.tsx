'use client';

/**
 * @fileoverview Voice Call Widget
 *
 * UI para chamada de voz com AI agent (ElevenLabs).
 * Exibe waveform, timer, controles de mute e encerrar.
 *
 * @module features/voice/components/VoiceCallWidget
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Mic, MicOff, PhoneOff, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DynamicVariables } from '@/lib/voice/elevenlabs.types';

// =============================================================================
// Types
// =============================================================================

export interface VoiceCallWidgetProps {
  signedUrl: string;
  dynamicVariables: DynamicVariables;
  callId: string;
  onCallEnd?: () => void;
  onError?: (error: string) => void;
}

type CallStatus = 'idle' | 'connecting' | 'connected' | 'ended' | 'error';

// =============================================================================
// Timer Hook
// =============================================================================

function useCallTimer(isRunning: boolean) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const formatted = `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  return { seconds, formatted };
}

// =============================================================================
// Component
// =============================================================================

export function VoiceCallWidget({
  signedUrl,
  dynamicVariables,
  callId,
  onCallEnd,
  onError,
}: VoiceCallWidgetProps) {
  const [status, setStatus] = useState<CallStatus>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const hasStarted = useRef(false);

  const conversation = useConversation({
    onConnect: () => {
      console.log('[VoiceCall] Connected');
      setStatus('connected');
    },
    onDisconnect: () => {
      console.log('[VoiceCall] Disconnected');
      setStatus('ended');
      onCallEnd?.();
    },
    onError: (message: string) => {
      console.error('[VoiceCall] Error:', message);
      setStatus('error');
      onError?.(message || 'Erro na chamada');
    },
  });

  const { formatted: timerText } = useCallTimer(status === 'connected');

  // Start session on mount
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    async function start() {
      setStatus('connecting');
      try {
        await conversation.startSession({
          signedUrl,
          connectionType: 'websocket',
          dynamicVariables,
        });
      } catch (error) {
        console.error('[VoiceCall] Failed to start:', error);
        setStatus('error');
        onError?.(error instanceof Error ? error.message : 'Falha ao conectar');
      }
    }

    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEndCall = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch {
      // Session might already be ended
    }
    setStatus('ended');
    onCallEnd?.();
  }, [conversation, onCallEnd]);

  const handleToggleMute = useCallback(() => {
    if (isMuted) {
      conversation.setVolume({ volume: 1 });
    } else {
      conversation.setVolume({ volume: 0 });
    }
    setIsMuted(!isMuted);
  }, [conversation, isMuted]);

  // Pulse animation classes based on speaking state
  const isSpeaking = conversation.isSpeaking;

  if (status === 'ended') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/80 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700">
          <PhoneOff className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-300">Chamada encerrada</p>
        <p className="text-xs text-slate-500">
          O transcript estará disponível em alguns instantes.
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-500/20 bg-red-950/20 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-900/50">
          <PhoneOff className="h-6 w-6 text-red-400" />
        </div>
        <p className="text-sm font-medium text-red-300">Erro na chamada</p>
        <button
          type="button"
          onClick={onCallEnd}
          className="mt-1 text-xs text-slate-400 underline hover:text-slate-300"
        >
          Fechar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/80 p-6">
      {/* Waveform indicator */}
      <div className="relative flex h-16 w-16 items-center justify-center">
        {/* Pulse rings when speaking */}
        {isSpeaking && (
          <>
            <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
            <div
              className="absolute inset-[-4px] animate-pulse rounded-full bg-emerald-500/10"
              style={{ animationDelay: '0.2s' }}
            />
          </>
        )}
        <div
          className={cn(
            'relative z-10 flex h-16 w-16 items-center justify-center rounded-full transition-colors',
            status === 'connecting' && 'bg-amber-900/50',
            status === 'connected' && !isSpeaking && 'bg-emerald-900/50',
            status === 'connected' && isSpeaking && 'bg-emerald-700/50'
          )}
        >
          {status === 'connecting' ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          ) : (
            <Volume2
              className={cn(
                'h-7 w-7 transition-colors',
                isSpeaking ? 'text-emerald-300' : 'text-emerald-500'
              )}
            />
          )}
        </div>
      </div>

      {/* Status text */}
      <div className="text-center">
        <p className="text-sm font-medium text-slate-200">
          {status === 'connecting'
            ? 'Conectando...'
            : isSpeaking
              ? 'IA falando...'
              : 'Ouvindo...'}
        </p>
        {status === 'connected' && (
          <p className="mt-0.5 font-mono text-lg font-semibold text-slate-100">
            {timerText}
          </p>
        )}
      </div>

      {/* Controls */}
      {status === 'connected' && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleMute}
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-full transition-colors',
              isMuted
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-white/10 hover:bg-white/20'
            )}
            title={isMuted ? 'Desmutado' : 'Mutar'}
          >
            {isMuted ? (
              <MicOff className="h-5 w-5 text-white" />
            ) : (
              <Mic className="h-5 w-5 text-white" />
            )}
          </button>

          <button
            type="button"
            onClick={handleEndCall}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 transition-colors hover:bg-red-500"
            title="Encerrar chamada"
          >
            <PhoneOff className="h-5 w-5 text-white" />
          </button>
        </div>
      )}

      {/* Contact info */}
      <p className="text-xs text-slate-500">
        {dynamicVariables.contact_name} - {dynamicVariables.company_name}
      </p>
    </div>
  );
}
