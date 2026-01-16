import { NextRequest, NextResponse } from 'next/server';
import { resolveDebugCoreScopeMode } from '../lib/scope-mode';
import { buildUiSpecRow, loadUiSpecs } from '../lib/ui-specs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const mode = await resolveDebugCoreScopeMode(req, { entity: 'debug', verb: 'read' });

  // Explicit branching on all four modes.
  // For debug endpoints we treat own/ldd as allowed (equivalent to any) because there is no
  // meaningful ownership/ldd filtering for system stats, and admins are provisioned with `.own`
  // by default for scope groups.
  if (mode === 'none') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } else if (mode === 'own') {
    // allow
  } else if (mode === 'ldd') {
    // allow
  } else if (mode === 'any') {
    // allow
  } else {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const specs = await loadUiSpecs();
    if (!specs) {
      return NextResponse.json({ error: 'hit-ui-specs.json not found' }, { status: 404 });
    }

    const id = String(ctx?.params?.id || '').trim();
    if (!id) {
      return NextResponse.json({ error: 'Missing entity key' }, { status: 400 });
    }

    const entity = specs?.entities && typeof specs.entities === 'object' ? specs.entities[id] : null;
    if (!entity) {
      return NextResponse.json({ error: 'UI spec not found' }, { status: 404 });
    }

    const row = buildUiSpecRow(id, entity);
    return NextResponse.json({
      ...row,
      spec: entity,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? String(e), stack: e?.stack },
      { status: 500 }
    );
  }
}
