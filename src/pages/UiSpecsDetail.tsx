'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useUi } from '@hit/ui-kit';
import { ArrowLeft, Table } from 'lucide-react';

type HitUiSpecs = {
  generated?: boolean;
  version?: number;
  entities?: Record<string, any>;
  fieldTypes?: Record<string, any>;
};

type ColumnRow = {
  id: string;
  key: string;
  label: string;
  filterType: string;
  sortable: string;
  reference: string;
};

type FieldRow = {
  id: string;
  key: string;
  label: string;
  type: string;
  required: string;
  extra: string;
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

function extractEntityKeyFromPath(): string {
  if (typeof window === 'undefined') return '';
  const parts = window.location.pathname.split('/').filter(Boolean);
  const idx = parts.findIndex((p) => p === 'ui-specs');
  if (idx < 0) return '';
  const entity = parts[idx + 1] || '';
  try {
    return decodeURIComponent(entity);
  } catch {
    return entity;
  }
}

export interface UiSpecsDetailProps {
  onNavigate?: (path: string) => void;
}

export function UiSpecsDetail({ onNavigate }: UiSpecsDetailProps) {
  const { Page, Card, Button, DataTable, Alert, Spinner } = useUi();

  const [specs, setSpecs] = useState<HitUiSpecs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const entityKey = useMemo(() => extractEntityKeyFromPath(), []);

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

  // Get the debug.uiSpec entity for meta/detail config
  const debugSpec = useMemo(() => {
    const e = specs?.entities?.['debug.uiSpec'];
    return e && typeof e === 'object' ? (e as Record<string, any>) : null;
  }, [specs]);

  const meta = useMemo(() => {
    return asRecord(debugSpec?.meta) || {};
  }, [debugSpec]);

  const detailSpec = useMemo(() => {
    return asRecord(debugSpec?.detail) || {};
  }, [debugSpec]);

  // The entity we're viewing details for
  const entity = useMemo(() => {
    const e = specs?.entities?.[entityKey];
    return e && typeof e === 'object' ? (e as Record<string, any>) : null;
  }, [specs, entityKey]);

  // Entity's own meta
  const entityMeta = useMemo(() => {
    return asRecord(entity?.meta) || {};
  }, [entity]);

  // Build list columns rows
  const listColumnsRows: ColumnRow[] = useMemo(() => {
    const list = asRecord(entity?.list) || null;
    const cols = normalizeColumns(list?.columns);
    return cols.map((c, idx) => {
      const ref = asRecord(c.reference);
      const refSummary = ref
        ? `${String(ref.entityType || '')}${ref.labelFromRow ? ` (${String(ref.labelFromRow)})` : ''}`
        : '';
      return {
        id: `${c.key}-${idx}`,
        key: String(c.key || ''),
        label: c.label ? String(c.label) : '',
        filterType: c.filterType ? String(c.filterType) : '',
        sortable: typeof c.sortable === 'boolean' ? String(c.sortable) : '',
        reference: refSummary,
      };
    });
  }, [entity]);

  // Build form fields rows
  const formFieldsRows: FieldRow[] = useMemo(() => {
    const form = asRecord(entity?.form) || null;
    const arr = Array.isArray(form?.fields) ? (form?.fields as any[]) : [];
    const filtered = arr.filter((f) => f && typeof f === 'object' && (f as any).key);
    return filtered.map((f: any, idx: number) => {
      const ref = asRecord(f.reference);
      const extra = [
        f.optionSource ? `optionSource=${String(f.optionSource)}` : null,
        ref?.entityType ? `ref=${String(ref.entityType)}` : null,
      ]
        .filter(Boolean)
        .join(' ');
      return {
        id: `${f.key}-${idx}`,
        key: String(f.key || ''),
        label: f.label ? String(f.label) : '',
        type: f.type ? String(f.type) : '',
        required: typeof f.required === 'boolean' ? String(f.required) : '',
        extra,
      };
    });
  }, [entity]);

  // Columns for listColumns table
  const listColumnsColumns = useMemo(() => {
    const tableSpec = asRecord(detailSpec.listColumns) || {};
    const specCols = normalizeColumns(tableSpec.columns);
    const mobileKeys = tableSpec.mobileColumnKeys;

    const fallback = [
      { key: 'key', label: 'key', sortable: true },
      { key: 'label', label: 'label', sortable: false },
      { key: 'filterType', label: 'filterType', sortable: false },
      { key: 'sortable', label: 'sortable', sortable: false },
      { key: 'reference', label: 'reference', sortable: false },
    ];

    let cols = specCols.length > 0 ? specCols : fallback;

    if (isMobile && Array.isArray(mobileKeys) && mobileKeys.length > 0) {
      const allow = new Set(mobileKeys.map((k: any) => String(k)));
      cols = cols.filter((c) => allow.has(String(c.key)));
    }

    return cols.map((c) => ({
      key: String(c.key),
      label: c.label ? String(c.label) : String(c.key),
      sortable: c.sortable !== false,
    }));
  }, [detailSpec, isMobile]);

  // Columns for formFields table
  const formFieldsColumns = useMemo(() => {
    const tableSpec = asRecord(detailSpec.formFields) || {};
    const specCols = normalizeColumns(tableSpec.columns);
    const mobileKeys = tableSpec.mobileColumnKeys;

    const fallback = [
      { key: 'key', label: 'key', sortable: true },
      { key: 'label', label: 'label', sortable: false },
      { key: 'type', label: 'type', sortable: false },
      { key: 'required', label: 'required', sortable: false },
      { key: 'extra', label: 'extra', sortable: false },
    ];

    let cols = specCols.length > 0 ? specCols : fallback;

    if (isMobile && Array.isArray(mobileKeys) && mobileKeys.length > 0) {
      const allow = new Set(mobileKeys.map((k: any) => String(k)));
      cols = cols.filter((c) => allow.has(String(c.key)));
    }

    return cols.map((c) => ({
      key: String(c.key),
      label: c.label ? String(c.label) : String(c.key),
      sortable: c.sortable !== false,
    }));
  }, [detailSpec, isMobile]);

  const pageTitle = entityMeta.titleSingular
    ? `${String(entityMeta.titleSingular)}: ${entityKey}`
    : `UI Spec: ${entityKey}`;

  if (loading) {
    return (
      <Page title="UI Spec" icon={Table}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Spinner />
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="UI Spec" icon={Table}>
        <Alert variant="error">{error}</Alert>
      </Page>
    );
  }

  if (!entityKey) {
    return (
      <Page title="UI Spec" icon={Table}>
        <Alert variant="error">Missing entityKey in URL.</Alert>
      </Page>
    );
  }

  if (!entity) {
    return (
      <Page title={`UI Spec: ${entityKey}`} icon={Table}>
        <Alert variant="warning">Entity not found in /hit-ui-specs.json.</Alert>
        <div style={{ marginTop: '1rem' }}>
          <Button variant="secondary" onClick={() => navigate('/admin/debug/ui-specs')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to list
          </Button>
        </div>
      </Page>
    );
  }

  const tableId = asRecord(entity.list)?.tableId ? String(asRecord(entity.list)?.tableId) : '—';
  const drizzleTable = asRecord(entity.storage)?.drizzleTable ? String(asRecord(entity.storage)?.drizzleTable) : '—';
  const listColumnsTableSpec = asRecord(detailSpec.listColumns) || {};
  const formFieldsTableSpec = asRecord(detailSpec.formFields) || {};

  return (
    <Page
      title={pageTitle}
      description="Drill-in details for a single UI entity spec"
      icon={Table}
      breadcrumbs={[
        { label: 'Debug', href: '/admin/debug' },
        { label: 'UI Specs', href: '/admin/debug/ui-specs' },
        { label: entityKey },
      ]}
      actions={
        <Button variant="secondary" onClick={() => navigate('/admin/debug/ui-specs')}>
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <Card title="Summary">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: '0.75rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>tableId</div>
              <div style={{ fontFamily: 'monospace' }}>{tableId}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>drizzleTable</div>
              <div style={{ fontFamily: 'monospace' }}>{drizzleTable}</div>
            </div>
          </div>
        </Card>

        <Card title={`List Columns (${listColumnsRows.length})`}>
          <DataTable
            columns={listColumnsColumns}
            data={listColumnsRows}
            loading={false}
            emptyMessage="No list.columns declared."
            tableId={String(listColumnsTableSpec.tableId || 'debug.uiSpecs.listColumns')}
            showColumnVisibility={false}
          />
        </Card>

        <Card title={`Form Fields (${formFieldsRows.length})`}>
          <DataTable
            columns={formFieldsColumns}
            data={formFieldsRows}
            loading={false}
            emptyMessage="No form.fields declared."
            tableId={String(formFieldsTableSpec.tableId || 'debug.uiSpecs.formFields')}
            showColumnVisibility={false}
          />
        </Card>

        <details style={{ border: '1px solid var(--hit-border)', borderRadius: 6, padding: '0.75rem' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Raw entity JSON</summary>
          <pre style={{ marginTop: '0.75rem', whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
            {JSON.stringify(entity, null, 2)}
          </pre>
        </details>
      </div>
    </Page>
  );
}

export default UiSpecsDetail;
