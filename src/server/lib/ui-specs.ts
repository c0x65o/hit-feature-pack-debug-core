import path from 'node:path';
import { promises as fs } from 'node:fs';

export type HitUiSpecs = {
  generated?: boolean;
  version?: number;
  entities?: Record<string, any>;
  fieldTypes?: Record<string, any>;
  workflows?: Record<string, any>;
};

export type UiSpecRow = {
  id: string;
  entityKey: string;
  drizzleTable: string;
  tableId: string;
  listColumnCount: number;
  fieldCount: number;
  formSectionCount: number;
  relationCount: number;
  headerActionCount: number;
  detailExtrasCount: number;
};

function asRecord(v: unknown): Record<string, any> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, any>) : null;
}

function normalizeColumns(colsAny: unknown): Array<Record<string, any>> {
  if (Array.isArray(colsAny)) {
    return colsAny.filter((c) => c && typeof c === 'object') as Array<Record<string, any>>;
  }
  const rec = asRecord(colsAny);
  if (!rec) return [];
  return Object.entries(rec).map(([key, val]) => ({
    key,
    ...(val && typeof val === 'object' && !Array.isArray(val) ? (val as Record<string, any>) : {}),
  }));
}

export async function loadUiSpecs(): Promise<HitUiSpecs | null> {
  const candidates = [
    path.join(process.cwd(), 'public', 'hit-ui-specs.json'),
  ];

  for (const p of candidates) {
    try {
      const raw = await fs.readFile(p, 'utf8');
      const json = JSON.parse(raw);
      if (json && typeof json === 'object') return json as HitUiSpecs;
    } catch {
      // keep trying candidates
    }
  }

  return null;
}

export function buildUiSpecRow(entityKey: string, entityAny: unknown): UiSpecRow {
  const entity = asRecord(entityAny) || {};
  const list = asRecord(entity.list) || null;
  const storage = asRecord(entity.storage) || null;
  const fields = asRecord(entity.fields) || null;
  const form = asRecord(entity.form) || null;
  const relations = asRecord(entity.relations) || null;
  const meta = asRecord(entity.meta) || null;
  const detail = asRecord(entity.detail) || null;

  const drizzleTable =
    (storage && typeof storage.drizzleTable === 'string' ? storage.drizzleTable : '') ||
    (typeof (entity as any).drizzleTable === 'string' ? String((entity as any).drizzleTable) : '');
  const tableId = list && typeof list.tableId === 'string' ? list.tableId : '';

  const listColumns = normalizeColumns(list?.columns);
  const fieldCount = fields ? Object.keys(fields).length : 0;
  const formSections = Array.isArray(form?.sections) ? (form?.sections as any[]) : [];
  const relationCount = relations ? Object.keys(relations).length : 0;
  const headerActionCount = Array.isArray(meta?.headerActions) ? (meta?.headerActions as any[]).length : 0;
  const detailExtrasCount = Array.isArray(detail?.extras) ? (detail?.extras as any[]).length : 0;

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

export function buildUiSpecRows(specs: HitUiSpecs | null): UiSpecRow[] {
  const entities = specs?.entities && typeof specs.entities === 'object' ? specs.entities : {};
  const rows: UiSpecRow[] = [];
  for (const entityKey of Object.keys(entities || {}).sort()) {
    rows.push(buildUiSpecRow(entityKey, (entities as any)[entityKey]));
  }
  return rows;
}
