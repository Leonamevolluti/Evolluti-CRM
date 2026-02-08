/**
 * @fileoverview Voice Enable API
 *
 * POST /api/voice/enable
 * Cria agent ElevenLabs para a organização e habilita voice.
 * Apenas admins podem habilitar.
 *
 * @module app/api/voice/enable/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createOrgAgent,
  DEFAULT_AGENT_SYSTEM_PROMPT,
  DEFAULT_FIRST_MESSAGE,
} from '@/lib/voice/elevenlabs.service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse body to get API key
    const body = await request.json().catch(() => ({}));
    const { apiKey } = body as { apiKey?: string };

    if (!apiKey) {
      return NextResponse.json(
        { error: 'apiKey is required' },
        { status: 400 }
      );
    }

    // Check if already enabled
    const { data: orgSettings } = await supabase
      .from('organization_settings')
      .select('voice_enabled, elevenlabs_agent_id, elevenlabs_api_key')
      .eq('organization_id', profile.organization_id)
      .single();

    if (orgSettings?.voice_enabled && orgSettings.elevenlabs_agent_id) {
      // Update API key if changed
      if (orgSettings.elevenlabs_api_key !== apiKey) {
        await supabase
          .from('organization_settings')
          .update({ elevenlabs_api_key: apiKey })
          .eq('organization_id', profile.organization_id);
      }
      return NextResponse.json({
        message: 'Voice already enabled',
        agentId: orgSettings.elevenlabs_agent_id,
      });
    }

    // Get org name for the agent
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', profile.organization_id)
      .single();

    const orgName = org?.name || 'Empresa';

    // Create ElevenLabs agent
    const agentId = await createOrgAgent(apiKey, {
      name: `${orgName} - Sales Agent`,
      systemPrompt: DEFAULT_AGENT_SYSTEM_PROMPT,
      firstMessage: DEFAULT_FIRST_MESSAGE,
      language: 'pt',
    });

    // Save agent ID, API key, and enable voice
    const { error: updateError } = await supabase
      .from('organization_settings')
      .update({
        voice_enabled: true,
        elevenlabs_agent_id: agentId,
        elevenlabs_api_key: apiKey,
      })
      .eq('organization_id', profile.organization_id);

    if (updateError) {
      console.error('[Voice Enable] Failed to update settings:', updateError);
      return NextResponse.json(
        { error: 'Failed to save settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Voice enabled successfully',
      agentId,
    });
  } catch (error) {
    console.error('[Voice Enable] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to enable voice' },
      { status: 500 }
    );
  }
}
