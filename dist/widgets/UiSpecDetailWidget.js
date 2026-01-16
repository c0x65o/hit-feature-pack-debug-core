'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
function asRecord(v) {
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
}
function oneLine(v) {
    if (v === null)
        return 'null';
    if (v === undefined)
        return '—';
    if (typeof v === 'string')
        return v;
    if (typeof v === 'number' || typeof v === 'boolean')
        return String(v);
    try {
        return JSON.stringify(v);
    }
    catch {
        return String(v);
    }
}
function oneLinePretty(v) {
    const s = oneLine(v);
    return s.length > 180 ? `${s.slice(0, 180)}…` : s;
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
function buildTableColumns(fallback) {
    return fallback.map((c) => ({
        key: String(c.key),
        label: c.label ? String(c.label) : String(c.key),
        sortable: c.sortable !== false,
    }));
}
export function UiSpecDetailWidget({ record, ui }) {
    const { Card, DataTable, Alert } = ui;
    const entity = asRecord(record?.spec) || null;
    if (!entity) {
        return (_jsx(Alert, { variant: "warning", title: "Missing spec data", children: "This UI spec record does not include a `spec` payload." }));
    }
    const entityMeta = useMemo(() => asRecord(entity?.meta) || {}, [entity]);
    const entityList = useMemo(() => asRecord(entity?.list) || {}, [entity]);
    const entityForm = useMemo(() => asRecord(entity?.form) || {}, [entity]);
    const entityRelations = useMemo(() => asRecord(entity?.relations) || {}, [entity]);
    const entityDetail = useMemo(() => asRecord(entity?.detail) || {}, [entity]);
    const metaRoutesRows = useMemo(() => {
        const routes = asRecord(entityMeta.routes) || null;
        const entries = routes ? Object.entries(routes) : [];
        return entries.map(([k, v], idx) => ({
            id: `${k}-${idx}`,
            key: String(k),
            value: typeof v === 'string' ? v : oneLinePretty(v),
        }));
    }, [entityMeta]);
    const breadcrumbsRows = useMemo(() => {
        const crumbs = Array.isArray(entityMeta.breadcrumbs) ? entityMeta.breadcrumbs : [];
        return crumbs
            .filter((c) => c && typeof c === 'object')
            .map((c, idx) => ({
            id: `${idx}`,
            label: c?.label ? String(c.label) : '',
            href: c?.href ? String(c.href) : '',
        }));
    }, [entityMeta]);
    const metaActionsRows = useMemo(() => {
        const actions = asRecord(entityMeta.actions) || null;
        const entries = actions ? Object.entries(actions) : [];
        return entries.map(([k, v], idx) => ({
            id: `${k}-${idx}`,
            key: String(k),
            value: typeof v === 'string' ? v : oneLinePretty(v),
        }));
    }, [entityMeta]);
    const headerActionsRows = useMemo(() => {
        const actions = Array.isArray(entityMeta.headerActions) ? entityMeta.headerActions : [];
        return actions
            .filter((a) => a && typeof a === 'object')
            .map((a, idx) => ({
            id: `${idx}`,
            kind: a?.kind ? String(a.kind) : '',
            label: a?.label ? String(a.label) : '',
            actionKey: a?.actionKey ? String(a.actionKey) : '',
            icon: a?.icon ? String(a.icon) : '',
            platforms: Array.isArray(a?.platforms) ? a.platforms.map(String).join(', ') : '',
            visibility: a?.visibility ? oneLinePretty(a.visibility) : '',
        }));
    }, [entityMeta]);
    const listConfigRows = useMemo(() => {
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
            value: oneLinePretty(list[k]),
        }));
    }, [entityList]);
    const formSectionsRows = useMemo(() => {
        const sections = Array.isArray(entityForm?.sections) ? entityForm.sections : [];
        return sections
            .filter((s) => s && typeof s === 'object')
            .map((s, idx) => ({
            id: s?.id ? String(s.id) : String(idx),
            title: s?.title ? String(s.title) : '',
            layout: s?.layout ? oneLinePretty(s.layout) : '',
            widget: s?.widget ? String(s.widget) : '',
            relation: s?.relation ? String(s.relation) : '',
            fields: Array.isArray(s?.fields) ? s.fields.map(String).join(', ') : '',
        }));
    }, [entityForm]);
    const relationsRows = useMemo(() => {
        const rels = entityRelations || {};
        const entries = Object.entries(rels);
        return entries
            .filter(([, v]) => v && typeof v === 'object')
            .map(([key, v], idx) => {
            const r = asRecord(v) || {};
            const persist = asRecord(r.persist);
            const primary = asRecord(r.primary);
            const uiRel = asRecord(r.ui);
            const uiFields = Array.isArray(uiRel?.fields) ? uiRel?.fields : [];
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
    const detailExtrasRows = useMemo(() => {
        const extras = Array.isArray(entityDetail?.extras) ? entityDetail.extras : [];
        return extras
            .filter((e) => e && typeof e === 'object')
            .map((e, idx) => ({
            id: `${idx}`,
            kind: e?.kind ? String(e.kind) : '',
            title: e?.title ? String(e.title) : '',
            entityType: e?.entityType ? String(e.entityType) : '',
            tableId: e?.tableId ? String(e.tableId) : '',
            platforms: Array.isArray(e?.platforms) ? e.platforms.map(String).join(', ') : '',
            query: e?.query ? oneLinePretty(e.query) : '',
            createRoute: e?.createRoute ? String(e.createRoute) : '',
            emptyMessage: e?.emptyMessage ? String(e.emptyMessage) : '',
        }));
    }, [entityDetail]);
    const listColumnsRows = useMemo(() => {
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
    const fieldsRows = useMemo(() => {
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
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '1.25rem' }, children: [_jsx(Card, { title: `Fields (${fieldsRows.length})`, children: _jsx(DataTable, { columns: fieldsColumns, data: fieldsRows, loading: false, emptyMessage: "No fields declared.", tableId: "debug.uiSpecs.fields", showColumnVisibility: false }) }), _jsxs(Card, { title: "Meta", children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem' }, children: [_jsx("div", { style: { fontWeight: 600 }, children: "Routes" }), _jsx(DataTable, { columns: metaRoutesColumns, data: metaRoutesRows.map((r) => ({ id: r.id, key: r.key, path: r.value })), loading: false, emptyMessage: "No meta.routes declared.", tableId: "debug.uiSpecs.metaRoutes", showColumnVisibility: false })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }, children: [_jsx("div", { style: { fontWeight: 600 }, children: "Breadcrumbs" }), _jsx(DataTable, { columns: breadcrumbsColumns, data: breadcrumbsRows, loading: false, emptyMessage: "No meta.breadcrumbs declared.", tableId: "debug.uiSpecs.breadcrumbs", showColumnVisibility: false })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }, children: [_jsx("div", { style: { fontWeight: 600 }, children: "Actions (labels / confirm copy)" }), _jsx(DataTable, { columns: metaActionsColumns, data: metaActionsRows.map((r) => ({ id: r.id, key: r.key, value: r.value })), loading: false, emptyMessage: "No meta.actions declared.", tableId: "debug.uiSpecs.metaActions", showColumnVisibility: false })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }, children: [_jsx("div", { style: { fontWeight: 600 }, children: "Header Actions" }), _jsx(DataTable, { columns: headerActionsColumns, data: headerActionsRows, loading: false, emptyMessage: "No meta.headerActions declared.", tableId: "debug.uiSpecs.headerActions", showColumnVisibility: false })] })] }), _jsx(Card, { title: "List Config", children: _jsx(DataTable, { columns: listConfigColumns, data: listConfigRows.map((r) => ({ id: r.id, key: r.key, value: r.value })), loading: false, emptyMessage: "No list config declared.", tableId: "debug.uiSpecs.listConfig", showColumnVisibility: false }) }), _jsx(Card, { title: `List Columns (${listColumnsRows.length})`, children: _jsx(DataTable, { columns: listColumnsColumns, data: listColumnsRows, loading: false, emptyMessage: "No list.columns declared.", tableId: "debug.uiSpecs.listColumns", showColumnVisibility: false }) }), _jsx(Card, { title: `Form Sections (${formSectionsRows.length})`, children: _jsx(DataTable, { columns: formSectionsColumns, data: formSectionsRows, loading: false, emptyMessage: "No form.sections declared.", tableId: "debug.uiSpecs.formSections", showColumnVisibility: false }) }), _jsxs(Card, { title: `Relations (${relationsRows.length})`, children: [_jsx(DataTable, { columns: relationsColumns, data: relationsRows, loading: false, emptyMessage: "No relations declared.", tableId: "debug.uiSpecs.relations", showColumnVisibility: false }), relationsRows.length > 0 ? (_jsx("div", { style: { marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }, children: relationsRows.map((r) => {
                            const relAny = asRecord(entityRelations?.[r.key]) || {};
                            return (_jsxs("details", { style: { border: '1px solid var(--hit-border)', borderRadius: 6, padding: '0.75rem' }, children: [_jsxs("summary", { style: { cursor: 'pointer', fontWeight: 600 }, children: [r.key, " (", r.kind, ")"] }), _jsx("pre", { style: { marginTop: '0.75rem', whiteSpace: 'pre-wrap', fontSize: '0.875rem' }, children: JSON.stringify(relAny, null, 2) })] }, r.id));
                        }) })) : null] }), _jsxs(Card, { title: `Detail Extras (${detailExtrasRows.length})`, children: [_jsx(DataTable, { columns: detailExtrasColumns, data: detailExtrasRows, loading: false, emptyMessage: "No detail.extras declared.", tableId: "debug.uiSpecs.detailExtras", showColumnVisibility: false }), detailExtrasRows.length > 0 ? (_jsxs("details", { style: { marginTop: '1rem', border: '1px solid var(--hit-border)', borderRadius: 6, padding: '0.75rem' }, children: [_jsx("summary", { style: { cursor: 'pointer', fontWeight: 600 }, children: "Raw detail JSON" }), _jsx("pre", { style: { marginTop: '0.75rem', whiteSpace: 'pre-wrap', fontSize: '0.875rem' }, children: JSON.stringify(entityDetail, null, 2) })] })) : null] }), _jsxs("details", { style: { border: '1px solid var(--hit-border)', borderRadius: 6, padding: '0.75rem' }, children: [_jsx("summary", { style: { cursor: 'pointer', fontWeight: 600 }, children: "Raw entity JSON" }), _jsx("pre", { style: { marginTop: '0.75rem', whiteSpace: 'pre-wrap', fontSize: '0.875rem' }, children: JSON.stringify(entity, null, 2) })] })] }));
}
export default UiSpecDetailWidget;
