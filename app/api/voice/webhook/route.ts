/**
 * @fileoverview Voice Webhook API
 *
 * POST /api/voice/webhook
 * Recebe webhook post-call do ElevenLabs.
 * Verifica HMAC, processa transcript, e roda pipeline AI.
 *
 * Retorna 200 mesmo em erros de processamento (evita retry storms).
 *
 * @module app/api/voice/webhook/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createStaticAdminClient } from '@/lib/supabase/server';
import {
  verifyElevenLabsWebhook,
  processPostCallWebhook,
} from '@/lib/voice/webhook-handler';
import type { ElevenLabsWebhookPayload } from '@/lib/voice/elevenlabs.types';

export async function POST(request: NextRequest) {
  try {
    // Read raw body for HMAC verification
    const rawBody = await request.text();

    // Verify HMAC signature
    const signatureHeader = request.headers.get('elevenlabs-signature');
    if (!signatureHeader) {
      console.warn('[Voice Webhook] Missing signature header');
      return NextResponse.json({ status: 'rejected', reason: 'missing signature' }, { status: 401 });
    }

    if (!verifyElevenLabsWebhook(signatureHeader, rawBody)) {
      console.warn('[Voice Webhook] Invalid signature');
      return NextResponse.json({ status: 'rejected', reason: 'invalid signature' }, { status: 401 });
    }

    // Parse payload
    const payload: ElevenLabsWebhookPayload = JSON.parse(rawBody);

    // Only process post_call_transcription events
    if (payload.type !== 'post_call_transcription') {
      console.log(`[Voice Webhook] Ignoring event type: ${payload.type}`);
      return NextResponse.json({ status: 'ignored' });
    }

    // Use admin client (no user session in webhook context)
    const supabase = createStaticAdminClient();

    // Process asynchronously — return 200 immediately
    const result = await processPostCallWebhook(supabase, payload);

    if (!result.success) {
      console.error('[Voice Webhook] Processing error:', result.error);
    }

    // Always return 200 to prevent retry storms
    return NextResponse.json({ status: 'received', callId: result.callId });
  } catch (error) {
    console.error('[Voice Webhook] Unexpected error:', error);
    // Still return 200 to prevent retry storms
    return NextResponse.json({ status: 'error' });
  }
}
