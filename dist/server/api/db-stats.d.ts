import { NextRequest } from 'next/server';
export declare const runtime = "nodejs";
export declare const dynamic = "force-dynamic";
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
export declare function GET(req: NextRequest): Promise<any>;
//# sourceMappingURL=db-stats.d.ts.map