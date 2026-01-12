'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useUi } from '@hit/ui-kit';
import { ArrowLeft, Table } from 'lucide-react';
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
    // Build form fields rows
    const formFieldsRows = useMemo(() => {
        const form = asRecord(entity?.form) || null;
        const arr = Array.isArray(form?.fields) ? form?.fields : [];
        const filtered = arr.filter((f) => f && typeof f === 'object' && f.key);
        return filtered.map((f, idx) => {
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
            const allow = new Set(mobileKeys.map((k) => String(k)));
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
            const allow = new Set(mobileKeys.map((k) => String(k)));
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
    const formFieldsTableSpec = asRecord(detailSpec.formFields) || {};
    return (_jsx(Page, { title: pageTitle, description: "Drill-in details for a single UI entity spec", icon: Table, breadcrumbs: [
            { label: 'Debug', href: '/admin/debug' },
            { label: 'UI Specs', href: '/admin/debug/ui-specs' },
            { label: entityKey },
        ], actions: _jsxs(Button, { variant: "secondary", onClick: () => navigate('/admin/debug/ui-specs'), children: [_jsx(ArrowLeft, { size: 16, className: "mr-2" }), "Back"] }), children: _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '1.25rem' }, children: [_jsx(Card, { title: "Summary", children: _jsxs("div", { style: {
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                            gap: '0.75rem',
                        }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "tableId" }), _jsx("div", { style: { fontFamily: 'monospace' }, children: tableId })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "drizzleTable" }), _jsx("div", { style: { fontFamily: 'monospace' }, children: drizzleTable })] })] }) }), _jsx(Card, { title: `List Columns (${listColumnsRows.length})`, children: _jsx(DataTable, { columns: listColumnsColumns, data: listColumnsRows, loading: false, emptyMessage: "No list.columns declared.", tableId: String(listColumnsTableSpec.tableId || 'debug.uiSpecs.listColumns'), showColumnVisibility: false }) }), _jsx(Card, { title: `Form Fields (${formFieldsRows.length})`, children: _jsx(DataTable, { columns: formFieldsColumns, data: formFieldsRows, loading: false, emptyMessage: "No form.fields declared.", tableId: String(formFieldsTableSpec.tableId || 'debug.uiSpecs.formFields'), showColumnVisibility: false }) }), _jsxs("details", { style: { border: '1px solid var(--hit-border)', borderRadius: 6, padding: '0.75rem' }, children: [_jsx("summary", { style: { cursor: 'pointer', fontWeight: 600 }, children: "Raw entity JSON" }), _jsx("pre", { style: { marginTop: '0.75rem', whiteSpace: 'pre-wrap', fontSize: '0.875rem' }, children: JSON.stringify(entity, null, 2) })] })] }) }));
}
export default UiSpecsDetail;
