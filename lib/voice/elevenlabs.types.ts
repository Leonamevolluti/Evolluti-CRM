/**
 * @fileoverview ElevenLabs Voice Types
 *
 * Types para integração com ElevenLabs Conversational AI.
 *
 * @module lib/voice/elevenlabs.types
 */

// =============================================================================
// Voice Call Record (DB)
// =============================================================================

export interface VoiceCallRecord {
  id: string;
  organization_id: string;
  deal_id: string | null;
  conversation_id: string | null;
  contact_id: string | null;
  elevenlabs_conversation_id: string | null;
  livekit_room_name: string | null;
  mode: 'ai_agent' | 'human_call';
  status: 'in_progress' | 'completed' | 'failed' | 'no_answer';
  initiated_by: string | null;
  channel: 'web' | 'whatsapp' | 'phone';
  direction: 'inbound' | 'outbound';
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  transcript: TranscriptEntry[] | null;
  analysis: CallAnalysis | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TranscriptEntry {
  role: 'agent' | 'user';
  message: string;
  time_in_call_secs: number;
}

export interface CallAnalysis {
  call_successful: string;
  transcript_summary: string;
  evaluation_criteria_results?: Record<string, unknown>;
  data_collection_results?: Record<string, unknown>;
}

// =============================================================================
// ElevenLabs Webhook Payload
// =============================================================================

export interface ElevenLabsWebhookPayload {
  type: 'post_call_transcription';
  event_timestamp: number;
  data: {
    agent_id: string;
    conversation_id: string;
    status: string;
    transcript: ElevenLabsTranscriptTurn[];
    metadata: {
      start_time_unix_secs: number;
      call_duration_secs: number;
      cost: number;
      termination_reason: string;
      feedback: {
        overall_score: number | null;
        likes: number;
        dislikes: number;
      };
      deletion_settings?: Record<string, unknown>;
      authorization_method?: string;
      charging?: Record<string, unknown>;
    };
    analysis: {
      evaluation_criteria_results: Record<string, unknown>;
      data_collection_results: Record<string, unknown>;
      call_successful: string;
      transcript_summary: string;
    };
    conversation_initiation_client_data?: {
      conversation_config_override?: Record<string, unknown>;
      custom_llm_extra_body?: Record<string, unknown>;
      dynamic_variables?: Record<string, string>;
    };
  };
}

export interface ElevenLabsTranscriptTurn {
  role: 'agent' | 'user';
  message: string;
  tool_calls: unknown | null;
  tool_results: unknown | null;
  feedback: unknown | null;
  time_in_call_secs: number;
  conversation_turn_metrics: Record<string, unknown> | null;
}

// =============================================================================
// ElevenLabs API Types
// =============================================================================

export interface CreateAgentParams {
  name: string;
  systemPrompt: string;
  firstMessage: string;
  language?: string;
  voiceId?: string;
}

export interface SignedUrlResponse {
  signedUrl: string;
  conversationId?: string;
}

export interface DynamicVariables {
  contact_name: string;
  company_name: string;
  deal_stage: string;
  stage_goal: string;
  organization_name: string;
  deal_value: string;
  recent_messages: string;
  [key: string]: string;
}

// =============================================================================
// API Request/Response Types
// =============================================================================

export interface StartVoiceCallRequest {
  dealId: string;
  mode?: 'ai_agent' | 'human_call';
  channel?: 'web' | 'whatsapp' | 'phone';
}

export interface StartVoiceCallResponse {
  callId: string;
  signedUrl: string;
  dynamicVariables: DynamicVariables;
  elevenlabsConversationId?: string;
}

export interface VoiceCallListItem {
  id: string;
  mode: VoiceCallRecord['mode'];
  status: VoiceCallRecord['status'];
  channel: VoiceCallRecord['channel'];
  direction: VoiceCallRecord['direction'];
  duration_seconds: number | null;
  started_at: string;
  ended_at: string | null;
  analysis: CallAnalysis | null;
  contact: {
    id: string;
    name: string;
  } | null;
}
