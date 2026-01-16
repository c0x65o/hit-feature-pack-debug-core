import { NextResponse } from 'next/server';
import { resolveDebugCoreScopeMode } from '../lib/scope-mode';
import { buildUiSpecRows, loadUiSpecs } from '../lib/ui-specs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(req) {
    const mode = await resolveDebugCoreScopeMode(req, { entity: 'debug', verb: 'read' });
    // Explicit branching on all four modes.
    // For debug endpoints we treat own/ldd as allowed (equivalent to any) because there is no
    // meaningful ownership/ldd filtering for system stats, and admins are provisioned with `.own`
    // by default for scope groups.
    if (mode === 'none') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    else if (mode === 'own') {
        // allow
    }
    else if (mode === 'ldd') {
        // allow
    }
    else if (mode === 'any') {
        // allow
    }
    else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    try {
        const specs = await loadUiSpecs();
        if (!specs) {
            return NextResponse.json({ error: 'hit-ui-specs.json not found' }, { status: 404 });
        }
        const url = new URL(req.url);
        const page = Math.max(1, Number(url.searchParams.get('page') || 1));
        const pageSize = Math.min(500, Math.max(1, Number(url.searchParams.get('pageSize') || 50)));
        const sortBy = String(url.searchParams.get('sortBy') || '').trim();
        const sortOrder = String(url.searchParams.get('sortOrder') || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';
        const search = String(url.searchParams.get('search') || '').trim().toLowerCase();
        let items = buildUiSpecRows(specs);
        if (search) {
            items = items.filter((it) => {
                const hay = [
                    it.entityKey,
                    it.tableId,
                    it.drizzleTable,
                ]
                    .map((v) => String(v || '').toLowerCase())
                    .join(' ');
                return hay.includes(search);
            });
        }
        if (sortBy && items.length > 0) {
            items.sort((a, b) => {
                const av = a?.[sortBy];
                const bv = b?.[sortBy];
                if (av == null && bv == null)
                    return 0;
                if (av == null)
                    return sortOrder === 'desc' ? 1 : -1;
                if (bv == null)
                    return sortOrder === 'desc' ? -1 : 1;
                if (typeof av === 'number' && typeof bv === 'number') {
                    return sortOrder === 'desc' ? bv - av : av - bv;
                }
                const as = String(av).toLowerCase();
                const bs = String(bv).toLowerCase();
                if (as === bs)
                    return 0;
                return sortOrder === 'desc' ? (bs < as ? -1 : 1) : (as < bs ? -1 : 1);
            });
        }
        const total = items.length;
        const start = (page - 1) * pageSize;
        const paged = items.slice(start, start + pageSize);
        return NextResponse.json({
            items: paged,
            pagination: { page, pageSize, total },
        });
    }
    catch (e) {
        return NextResponse.json({ error: e?.message ?? String(e), stack: e?.stack }, { status: 500 });
    }
}
