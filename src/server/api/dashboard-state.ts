import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { resolveDebugCoreScopeMode } from '../lib/scope-mode';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const mode = await resolveDebugCoreScopeMode(req, { entity: 'debug', verb: 'read' });

  // Explicit branching on all four modes.
  // For debug endpoints we treat own/ldd as allowed (equivalent to any) because there is no
  // meaningful ownership/ldd filtering for this system-level debug info, and admins are
  // provisioned with `.own` by default for scope groups.
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

  const getPool = (db as any).getPool as undefined | (() => any);
  if (typeof getPool !== 'function') {
    return NextResponse.json({ error: 'Debug DB pool is not available' }, { status: 500 });
  }
  const pool = getPool();

  try {
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = current_schema()
        AND table_name = 'dashboard_definitions'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      return NextResponse.json({ error: 'dashboard_definitions table does not exist' }, { status: 404 });
    }

    // Get CRM overview dashboard
    const dashboard = await pool.query(`
      SELECT
        key,
        name,
        description,
        updated_at,
        jsonb_array_length(definition->'widgets') as widget_count,
        definition->'widgets' as widgets
      FROM dashboard_definitions
      WHERE key = 'system.crm_overview';
    `);

    if (dashboard.rows.length === 0) {
      return NextResponse.json({ error: 'system.crm_overview dashboard not found' }, { status: 404 });
    }

    const row = dashboard.rows[0];

    // Extract pie chart widgets
    const widgets = row.widgets || [];
    const pieWidgets = widgets.filter((w: any) => w?.kind === 'api_pie');

    // Best-effort: show last applied Drizzle migrations (so we can confirm 0015 ran)
    let drizzleMigrations: { table: string; rows: any[] } | null = null;
    const candidates = ['__drizzle_migrations', 'drizzle.__drizzle_migrations'];
    for (const table of candidates) {
      try {
        const r = await pool.query(
          `SELECT * FROM ${table} ORDER BY created_at DESC LIMIT 10;`
        );
        drizzleMigrations = { table, rows: r.rows };
        break;
      } catch {
        // ignore and try next candidate
      }
    }

    return NextResponse.json({
      found: true,
      key: row.key,
      name: row.name,
      description: row.description,
      updated_at: row.updated_at,
      widget_count: row.widget_count,
      pie_chart_count: pieWidgets.length,
      pie_charts: pieWidgets.map((w: any) => ({
        key: w?.key,
        title: w?.title,
        endpoint: w?.presentation?.endpoint,
      })),
      all_widget_kinds: widgets.map((w: any) => w?.kind).filter(Boolean),
      drizzle_migrations: drizzleMigrations,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? String(e), stack: e?.stack },
      { status: 500 }
    );
  }
}

