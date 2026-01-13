'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useUi } from '@hit/ui-kit';
import { Table } from 'lucide-react';
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
export function UiSpecsList({ onNavigate }) {
    const { Page, Card, DataTable, Alert, Spinner } = useUi();
    const [specs, setSpecs] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
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
    // Get the UI spec for this entity (debug.uiSpec) to drive columns
    const entitySpec = useMemo(() => {
        const e = specs?.entities?.['debug.uiSpec'];
        return e && typeof e === 'object' ? e : null;
    }, [specs]);
    const listSpec = useMemo(() => {
        const list = asRecord(entitySpec?.list);
        return list || {};
    }, [entitySpec]);
    const meta = useMemo(() => {
        return asRecord(entitySpec?.meta) || {};
    }, [entitySpec]);
    // Build rows from all entities in the spec
    const rows = useMemo(() => {
        const entities = specs?.entities && typeof specs.entities === 'object' ? specs.entities : {};
        const out = [];
        for (const entityKey of Object.keys(entities || {}).sort()) {
            const entity = asRecord(entities?.[entityKey]) || {};
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
            out.push({
                id: entityKey, // use entityKey as ID
                entityKey,
                drizzleTable,
                tableId,
                listColumnCount: listColumns.length,
                fieldCount,
                formSectionCount: formSections.length,
                relationCount,
                headerActionCount,
                detailExtrasCount,
            });
        }
        return out;
    }, [specs]);
    // Build columns from the spec, with fallback
    const columns = useMemo(() => {
        const specCols = normalizeColumns(listSpec.columns);
        const fallback = [
            { key: 'entityKey', label: 'Entity', sortable: true, filterType: 'string' },
            { key: 'tableId', label: 'tableId', sortable: true, filterType: 'string' },
            { key: 'drizzleTable', label: 'drizzleTable', sortable: true, filterType: 'string' },
            { key: 'listColumnCount', label: '# list cols', sortable: true, filterType: 'number' },
            { key: 'fieldCount', label: '# fields', sortable: true, filterType: 'number' },
        ];
        let cols = specCols.length > 0 ? specCols : fallback;
        // Filter for mobile
        if (isMobile) {
            cols = cols.filter((c) => String(c.key) !== 'actions').slice(0, 3);
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
        return (_jsx(Page, { title: pageTitle, icon: Table, children: _jsx("div", { style: { display: 'flex', justifyContent: 'center', padding: '2rem' }, children: _jsx(Spinner, {}) }) }));
    }
    if (error) {
        return (_jsx(Page, { title: pageTitle, icon: Table, children: _jsx(Alert, { variant: "error", children: error }) }));
    }
    return (_jsx(Page, { title: pageTitle, description: pageDescription, icon: Table, children: _jsx(Card, { children: _jsx(DataTable, { columns: columns, data: rows, loading: false, emptyMessage: "No UI specs found in /hit-ui-specs.json", onRowClick: (row) => {
                    navigate(`/admin/debug/ui-specs/${encodeURIComponent(String(row.entityKey))}`);
                }, tableId: String(listSpec.tableId || 'debug.uiSpecs'), showColumnVisibility: !isMobile, initialColumnVisibility: listSpec.initialColumnVisibility, initialSorting: listSpec.initialSorting }) }) }));
}
export default UiSpecsList;
