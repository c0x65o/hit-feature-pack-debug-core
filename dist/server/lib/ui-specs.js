import path from 'node:path';
import { promises as fs } from 'node:fs';
function asRecord(v) {
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
}
function normalizeColumns(colsAny) {
    if (Array.isArray(colsAny)) {
        return colsAny.filter((c) => c && typeof c === 'object');
    }
    const rec = asRecord(colsAny);
    if (!rec)
        return [];
    return Object.entries(rec).map(([key, val]) => ({
        key,
        ...(val && typeof val === 'object' && !Array.isArray(val) ? val : {}),
    }));
}
export async function loadUiSpecs() {
    const candidates = [
        path.join(process.cwd(), 'public', 'hit-ui-specs.json'),
    ];
    for (const p of candidates) {
        try {
            const raw = await fs.readFile(p, 'utf8');
            const json = JSON.parse(raw);
            if (json && typeof json === 'object')
                return json;
        }
        catch {
            // keep trying candidates
        }
    }
    return null;
}
export function buildUiSpecRow(entityKey, entityAny) {
    const entity = asRecord(entityAny) || {};
    const list = asRecord(entity.list) || null;
    const storage = asRecord(entity.storage) || null;
    const fields = asRecord(entity.fields) || null;
    const form = asRecord(entity.form) || null;
    const relations = asRecord(entity.relations) || null;
    const meta = asRecord(entity.meta) || null;
    const detail = asRecord(entity.detail) || null;
    const drizzleTable = (storage && typeof storage.drizzleTable === 'string' ? storage.drizzleTable : '') ||
        (typeof entity.drizzleTable === 'string' ? String(entity.drizzleTable) : '');
    const tableId = list && typeof list.tableId === 'string' ? list.tableId : '';
    const listColumns = normalizeColumns(list?.columns);
    const fieldCount = fields ? Object.keys(fields).length : 0;
    const formSections = Array.isArray(form?.sections) ? form?.sections : [];
    const relationCount = relations ? Object.keys(relations).length : 0;
    const headerActionCount = Array.isArray(meta?.headerActions) ? (meta?.headerActions).length : 0;
    const detailExtrasCount = Array.isArray(detail?.extras) ? (detail?.extras).length : 0;
    return {
        id: entityKey,
        entityKey,
        drizzleTable,
        tableId,
        listColumnCount: listColumns.length,
        fieldCount,
        formSectionCount: formSections.length,
        relationCount,
        headerActionCount,
        detailExtrasCount,
    };
}
export function buildUiSpecRows(specs) {
    const entities = specs?.entities && typeof specs.entities === 'object' ? specs.entities : {};
    const rows = [];
    for (const entityKey of Object.keys(entities || {}).sort()) {
        rows.push(buildUiSpecRow(entityKey, entities[entityKey]));
    }
    return rows;
}
