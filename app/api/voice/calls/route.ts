/**
 * @fileoverview Voice Calls API
 *
 * GET /api/voice/calls?dealId=X — Lista chamadas de um deal
 * POST /api/voice/calls — Cria registro de nova chamada
 *
 * @module app/api/voice/calls/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const dealId = request.nextUrl.searchParams.get('dealId');

  if (!dealId) {
    return NextResponse.json({ error: 'dealId is required' }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { data: calls, error } = await supabase
      .from('voice_calls')
      .select(`
        id,
        mode,
        status,
        channel,
        direction,
        duration_seconds,
        started_at,
        ended_at,
        analysis,
        contact:contacts(id, name)
      `)
      .eq('deal_id', dealId)
      .eq('organization_id', profile.organization_id)
      .order('started_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[Voice Calls] List error:', error);
      return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 });
    }

    return NextResponse.json({ calls: calls || [] });
  } catch (error) {
    console.error('[Voice Calls] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { dealId, mode = 'ai_agent', channel = 'web', elevenlabsConversationId } = body;

    if (!dealId) {
      return NextResponse.json({ error: 'dealId is required' }, { status: 400 });
    }

    // Verify deal exists and belongs to org
    const { data: deal } = await supabase
      .from('deals')
      .select('id, contact_id')
      .eq('id', dealId)
      .single();

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Find conversation for this deal
    const { data: conversations } = await supabase
      .from('messaging_conversations')
      .select('id')
      .contains('metadata', { deal_id: dealId })
      .limit(1);

    const conversationId = conversations?.[0]?.id || null;

    // Create voice call record
    const { data: voiceCall, error: insertError } = await supabase
      .from('voice_calls')
      .insert({
        organization_id: profile.organization_id,
        deal_id: dealId,
        conversation_id: conversationId,
        contact_id: deal.contact_id,
        mode,
        channel,
        direction: 'outbound',
        initiated_by: user.id,
        elevenlabs_conversation_id: elevenlabsConversationId || null,
      })
      .select('id')
      .single();

    if (insertError || !voiceCall) {
      console.error('[Voice Calls] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create call' }, { status: 500 });
    }

    return NextResponse.json({ callId: voiceCall.id }, { status: 201 });
  } catch (error) {
    console.error('[Voice Calls] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
