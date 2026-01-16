'use client';

import React, { useMemo } from 'react';

type UiSpecDetailWidgetProps = {
  record: any;
  ui: any;
  navigate?: (path: string) => void;
  platform?: string;
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

function buildTableColumns(
  fallback: Array<{ key: string; label: string; sortable?: boolean }>
): Array<{ key: string; label: string; sortable?: boolean }> {
  return fallback.map((c) => ({
    key: String(c.key),
    label: c.label ? String(c.label) : String(c.key),
    sortable: c.sortable !== false,
  }));
}

export function UiSpecDetailWidget({ record, ui }: UiSpecDetailWidgetProps) {
  const { Card, DataTable, Alert } = ui;

  const entity = asRecord(record?.spec) || null;
  if (!entity) {
    return (
      <Alert variant="warning" title="Missing spec data">
        This UI spec record does not include a `spec` payload.
      </Alert>
    );
  }

  const entityMeta = useMemo(() => asRecord(entity?.meta) || {}, [entity]);
  const entityList = useMemo(() => asRecord(entity?.list) || {}, [entity]);
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
        const uiRel = asRecord(r.ui);
        const uiFields = Array.isArray(uiRel?.fields) ? (uiRel?.fields as any[]) : [];
        return {
          id: `${key}-${idx}`,
          key: String(key),
          kind: r.kind ? String(r.kind) : '',
          persist: persist ? oneLinePretty(persist) : '',
          primary: primary ? oneLinePretty(primary) : '',
          uiTitle: uiRel?.title ? String(uiRel.title) : '',
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

  const metaRoutesColumns = buildTableColumns([
    { key: 'key', label: 'key', sortable: true },
    { key: 'path', label: 'path' },
  ]);
  const breadcrumbsColumns = buildTableColumns([
    { key: 'label', label: 'label', sortable: true },
    { key: 'href', label: 'href' },
  ]);
  const metaActionsColumns = buildTableColumns([
    { key: 'key', label: 'key', sortable: true },
    { key: 'value', label: 'value' },
  ]);
  const headerActionsColumns = buildTableColumns([
    { key: 'kind', label: 'kind', sortable: true },
    { key: 'label', label: 'label' },
    { key: 'actionKey', label: 'actionKey' },
    { key: 'icon', label: 'icon' },
    { key: 'platforms', label: 'platforms' },
    { key: 'visibility', label: 'visibility' },
  ]);
  const listConfigColumns = buildTableColumns([
    { key: 'key', label: 'key', sortable: true },
    { key: 'value', label: 'value' },
  ]);
  const formSectionsColumns = buildTableColumns([
    { key: 'id', label: 'id', sortable: true },
    { key: 'title', label: 'title' },
    { key: 'layout', label: 'layout' },
    { key: 'widget', label: 'widget' },
    { key: 'relation', label: 'relation' },
    { key: 'fields', label: 'fields' },
  ]);
  const relationsColumns = buildTableColumns([
    { key: 'key', label: 'key', sortable: true },
    { key: 'kind', label: 'kind' },
    { key: 'persist', label: 'persist' },
    { key: 'primary', label: 'primary' },
    { key: 'uiTitle', label: 'ui.title' },
    { key: 'fieldCount', label: '# ui fields', sortable: true },
  ]);
  const detailExtrasColumns = buildTableColumns([
    { key: 'kind', label: 'kind', sortable: true },
    { key: 'title', label: 'title' },
    { key: 'entityType', label: 'entityType' },
    { key: 'tableId', label: 'tableId' },
    { key: 'platforms', label: 'platforms' },
    { key: 'query', label: 'query' },
    { key: 'createRoute', label: 'createRoute' },
    { key: 'emptyMessage', label: 'emptyMessage' },
  ]);
  const listColumnsColumns = buildTableColumns([
    { key: 'key', label: 'key', sortable: true },
    { key: 'label', label: 'label' },
    { key: 'filterType', label: 'filterType' },
    { key: 'sortable', label: 'sortable' },
    { key: 'reference', label: 'reference' },
  ]);
  const fieldsColumns = buildTableColumns([
    { key: 'key', label: 'key', sortable: true },
    { key: 'label', label: 'label' },
    { key: 'type', label: 'type' },
    { key: 'required', label: 'required' },
    { key: 'extra', label: 'extra' },
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Card title={`Fields (${fieldsRows.length})`}>
        <DataTable
          columns={fieldsColumns}
          data={fieldsRows}
          loading={false}
          emptyMessage="No fields declared."
          tableId="debug.uiSpecs.fields"
          showColumnVisibility={false}
        />
      </Card>

      <Card title="Meta">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ fontWeight: 600 }}>Routes</div>
          <DataTable
            columns={metaRoutesColumns}
            data={metaRoutesRows.map((r) => ({ id: r.id, key: r.key, path: r.value }))}
            loading={false}
            emptyMessage="No meta.routes declared."
            tableId="debug.uiSpecs.metaRoutes"
            showColumnVisibility={false}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
          <div style={{ fontWeight: 600 }}>Breadcrumbs</div>
          <DataTable
            columns={breadcrumbsColumns}
            data={breadcrumbsRows}
            loading={false}
            emptyMessage="No meta.breadcrumbs declared."
            tableId="debug.uiSpecs.breadcrumbs"
            showColumnVisibility={false}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
          <div style={{ fontWeight: 600 }}>Actions (labels / confirm copy)</div>
          <DataTable
            columns={metaActionsColumns}
            data={metaActionsRows.map((r) => ({ id: r.id, key: r.key, value: r.value }))}
            loading={false}
            emptyMessage="No meta.actions declared."
            tableId="debug.uiSpecs.metaActions"
            showColumnVisibility={false}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
          <div style={{ fontWeight: 600 }}>Header Actions</div>
          <DataTable
            columns={headerActionsColumns}
            data={headerActionsRows}
            loading={false}
            emptyMessage="No meta.headerActions declared."
            tableId="debug.uiSpecs.headerActions"
            showColumnVisibility={false}
          />
        </div>
      </Card>

      <Card title="List Config">
        <DataTable
          columns={listConfigColumns}
          data={listConfigRows.map((r) => ({ id: r.id, key: r.key, value: r.value }))}
          loading={false}
          emptyMessage="No list config declared."
          tableId="debug.uiSpecs.listConfig"
          showColumnVisibility={false}
        />
      </Card>

      <Card title={`List Columns (${listColumnsRows.length})`}>
        <DataTable
          columns={listColumnsColumns}
          data={listColumnsRows}
          loading={false}
          emptyMessage="No list.columns declared."
          tableId="debug.uiSpecs.listColumns"
          showColumnVisibility={false}
        />
      </Card>

      <Card title={`Form Sections (${formSectionsRows.length})`}>
        <DataTable
          columns={formSectionsColumns}
          data={formSectionsRows}
          loading={false}
          emptyMessage="No form.sections declared."
          tableId="debug.uiSpecs.formSections"
          showColumnVisibility={false}
        />
      </Card>

      <Card title={`Relations (${relationsRows.length})`}>
        <DataTable
          columns={relationsColumns}
          data={relationsRows}
          loading={false}
          emptyMessage="No relations declared."
          tableId="debug.uiSpecs.relations"
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
          tableId="debug.uiSpecs.detailExtras"
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
  );
}

export default UiSpecDetailWidget;
