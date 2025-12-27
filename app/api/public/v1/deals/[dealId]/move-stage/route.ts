import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authPublicApi } from '@/lib/public-api/auth';
import { createStaticAdminClient } from '@/lib/supabase/server';
import { isValidUUID, sanitizeUUID } from '@/lib/supabase/utils';

export const runtime = 'nodejs';

const MoveStageSchema = z.object({
  to_stage_id: z.string().uuid().optional(),
  to_stage_label: z.string().min(1).optional(),
}).strict().refine((v) => !!(v.to_stage_id || v.to_stage_label), {
  message: 'to_stage_id or to_stage_label is required',
});

export async function POST(request: Request, ctx: { params: Promise<{ dealId: string }> }) {
  const auth = await authPublicApi(request);
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });

  const { dealId } = await ctx.params;
  if (!isValidUUID(dealId)) {
    return NextResponse.json({ error: 'Invalid deal id', code: 'VALIDATION_ERROR' }, { status: 422 });
  }

  const body = await request.json().catch(() => null);
  const parsed = MoveStageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', code: 'VALIDATION_ERROR' }, { status: 422 });
  }

  const toStageIdFromBody = parsed.data.to_stage_id ? sanitizeUUID(parsed.data.to_stage_id) : null;
  const toStageLabel = (parsed.data.to_stage_label || '').trim();
  const sb = createStaticAdminClient();

  // Load deal to ensure org isolation and get board_id
  const { data: deal, error: dealError } = await sb
    .from('deals')
    .select('id,board_id,stage_id')
    .eq('organization_id', auth.organizationId)
    .is('deleted_at', null)
    .eq('id', dealId)
    .maybeSingle();
  if (dealError) return NextResponse.json({ error: dealError.message, code: 'DB_ERROR' }, { status: 500 });
  if (!deal) return NextResponse.json({ error: 'Deal not found', code: 'NOT_FOUND' }, { status: 404 });

  const boardId = (deal as any).board_id as string;

  // Resolve stage by label (human-friendly) or validate stage_id belongs to board (safety)
  let resolvedToStageId: string | null = toStageIdFromBody;

  if (!resolvedToStageId && toStageLabel) {
    const { data: stages, error: stagesError } = await sb
      .from('board_stages')
      .select('id,label')
      .eq('organization_id', auth.organizationId)
      .eq('board_id', boardId)
      .ilike('label', toStageLabel)
      .limit(2);
    if (stagesError) return NextResponse.json({ error: stagesError.message, code: 'DB_ERROR' }, { status: 500 });
    if (!stages || stages.length === 0) {
      return NextResponse.json({ error: 'Stage not found for this board', code: 'VALIDATION_ERROR' }, { status: 422 });
    }
    if (stages.length > 1) {
      return NextResponse.json({ error: 'Ambiguous stage label for this board', code: 'VALIDATION_ERROR' }, { status: 422 });
    }
    resolvedToStageId = (stages[0] as any).id;
  }

  if (resolvedToStageId) {
    const { data: stage, error: stageError } = await sb
      .from('board_stages')
      .select('id')
      .eq('organization_id', auth.organizationId)
      .eq('board_id', boardId)
      .eq('id', resolvedToStageId)
      .maybeSingle();
    if (stageError) return NextResponse.json({ error: stageError.message, code: 'DB_ERROR' }, { status: 500 });
    if (!stage) return NextResponse.json({ error: 'Stage not found for this board', code: 'VALIDATION_ERROR' }, { status: 422 });
  } else {
    return NextResponse.json({ error: 'Invalid payload', code: 'VALIDATION_ERROR' }, { status: 422 });
  }

  const now = new Date().toISOString();
  const { data, error } = await sb
    .from('deals')
    .update({
      stage_id: resolvedToStageId,
      last_stage_change_date: now,
      updated_at: now,
    })
    .eq('organization_id', auth.organizationId)
    .eq('id', dealId)
    .select('id,title,value,board_id,stage_id,contact_id,client_company_id,is_won,is_lost,loss_reason,closed_at,created_at,updated_at')
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message, code: 'DB_ERROR' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Deal not found', code: 'NOT_FOUND' }, { status: 404 });

  return NextResponse.json({ data, action: 'moved' });
}

