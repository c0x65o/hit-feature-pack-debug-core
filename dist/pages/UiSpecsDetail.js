'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useUi } from '@hit/ui-kit';
import { ArrowLeft, Table } from 'lucide-react';
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
    // avoid runaway cells in tables
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
function extractEntityKeyFromPath() {
    if (typeof window === 'undefined')
        return '';
    const parts = window.location.pathname.split('/').filter(Boolean);
    const idx = parts.findIndex((p) => p === 'ui-specs');
    if (idx < 0)
        return '';
    const entity = parts[idx + 1] || '';
    try {
        return decodeURIComponent(entity);
    }
    catch {
        return entity;
    }
}
export function UiSpecsDetail({ onNavigate }) {
    const { Page, Card, Button, DataTable, Alert, Spinner } = useUi();
    const [specs, setSpecs] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const entityKey = useMemo(() => extractEntityKeyFromPath(), []);
    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
            return;
        const mql = window.matchMedia('(max-width: 640px)');
        const onChange = () => setIsMobile(Boolean(mql.matches));
        onChange();
        try {
            mql.addEventListener('change', onChange);
            return () => mql.removeEventListener('change', onChange);
        }
        catch {
            mql.addListener(onChange);
            return () => mql.removeListener(onChange);
        }
    }, []);
    const navigate = (path) => {
        if (onNavigate)
            onNavigate(path);
        else if (typeof window !== 'undefined')
            window.location.href = path;
    };
    useEffect(() => {
        const fetchSpecs = async () => {
            try {
                const res = await fetch('/hit-ui-specs.json', { method: 'GET' });
                if (!res.ok)
                    throw new Error(`Failed to fetch /hit-ui-specs.json (${res.status})`);
                const json = await res.json();
                const parsed = json && typeof json === 'object' ? json : {};
                setSpecs(parsed);
            }
            catch (err) {
                setError(err?.message || 'Failed to load UI specs');
            }
            finally {
                setLoading(false);
            }
        };
        fetchSpecs();
    }, []);
    // Get the debug.uiSpec entity for meta/detail config
    const debugSpec = useMemo(() => {
        const e = specs?.entities?.['debug.uiSpec'];
        return e && typeof e === 'object' ? e : null;
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
        return e && typeof e === 'object' ? e : null;
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
            const ui = asRecord(r.ui);
            const uiFields = Array.isArray(ui?.fields) ? ui?.fields : [];
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
    // Build list columns rows
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
    // Build fields rows (canonical entities.<key>.fields map)
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
    function buildTableColumns(tableKey, fallback) {
        const tableSpec = asRecord(detailSpec?.[tableKey]) || {};
        const specCols = normalizeColumns(tableSpec.columns);
        const mobileKeys = tableSpec.mobileColumnKeys;
        let cols = specCols.length > 0 ? specCols : fallback;
        if (isMobile && Array.isArray(mobileKeys) && mobileKeys.length > 0) {
            const allow = new Set(mobileKeys.map((k) => String(k)));
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
        return (_jsx(Page, { title: "UI Spec", icon: Table, children: _jsx("div", { style: { display: 'flex', justifyContent: 'center', padding: '2rem' }, children: _jsx(Spinner, {}) }) }));
    }
    if (error) {
        return (_jsx(Page, { title: "UI Spec", icon: Table, children: _jsx(Alert, { variant: "error", children: error }) }));
    }
    if (!entityKey) {
        return (_jsx(Page, { title: "UI Spec", icon: Table, children: _jsx(Alert, { variant: "error", children: "Missing entityKey in URL." }) }));
    }
    if (!entity) {
        return (_jsxs(Page, { title: `UI Spec: ${entityKey}`, icon: Table, children: [_jsx(Alert, { variant: "warning", children: "Entity not found in /hit-ui-specs.json." }), _jsx("div", { style: { marginTop: '1rem' }, children: _jsxs(Button, { variant: "secondary", onClick: () => navigate('/admin/debug/ui-specs'), children: [_jsx(ArrowLeft, { size: 16, className: "mr-2" }), "Back to list"] }) })] }));
    }
    const tableId = asRecord(entity.list)?.tableId ? String(asRecord(entity.list)?.tableId) : '—';
    const drizzleTable = asRecord(entity.storage)?.drizzleTable ? String(asRecord(entity.storage)?.drizzleTable) : '—';
    const listColumnsTableSpec = asRecord(detailSpec.listColumns) || {};
    const fieldsTableSpec = asRecord(detailSpec.fields) || {};
    const metaRoutesTableSpec = asRecord(detailSpec.metaRoutes) || {};
    const breadcrumbsTableSpec = asRecord(detailSpec.breadcrumbs) || {};
    const metaActionsTableSpec = asRecord(detailSpec.metaActions) || {};
    const headerActionsTableSpec = asRecord(detailSpec.headerActions) || {};
    const listConfigTableSpec = asRecord(detailSpec.listConfig) || {};
    const formSectionsTableSpec = asRecord(detailSpec.formSections) || {};
    const relationsTableSpec = asRecord(detailSpec.relations) || {};
    const detailExtrasTableSpec = asRecord(detailSpec.detailExtras) || {};
    const metaRoutesColumns = buildTableColumns('metaRoutes', [
        { key: 'key', label: 'key', sortable: true },
        { key: 'path', label: 'path' },
    ]);
    const breadcrumbsColumns = buildTableColumns('breadcrumbs', [
        { key: 'label', label: 'label', sortable: true },
        { key: 'href', label: 'href' },
    ]);
    const metaActionsColumns = buildTableColumns('metaActions', [
        { key: 'key', label: 'key', sortable: true },
        { key: 'value', label: 'value' },
    ]);
    const headerActionsColumns = buildTableColumns('headerActions', [
        { key: 'kind', label: 'kind', sortable: true },
        { key: 'label', label: 'label' },
        { key: 'actionKey', label: 'actionKey' },
        { key: 'icon', label: 'icon' },
        { key: 'platforms', label: 'platforms' },
        { key: 'visibility', label: 'visibility' },
    ]);
    const listConfigColumns = buildTableColumns('listConfig', [
        { key: 'key', label: 'key', sortable: true },
        { key: 'value', label: 'value' },
    ]);
    const formSectionsColumns = buildTableColumns('formSections', [
        { key: 'id', label: 'id', sortable: true },
        { key: 'title', label: 'title' },
        { key: 'layout', label: 'layout' },
        { key: 'widget', label: 'widget' },
        { key: 'relation', label: 'relation' },
        { key: 'fields', label: 'fields' },
    ]);
    const relationsColumns = buildTableColumns('relations', [
        { key: 'key', label: 'key', sortable: true },
        { key: 'kind', label: 'kind' },
        { key: 'persist', label: 'persist' },
        { key: 'primary', label: 'primary' },
        { key: 'uiTitle', label: 'ui.title' },
        { key: 'fieldCount', label: '# ui fields', sortable: true },
    ]);
    const detailExtrasColumns = buildTableColumns('detailExtras', [
        { key: 'kind', label: 'kind', sortable: true },
        { key: 'title', label: 'title' },
        { key: 'entityType', label: 'entityType' },
        { key: 'tableId', label: 'tableId' },
        { key: 'platforms', label: 'platforms' },
        { key: 'query', label: 'query' },
        { key: 'createRoute', label: 'createRoute' },
        { key: 'emptyMessage', label: 'emptyMessage' },
    ]);
    return (_jsx(Page, { title: pageTitle, description: "Drill-in details for a single UI entity spec", icon: Table, breadcrumbs: [
            { label: 'Debug', href: '/admin/debug' },
            { label: 'UI Specs', href: '/admin/debug/ui-specs' },
            { label: entityKey },
        ], actions: _jsxs(Button, { variant: "secondary", onClick: () => navigate('/admin/debug/ui-specs'), children: [_jsx(ArrowLeft, { size: 16, className: "mr-2" }), "Back"] }), children: _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '1.25rem' }, children: [_jsx(Card, { title: "Summary", children: _jsxs("div", { style: {
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                            gap: '0.75rem',
                        }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "tableId" }), _jsx("div", { style: { fontFamily: 'monospace' }, children: tableId })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "drizzleTable" }), _jsx("div", { style: { fontFamily: 'monospace' }, children: drizzleTable })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "routes" }), _jsx("div", { style: { fontFamily: 'monospace' }, children: metaRoutesRows.length > 0 ? `${metaRoutesRows.length} defined` : '—' })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "form / relations / extras" }), _jsxs("div", { style: { fontFamily: 'monospace' }, children: [formSectionsRows.length, " sections \u00B7 ", relationsRows.length, " relations \u00B7 ", detailExtrasRows.length, " extras"] })] })] }) }), _jsx(Card, { title: `Fields (${fieldsRows.length})`, children: _jsx(DataTable, { columns: fieldsColumns, data: fieldsRows, loading: false, emptyMessage: "No fields declared.", tableId: String(fieldsTableSpec.tableId || 'debug.uiSpecs.fields'), showColumnVisibility: false }) }), _jsx(Card, { title: "Meta", children: _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem' }, children: [_jsxs("div", { style: {
                                    display: 'grid',
                                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                                    gap: '0.75rem',
                                }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "titleSingular" }), _jsx("div", { style: { fontFamily: 'monospace' }, children: entityMeta.titleSingular ? String(entityMeta.titleSingular) : '—' })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "titlePlural" }), _jsx("div", { style: { fontFamily: 'monospace' }, children: entityMeta.titlePlural ? String(entityMeta.titlePlural) : '—' })] })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem' }, children: [_jsx("div", { style: { fontWeight: 600 }, children: "Routes" }), _jsx(DataTable, { columns: metaRoutesColumns, data: metaRoutesRows.map((r) => ({ id: r.id, key: r.key, path: r.value })), loading: false, emptyMessage: "No meta.routes declared.", tableId: String(metaRoutesTableSpec.tableId || 'debug.uiSpecs.metaRoutes'), showColumnVisibility: false })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem' }, children: [_jsx("div", { style: { fontWeight: 600 }, children: "Breadcrumbs" }), _jsx(DataTable, { columns: breadcrumbsColumns, data: breadcrumbsRows, loading: false, emptyMessage: "No meta.breadcrumbs declared.", tableId: String(breadcrumbsTableSpec.tableId || 'debug.uiSpecs.breadcrumbs'), showColumnVisibility: false })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem' }, children: [_jsx("div", { style: { fontWeight: 600 }, children: "Actions (labels / confirm copy)" }), _jsx(DataTable, { columns: metaActionsColumns, data: metaActionsRows.map((r) => ({ id: r.id, key: r.key, value: r.value })), loading: false, emptyMessage: "No meta.actions declared.", tableId: String(metaActionsTableSpec.tableId || 'debug.uiSpecs.metaActions'), showColumnVisibility: false })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem' }, children: [_jsx("div", { style: { fontWeight: 600 }, children: "Header Actions" }), _jsx(DataTable, { columns: headerActionsColumns, data: headerActionsRows, loading: false, emptyMessage: "No meta.headerActions declared.", tableId: String(headerActionsTableSpec.tableId || 'debug.uiSpecs.headerActions'), showColumnVisibility: false })] })] }) }), _jsx(Card, { title: "List Config", children: _jsx(DataTable, { columns: listConfigColumns, data: listConfigRows.map((r) => ({ id: r.id, key: r.key, value: r.value })), loading: false, emptyMessage: "No list config declared.", tableId: String(listConfigTableSpec.tableId || 'debug.uiSpecs.listConfig'), showColumnVisibility: false }) }), _jsx(Card, { title: `List Columns (${listColumnsRows.length})`, children: _jsx(DataTable, { columns: listColumnsColumns, data: listColumnsRows, loading: false, emptyMessage: "No list.columns declared.", tableId: String(listColumnsTableSpec.tableId || 'debug.uiSpecs.listColumns'), showColumnVisibility: false }) }), _jsx(Card, { title: `Form Sections (${formSectionsRows.length})`, children: _jsx(DataTable, { columns: formSectionsColumns, data: formSectionsRows, loading: false, emptyMessage: "No form.sections declared.", tableId: String(formSectionsTableSpec.tableId || 'debug.uiSpecs.formSections'), showColumnVisibility: false }) }), _jsxs(Card, { title: `Relations (${relationsRows.length})`, children: [_jsx(DataTable, { columns: relationsColumns, data: relationsRows, loading: false, emptyMessage: "No relations declared.", tableId: String(relationsTableSpec.tableId || 'debug.uiSpecs.relations'), showColumnVisibility: false }), relationsRows.length > 0 ? (_jsx("div", { style: { marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }, children: relationsRows.map((r) => {
                                const relAny = asRecord(entityRelations?.[r.key]) || {};
                                return (_jsxs("details", { style: { border: '1px solid var(--hit-border)', borderRadius: 6, padding: '0.75rem' }, children: [_jsxs("summary", { style: { cursor: 'pointer', fontWeight: 600 }, children: [r.key, " (", r.kind, ")"] }), _jsx("pre", { style: { marginTop: '0.75rem', whiteSpace: 'pre-wrap', fontSize: '0.875rem' }, children: JSON.stringify(relAny, null, 2) })] }, r.id));
                            }) })) : null] }), _jsxs(Card, { title: `Detail Extras (${detailExtrasRows.length})`, children: [_jsx(DataTable, { columns: detailExtrasColumns, data: detailExtrasRows, loading: false, emptyMessage: "No detail.extras declared.", tableId: String(detailExtrasTableSpec.tableId || 'debug.uiSpecs.detailExtras'), showColumnVisibility: false }), detailExtrasRows.length > 0 ? (_jsxs("details", { style: { marginTop: '1rem', border: '1px solid var(--hit-border)', borderRadius: 6, padding: '0.75rem' }, children: [_jsx("summary", { style: { cursor: 'pointer', fontWeight: 600 }, children: "Raw detail JSON" }), _jsx("pre", { style: { marginTop: '0.75rem', whiteSpace: 'pre-wrap', fontSize: '0.875rem' }, children: JSON.stringify(entityDetail, null, 2) })] })) : null] }), _jsxs("details", { style: { border: '1px solid var(--hit-border)', borderRadius: 6, padding: '0.75rem' }, children: [_jsx("summary", { style: { cursor: 'pointer', fontWeight: 600 }, children: "Raw entity JSON" }), _jsx("pre", { style: { marginTop: '0.75rem', whiteSpace: 'pre-wrap', fontSize: '0.875rem' }, children: JSON.stringify(entity, null, 2) })] })] }) }));
}
export default UiSpecsDetail;
