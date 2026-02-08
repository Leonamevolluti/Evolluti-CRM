'use client';

/**
 * @fileoverview Voice Call Button
 *
 * Botão "IA Voice" para o DealCockpit.
 * Abre o VoiceCallWidget quando clicado.
 *
 * @module features/voice/components/VoiceCallButton
 */

import React, { useState } from 'react';
import { Mic } from 'lucide-react';
import { VoiceCallWidget } from './VoiceCallWidget';
import { useStartVoiceCallMutation, useVoiceConfigQuery } from '@/lib/query/hooks';

// =============================================================================
// Types
// =============================================================================

interface VoiceCallButtonProps {
  dealId: string;
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function VoiceCallButton({ dealId, className }: VoiceCallButtonProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const { data: voiceConfig } = useVoiceConfigQuery();
  const startCall = useStartVoiceCallMutation();

  const isEnabled = voiceConfig?.voice_enabled && voiceConfig.elevenlabs_agent_id;

  const handleClick = async () => {
    if (!isEnabled || startCall.isPending) return;

    try {
      await startCall.mutateAsync({ dealId });
      setIsCallActive(true);
    } catch (error) {
      console.error('[VoiceCallButton] Error:', error);
    }
  };

  const handleCallEnd = () => {
    setIsCallActive(false);
    startCall.reset();
  };

  // Show widget if call is active
  if (isCallActive && startCall.data) {
    return (
      <div className="w-full">
        <VoiceCallWidget
          signedUrl={startCall.data.signedUrl}
          dynamicVariables={startCall.data.dynamicVariables}
          callId={startCall.data.callId}
          onCallEnd={handleCallEnd}
          onError={(err) => {
            console.error('[VoiceCallButton] Call error:', err);
            handleCallEnd();
          }}
        />
      </div>
    );
  }

  // Button (not shown if voice not enabled)
  if (!isEnabled) return null;

  return (
    <button
      type="button"
      className={className}
      title="Chamada IA (voice agent)"
      aria-label="IA Voice"
      onClick={handleClick}
      disabled={startCall.isPending}
    >
      {startCall.isPending ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-transparent" />
      ) : (
        <Mic className="h-4 w-4 text-slate-200" />
      )}
      <span className="text-[10px] font-semibold text-slate-300">IA Voice</span>
    </button>
  );
}
