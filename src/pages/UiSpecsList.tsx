'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useUi } from '@hit/ui-kit';
import { Table } from 'lucide-react';

type HitUiSpecs = {
  generated?: boolean;
  version?: number;
  entities?: Record<string, any>;
  fieldTypes?: Record<string, any>;
};

type EntityRow = {
  id: string; // DataTable needs an `id` field
  entityKey: string;
  drizzleTable: string;
  tableId: string;
  listColumnCount: number;
  formFieldCount: number;
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

export interface UiSpecsListProps {
  onNavigate?: (path: string) => void;
}

export function UiSpecsList({ onNavigate }: UiSpecsListProps) {
  const { Page, Card, DataTable, Alert, Spinner } = useUi();

  const [specs, setSpecs] = useState<HitUiSpecs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia('(max-width: 640px)');
    const onChange = () => setIsMobile(Boolean(mql.matches));
    onChange();
    try {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    } catch {
      mql.addListener(onChange);
      return () => mql.removeListener(onChange);
    }
  }, []);

  const navigate = (path: string) => {
    if (onNavigate) onNavigate(path);
    else if (typeof window !== 'undefined') window.location.href = path;
  };

  useEffect(() => {
    const fetchSpecs = async () => {
      try {
        const res = await fetch('/hit-ui-specs.json', { method: 'GET' });
        if (!res.ok) throw new Error(`Failed to fetch /hit-ui-specs.json (${res.status})`);
        const json = await res.json();
        const parsed = json && typeof json === 'object' ? (json as HitUiSpecs) : {};
        setSpecs(parsed);
      } catch (err: any) {
        setError(err?.message || 'Failed to load UI specs');
      } finally {
        setLoading(false);
      }
    };
    fetchSpecs();
  }, []);

  // Get the UI spec for this entity (debug.uiSpec) to drive columns
  const entitySpec = useMemo(() => {
    const e = specs?.entities?.['debug.uiSpec'];
    return e && typeof e === 'object' ? (e as Record<string, any>) : null;
  }, [specs]);

  const listSpec = useMemo(() => {
    const list = asRecord(entitySpec?.list);
    return list || {};
  }, [entitySpec]);

  const meta = useMemo(() => {
    return asRecord(entitySpec?.meta) || {};
  }, [entitySpec]);

  // Build rows from all entities in the spec
  const rows: EntityRow[] = useMemo(() => {
    const entities = specs?.entities && typeof specs.entities === 'object' ? specs.entities : {};
    const out: EntityRow[] = [];
    for (const entityKey of Object.keys(entities || {}).sort()) {
      const entity = asRecord(entities?.[entityKey]) || {};
      const list = asRecord(entity.list) || null;
      const form = asRecord(entity.form) || null;
      const storage = asRecord(entity.storage) || null;

      const drizzleTable =
        (storage && typeof storage.drizzleTable === 'string' ? storage.drizzleTable : '') ||
        (typeof (entity as any).drizzleTable === 'string' ? String((entity as any).drizzleTable) : '');
      const tableId = list && typeof list.tableId === 'string' ? list.tableId : '';

      const listColumns = normalizeColumns(list?.columns);
      const formFields = Array.isArray(form?.fields)
        ? (form?.fields as any[]).filter((f) => f && typeof f === 'object' && (f as any).key)
        : [];

      out.push({
        id: entityKey, // use entityKey as ID
        entityKey,
        drizzleTable,
        tableId,
        listColumnCount: listColumns.length,
        formFieldCount: formFields.length,
      });
    }
    return out;
  }, [specs]);

  // Build columns from the spec, with fallback
  const columns = useMemo(() => {
    const specCols = normalizeColumns(listSpec.columns);
    const mobileKeys = listSpec.mobileColumnKeys;

    const fallback = [
      { key: 'entityKey', label: 'Entity', sortable: true, filterType: 'string' },
      { key: 'tableId', label: 'tableId', sortable: true, filterType: 'string' },
      { key: 'drizzleTable', label: 'drizzleTable', sortable: true, filterType: 'string' },
      { key: 'listColumnCount', label: '# list cols', sortable: true, filterType: 'number' },
      { key: 'formFieldCount', label: '# form fields', sortable: true, filterType: 'number' },
    ];

    let cols = specCols.length > 0 ? specCols : fallback;

    // Filter for mobile
    if (isMobile && Array.isArray(mobileKeys) && mobileKeys.length > 0) {
      const allow = new Set(mobileKeys.map((k: any) => String(k)));
      cols = cols.filter((c) => allow.has(String(c.key)));
    }

    return cols.map((c) => ({
      key: String(c.key),
      label: c.label ? String(c.label) : String(c.key),
      sortable: c.sortable !== false,
      filterType: c.filterType,
    }));
  }, [listSpec, isMobile]);

  const pageTitle = String(meta.titlePlural || 'UI Specs');
  const pageDescription = String(meta.descriptionPlural || 'Public UI entities from /hit-ui-specs.json');

  if (loading) {
    return (
      <Page title={pageTitle} icon={Table}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Spinner />
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title={pageTitle} icon={Table}>
        <Alert variant="error">{error}</Alert>
      </Page>
    );
  }

  return (
    <Page title={pageTitle} description={pageDescription} icon={Table}>
      <Card>
        <DataTable
          columns={columns}
          data={rows}
          loading={false}
          emptyMessage="No UI specs found in /hit-ui-specs.json"
          onRowClick={(row: Record<string, unknown>) => {
            navigate(`/admin/debug/ui-specs/${encodeURIComponent(String(row.entityKey))}`);
          }}
          tableId={String(listSpec.tableId || 'debug.uiSpecs')}
          showColumnVisibility={!isMobile}
          initialColumnVisibility={listSpec.initialColumnVisibility}
          initialSorting={listSpec.initialSorting}
        />
      </Card>
    </Page>
  );
}

export default UiSpecsList;
