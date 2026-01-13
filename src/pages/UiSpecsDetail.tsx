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

type KeyValueRow = {
  id: string;
  key: string;
  value: string;
};

type BreadcrumbRow = {
  id: string;
  label: string;
  href: string;
};

type HeaderActionRow = {
  id: string;
  kind: string;
  label: string;
  actionKey: string;
  icon: string;
  platforms: string;
  visibility: string;
};

type FormSectionRow = {
  id: string;
  title: string;
  layout: string;
  widget: string;
  relation: string;
  fields: string;
};

type RelationRow = {
  id: string;
  key: string;
  kind: string;
  persist: string;
  primary: string;
  uiTitle: string;
  fieldCount: number;
};

type DetailExtraRow = {
  id: string;
  kind: string;
  title: string;
  entityType: string;
  tableId: string;
  platforms: string;
  query: string;
  createRoute: string;
  emptyMessage: string;
};

function asRecord(v: unknown): Record<string, any> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, any>) : null;
}

function oneLine(v: unknown): string {
  if (v === null) return 'null';
  if (v === undefined) return '—';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function oneLinePretty(v: unknown): string {
  const s = oneLine(v);
  // avoid runaway cells in tables
  return s.length > 180 ? `${s.slice(0, 180)}…` : s;
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

  const entityList = useMemo(() => asRecord(entity?.list) || {}, [entity]);
  const entityStorage = useMemo(() => asRecord(entity?.storage) || {}, [entity]);
  const entityForm = useMemo(() => asRecord(entity?.form) || {}, [entity]);
  const entityRelations = useMemo(() => asRecord(entity?.relations) || {}, [entity]);
  const entityDetail = useMemo(() => asRecord(entity?.detail) || {}, [entity]);

  const metaRoutesRows: KeyValueRow[] = useMemo(() => {
    const routes = asRecord(entityMeta.routes) || null;
    const entries = routes ? Object.entries(routes) : [];
    return entries.map(([k, v], idx) => ({
      id: `${k}-${idx}`,
      key: String(k),
      value: typeof v === 'string' ? v : oneLinePretty(v),
    }));
  }, [entityMeta]);

  const breadcrumbsRows: BreadcrumbRow[] = useMemo(() => {
    const crumbs = Array.isArray(entityMeta.breadcrumbs) ? (entityMeta.breadcrumbs as any[]) : [];
    return crumbs
      .filter((c) => c && typeof c === 'object')
      .map((c: any, idx: number) => ({
        id: `${idx}`,
        label: c?.label ? String(c.label) : '',
        href: c?.href ? String(c.href) : '',
      }));
  }, [entityMeta]);

  const metaActionsRows: KeyValueRow[] = useMemo(() => {
    const actions = asRecord(entityMeta.actions) || null;
    const entries = actions ? Object.entries(actions) : [];
    return entries.map(([k, v], idx) => ({
      id: `${k}-${idx}`,
      key: String(k),
      value: typeof v === 'string' ? v : oneLinePretty(v),
    }));
  }, [entityMeta]);

  const headerActionsRows: HeaderActionRow[] = useMemo(() => {
    const actions = Array.isArray(entityMeta.headerActions) ? (entityMeta.headerActions as any[]) : [];
    return actions
      .filter((a) => a && typeof a === 'object')
      .map((a: any, idx: number) => ({
        id: `${idx}`,
        kind: a?.kind ? String(a.kind) : '',
        label: a?.label ? String(a.label) : '',
        actionKey: a?.actionKey ? String(a.actionKey) : '',
        icon: a?.icon ? String(a.icon) : '',
        platforms: Array.isArray(a?.platforms) ? (a.platforms as any[]).map(String).join(', ') : '',
        visibility: a?.visibility ? oneLinePretty(a.visibility) : '',
      }));
  }, [entityMeta]);

  const listConfigRows: KeyValueRow[] = useMemo(() => {
    const list = entityList || {};
    const keys = [
      'tableId',
      'platforms',
      'uiStateVersion',
      'defaultVisibleOnly',
      'mobileColumnKeys',
      'pageSize',
      'initialSort',
      'sortWhitelist',
      'initialColumnVisibility',
      'initialSorting',
    ];
    return keys
      .filter((k) => k in list)
      .map((k, idx) => ({
        id: `${k}-${idx}`,
        key: k,
        value: oneLinePretty((list as any)[k]),
      }));
  }, [entityList]);

  const formSectionsRows: FormSectionRow[] = useMemo(() => {
    const sections = Array.isArray(entityForm?.sections) ? (entityForm.sections as any[]) : [];
    return sections
      .filter((s) => s && typeof s === 'object')
      .map((s: any, idx: number) => ({
        id: s?.id ? String(s.id) : String(idx),
        title: s?.title ? String(s.title) : '',
        layout: s?.layout ? oneLinePretty(s.layout) : '',
        widget: s?.widget ? String(s.widget) : '',
        relation: s?.relation ? String(s.relation) : '',
        fields: Array.isArray(s?.fields) ? (s.fields as any[]).map(String).join(', ') : '',
      }));
  }, [entityForm]);

  const relationsRows: RelationRow[] = useMemo(() => {
    const rels = entityRelations || {};
    const entries = Object.entries(rels);
    return entries
      .filter(([, v]) => v && typeof v === 'object')
      .map(([key, v], idx) => {
        const r = asRecord(v) || {};
        const persist = asRecord(r.persist);
        const primary = asRecord(r.primary);
        const ui = asRecord(r.ui);
        const uiFields = Array.isArray(ui?.fields) ? (ui?.fields as any[]) : [];
        return {
          id: `${key}-${idx}`,
          key: String(key),
          kind: r.kind ? String(r.kind) : '',
          persist: persist ? oneLinePretty(persist) : '',
          primary: primary ? oneLinePretty(primary) : '',
          uiTitle: ui?.title ? String(ui.title) : '',
          fieldCount: uiFields.length,
        };
      });
  }, [entityRelations]);

  const detailExtrasRows: DetailExtraRow[] = useMemo(() => {
    const extras = Array.isArray(entityDetail?.extras) ? (entityDetail.extras as any[]) : [];
    return extras
      .filter((e) => e && typeof e === 'object')
      .map((e: any, idx: number) => ({
        id: `${idx}`,
        kind: e?.kind ? String(e.kind) : '',
        title: e?.title ? String(e.title) : '',
        entityType: e?.entityType ? String(e.entityType) : '',
        tableId: e?.tableId ? String(e.tableId) : '',
        platforms: Array.isArray(e?.platforms) ? (e.platforms as any[]).map(String).join(', ') : '',
        query: e?.query ? oneLinePretty(e.query) : '',
        createRoute: e?.createRoute ? String(e.createRoute) : '',
        emptyMessage: e?.emptyMessage ? String(e.emptyMessage) : '',
      }));
  }, [entityDetail]);

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

  // Build fields rows (canonical entities.<key>.fields map)
  const fieldsRows: FieldRow[] = useMemo(() => {
    const fields = asRecord(entity?.fields) || null;
    const entries = fields ? Object.entries(fields) : [];
    return entries.map(([key, fieldAny], idx) => {
      const f = asRecord(fieldAny) || {};
      const ref = asRecord(f.reference);
      const extra = [
        f.optionSource ? `optionSource=${String(f.optionSource)}` : null,
        ref?.entityType ? `ref=${String(ref.entityType)}` : null,
      ]
        .filter(Boolean)
        .join(' ');
      return {
        id: `${key}-${idx}`,
        key: String(key || ''),
        label: f.label ? String(f.label) : '',
        type: f.type ? String(f.type) : '',
        required: typeof f.required === 'boolean' ? String(f.required) : '',
        extra,
      };
    });
  }, [entity]);

  function buildTableColumns(tableKey: string, fallback: Array<{ key: string; label: string; sortable?: boolean }>) {
    const tableSpec = asRecord((detailSpec as any)?.[tableKey]) || {};
    const specCols = normalizeColumns(tableSpec.columns);
    const mobileKeys = tableSpec.mobileColumnKeys;

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
  }

  // Columns for listColumns table
  const listColumnsColumns = useMemo(() => {
    const fallback = [
      { key: 'key', label: 'key', sortable: true },
      { key: 'label', label: 'label', sortable: false },
      { key: 'filterType', label: 'filterType', sortable: false },
      { key: 'sortable', label: 'sortable', sortable: false },
      { key: 'reference', label: 'reference', sortable: false },
    ];
    return buildTableColumns('listColumns', fallback);
  }, [detailSpec, isMobile]);

  // Columns for fields table
  const fieldsColumns = useMemo(() => {
    const fallback = [
      { key: 'key', label: 'key', sortable: true },
      { key: 'label', label: 'label', sortable: false },
      { key: 'type', label: 'type', sortable: false },
      { key: 'required', label: 'required', sortable: false },
      { key: 'extra', label: 'extra', sortable: false },
    ];
    return buildTableColumns('fields', fallback);
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
  const fieldsTableSpec = asRecord(detailSpec.fields) || {};
  const metaRoutesTableSpec = asRecord((detailSpec as any).metaRoutes) || {};
  const breadcrumbsTableSpec = asRecord((detailSpec as any).breadcrumbs) || {};
  const metaActionsTableSpec = asRecord((detailSpec as any).metaActions) || {};
  const headerActionsTableSpec = asRecord((detailSpec as any).headerActions) || {};
  const listConfigTableSpec = asRecord((detailSpec as any).listConfig) || {};
  const formSectionsTableSpec = asRecord((detailSpec as any).formSections) || {};
  const relationsTableSpec = asRecord((detailSpec as any).relations) || {};
  const detailExtrasTableSpec = asRecord((detailSpec as any).detailExtras) || {};

  const metaRoutesColumns = useMemo(
    () => buildTableColumns('metaRoutes', [{ key: 'key', label: 'key', sortable: true }, { key: 'value', label: 'path' }]),
    [detailSpec, isMobile]
  );
  const breadcrumbsColumns = useMemo(
    () => buildTableColumns('breadcrumbs', [{ key: 'label', label: 'label', sortable: true }, { key: 'href', label: 'href' }]),
    [detailSpec, isMobile]
  );
  const metaActionsColumns = useMemo(
    () => buildTableColumns('metaActions', [{ key: 'key', label: 'key', sortable: true }, { key: 'value', label: 'value' }]),
    [detailSpec, isMobile]
  );
  const headerActionsColumns = useMemo(
    () =>
      buildTableColumns('headerActions', [
        { key: 'kind', label: 'kind', sortable: true },
        { key: 'label', label: 'label' },
        { key: 'actionKey', label: 'actionKey' },
        { key: 'icon', label: 'icon' },
        { key: 'platforms', label: 'platforms' },
        { key: 'visibility', label: 'visibility' },
      ]),
    [detailSpec, isMobile]
  );
  const listConfigColumns = useMemo(
    () => buildTableColumns('listConfig', [{ key: 'key', label: 'key', sortable: true }, { key: 'value', label: 'value' }]),
    [detailSpec, isMobile]
  );
  const formSectionsColumns = useMemo(
    () =>
      buildTableColumns('formSections', [
        { key: 'id', label: 'id', sortable: true },
        { key: 'title', label: 'title' },
        { key: 'layout', label: 'layout' },
        { key: 'widget', label: 'widget' },
        { key: 'relation', label: 'relation' },
        { key: 'fields', label: 'fields' },
      ]),
    [detailSpec, isMobile]
  );
  const relationsColumns = useMemo(
    () =>
      buildTableColumns('relations', [
        { key: 'key', label: 'key', sortable: true },
        { key: 'kind', label: 'kind' },
        { key: 'persist', label: 'persist' },
        { key: 'primary', label: 'primary' },
        { key: 'uiTitle', label: 'ui.title' },
        { key: 'fieldCount', label: '# ui fields', sortable: true },
      ]),
    [detailSpec, isMobile]
  );
  const detailExtrasColumns = useMemo(
    () =>
      buildTableColumns('detailExtras', [
        { key: 'kind', label: 'kind', sortable: true },
        { key: 'title', label: 'title' },
        { key: 'entityType', label: 'entityType' },
        { key: 'tableId', label: 'tableId' },
        { key: 'platforms', label: 'platforms' },
        { key: 'query', label: 'query' },
        { key: 'createRoute', label: 'createRoute' },
        { key: 'emptyMessage', label: 'emptyMessage' },
      ]),
    [detailSpec, isMobile]
  );

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
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>routes</div>
              <div style={{ fontFamily: 'monospace' }}>
                {metaRoutesRows.length > 0 ? `${metaRoutesRows.length} defined` : '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>form / relations / extras</div>
              <div style={{ fontFamily: 'monospace' }}>
                {formSectionsRows.length} sections · {relationsRows.length} relations · {detailExtrasRows.length} extras
              </div>
            </div>
          </div>
        </Card>

        <Card title="Meta">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: '0.75rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>titleSingular</div>
                <div style={{ fontFamily: 'monospace' }}>{entityMeta.titleSingular ? String(entityMeta.titleSingular) : '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>titlePlural</div>
                <div style={{ fontFamily: 'monospace' }}>{entityMeta.titlePlural ? String(entityMeta.titlePlural) : '—'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontWeight: 600 }}>Routes</div>
              <DataTable
                columns={metaRoutesColumns}
                data={metaRoutesRows.map((r) => ({ id: r.id, key: r.key, value: r.value }))}
                loading={false}
                emptyMessage="No meta.routes declared."
                tableId={String(metaRoutesTableSpec.tableId || 'debug.uiSpecs.metaRoutes')}
                showColumnVisibility={false}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontWeight: 600 }}>Breadcrumbs</div>
              <DataTable
                columns={breadcrumbsColumns}
                data={breadcrumbsRows}
                loading={false}
                emptyMessage="No meta.breadcrumbs declared."
                tableId={String(breadcrumbsTableSpec.tableId || 'debug.uiSpecs.breadcrumbs')}
                showColumnVisibility={false}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontWeight: 600 }}>Actions (labels / confirm copy)</div>
              <DataTable
                columns={metaActionsColumns}
                data={metaActionsRows.map((r) => ({ id: r.id, key: r.key, value: r.value }))}
                loading={false}
                emptyMessage="No meta.actions declared."
                tableId={String(metaActionsTableSpec.tableId || 'debug.uiSpecs.metaActions')}
                showColumnVisibility={false}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontWeight: 600 }}>Header Actions</div>
              <DataTable
                columns={headerActionsColumns}
                data={headerActionsRows}
                loading={false}
                emptyMessage="No meta.headerActions declared."
                tableId={String(headerActionsTableSpec.tableId || 'debug.uiSpecs.headerActions')}
                showColumnVisibility={false}
              />
            </div>
          </div>
        </Card>

        <Card title="List Config">
          <DataTable
            columns={listConfigColumns}
            data={listConfigRows.map((r) => ({ id: r.id, key: r.key, value: r.value }))}
            loading={false}
            emptyMessage="No list config declared."
            tableId={String(listConfigTableSpec.tableId || 'debug.uiSpecs.listConfig')}
            showColumnVisibility={false}
          />
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

        <Card title={`Form Sections (${formSectionsRows.length})`}>
          <DataTable
            columns={formSectionsColumns}
            data={formSectionsRows}
            loading={false}
            emptyMessage="No form.sections declared."
            tableId={String(formSectionsTableSpec.tableId || 'debug.uiSpecs.formSections')}
            showColumnVisibility={false}
          />
        </Card>

        <Card title={`Fields (${fieldsRows.length})`}>
          <DataTable
            columns={fieldsColumns}
            data={fieldsRows}
            loading={false}
            emptyMessage="No fields declared."
            tableId={String(fieldsTableSpec.tableId || 'debug.uiSpecs.fields')}
            showColumnVisibility={false}
          />
        </Card>

        <Card title={`Relations (${relationsRows.length})`}>
          <DataTable
            columns={relationsColumns}
            data={relationsRows}
            loading={false}
            emptyMessage="No relations declared."
            tableId={String(relationsTableSpec.tableId || 'debug.uiSpecs.relations')}
            showColumnVisibility={false}
          />
          {relationsRows.length > 0 ? (
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {relationsRows.map((r) => {
                const relAny = asRecord((entityRelations as any)?.[r.key]) || {};
                return (
                  <details
                    key={r.id}
                    style={{ border: '1px solid var(--hit-border)', borderRadius: 6, padding: '0.75rem' }}
                  >
                    <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                      {r.key} ({r.kind})
                    </summary>
                    <pre style={{ marginTop: '0.75rem', whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                      {JSON.stringify(relAny, null, 2)}
                    </pre>
                  </details>
                );
              })}
            </div>
          ) : null}
        </Card>

        <Card title={`Detail Extras (${detailExtrasRows.length})`}>
          <DataTable
            columns={detailExtrasColumns}
            data={detailExtrasRows}
            loading={false}
            emptyMessage="No detail.extras declared."
            tableId={String(detailExtrasTableSpec.tableId || 'debug.uiSpecs.detailExtras')}
            showColumnVisibility={false}
          />
          {detailExtrasRows.length > 0 ? (
            <details style={{ marginTop: '1rem', border: '1px solid var(--hit-border)', borderRadius: 6, padding: '0.75rem' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Raw detail JSON</summary>
              <pre style={{ marginTop: '0.75rem', whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                {JSON.stringify(entityDetail, null, 2)}
              </pre>
            </details>
          ) : null}
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
