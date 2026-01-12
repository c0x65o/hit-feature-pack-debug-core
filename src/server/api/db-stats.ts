import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { resolveDebugCoreScopeMode } from '../lib/scope-mode';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseIntParam(value: string | null, fallback: number): number {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * GET /api/debug/db-stats
 *
 * Query params:
 * - schema: optional schema name (default: all non-system schemas)
 * - limit: max number of rows (default: 200)
 *
 * Notes:
 * - row_count is based on pg_stat_user_tables.n_live_tup (approx, but fast)
 * - estimated_row_count is based on pg_class.reltuples (approx)
 */
export async function GET(req: NextRequest) {
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

  const getPool = (db as any).getPool as undefined | (() => any);
  if (typeof getPool !== 'function') {
    return NextResponse.json({ error: 'Debug DB pool is not available' }, { status: 500 });
  }
  const pool = getPool();
  try {
    const url = new URL(req.url);
    const schema = url.searchParams.get('schema');
    const limit = Math.min(2000, Math.max(1, parseIntParam(url.searchParams.get('limit'), 200)));

    const sql = `
      SELECT
        n.nspname AS schema,
        c.relname AS table,
        COALESCE(s.n_live_tup, 0)::bigint AS row_count,
        COALESCE(c.reltuples, 0)::bigint AS estimated_row_count,
        pg_relation_size(c.oid)::bigint AS table_bytes,
        pg_indexes_size(c.oid)::bigint AS indexes_bytes,
        pg_total_relation_size(c.oid)::bigint AS total_bytes,
        pg_size_pretty(pg_relation_size(c.oid)) AS table_size,
        pg_size_pretty(pg_indexes_size(c.oid)) AS indexes_size,
        pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
        (
          SELECT COUNT(*)::int
          FROM pg_index i
          WHERE i.indrelid = c.oid
        ) AS index_count
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
      WHERE
        c.relkind = 'r'
        AND n.nspname NOT IN ('pg_catalog', 'information_schema')
        AND ($1::text IS NULL OR n.nspname = $1::text)
      ORDER BY pg_total_relation_size(c.oid) DESC
      LIMIT $2::int;
    `;

    const result = await pool.query(sql, [schema, limit]);

    return NextResponse.json({
      schema: schema ?? null,
      limit,
      row_count_source: 'pg_stat_user_tables.n_live_tup (approx)',
      estimated_row_count_source: 'pg_class.reltuples (approx)',
      items: result.rows,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        error: e?.message ?? String(e),
        stack: e?.stack,
      },
      { status: 500 }
    );
  }
}

