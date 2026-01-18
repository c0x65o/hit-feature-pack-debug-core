'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useUi } from '@hit/ui-kit';
import { Database } from 'lucide-react';
export function DbStats({ onNavigate }) {
    const { Page, Card, Spinner, Alert, Input, Button } = useUi();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [schemaFilter, setSchemaFilter] = useState('');
    const [limit, setLimit] = useState(200);
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = typeof document !== 'undefined'
                ? document.cookie.split(';').find((c) => c.trim().startsWith('hit_token='))?.split('=')[1]
                : null;
            const headers = { 'Content-Type': 'application/json' };
            if (token)
                headers['Authorization'] = `Bearer ${token}`;
            const params = new URLSearchParams();
            if (schemaFilter)
                params.set('schema', schemaFilter);
            params.set('limit', String(limit));
            const res = await fetch(`/api/debug/db-stats?${params.toString()}`, { headers, credentials: 'include' });
            if (!res.ok) {
                throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
            }
            const json = await res.json();
            setData(json);
        }
        catch (err) {
            setError(err?.message || 'Failed to load database stats');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchData();
    }, []);
    const handleRefresh = () => {
        fetchData();
    };
    if (loading && !data) {
        return (_jsx(Page, { title: "Database Stats", icon: Database, children: _jsx("div", { style: { display: 'flex', justifyContent: 'center', padding: '2rem' }, children: _jsx(Spinner, {}) }) }));
    }
    if (error && !data) {
        return (_jsx(Page, { title: "Database Stats", icon: Database, children: _jsx(Alert, { variant: "error", children: error }) }));
    }
    return (_jsx(Page, { title: "Database Stats", icon: Database, children: _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '1.5rem' }, children: [_jsx(Card, { children: _jsxs("div", { style: { display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }, children: [_jsxs("div", { style: { flex: '1 1 200px', minWidth: '150px' }, children: [_jsx("label", { style: { display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', opacity: 0.7 }, children: "Schema Filter" }), _jsx(Input, { value: schemaFilter, onChange: (value) => setSchemaFilter(value), placeholder: "All schemas" })] }), _jsxs("div", { style: { flex: '1 1 150px', minWidth: '100px' }, children: [_jsx("label", { style: { display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', opacity: 0.7 }, children: "Limit" }), _jsx(Input, { type: "number", value: String(limit), onChange: (value) => setLimit(Number.parseInt(value) || 200), min: 1, max: 2000 })] }), _jsx(Button, { onClick: handleRefresh, disabled: loading, children: loading ? 'Loading...' : 'Refresh' })] }) }), error && data && (_jsx(Alert, { variant: "error", children: error })), data && (_jsxs(_Fragment, { children: [_jsxs(Card, { title: "Metadata", children: [_jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "Schema" }), _jsx("div", { style: { fontSize: '1.125rem', fontWeight: 600 }, children: data.schema || 'All' })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "Limit" }), _jsx("div", { style: { fontSize: '1.125rem', fontWeight: 600 }, children: data.limit })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "Tables Shown" }), _jsx("div", { style: { fontSize: '1.125rem', fontWeight: 600 }, children: data.items.length })] })] }), _jsxs("div", { style: { marginTop: '1rem', fontSize: '0.875rem', opacity: 0.6 }, children: [_jsxs("div", { children: ["Row count source: ", data.row_count_source] }), _jsxs("div", { children: ["Estimated row count source: ", data.estimated_row_count_source] })] })] }), _jsx(Card, { title: `Tables (sorted by total size, showing ${data.items.length})`, children: data.items.length === 0 ? (_jsx("div", { style: { padding: '2rem', textAlign: 'center', opacity: 0.6 }, children: "No tables found" })) : (_jsx("div", { style: { overflowX: 'auto' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { borderBottom: '2px solid var(--hit-border)' }, children: [_jsx("th", { style: { textAlign: 'left', padding: '0.75rem', fontWeight: 600 }, children: "Schema" }), _jsx("th", { style: { textAlign: 'left', padding: '0.75rem', fontWeight: 600 }, children: "Table" }), _jsx("th", { style: { textAlign: 'right', padding: '0.75rem', fontWeight: 600 }, children: "Row Count" }), _jsx("th", { style: { textAlign: 'right', padding: '0.75rem', fontWeight: 600 }, children: "Est. Rows" }), _jsx("th", { style: { textAlign: 'right', padding: '0.75rem', fontWeight: 600 }, children: "Table Size" }), _jsx("th", { style: { textAlign: 'right', padding: '0.75rem', fontWeight: 600 }, children: "Indexes Size" }), _jsx("th", { style: { textAlign: 'right', padding: '0.75rem', fontWeight: 600 }, children: "Total Size" }), _jsx("th", { style: { textAlign: 'right', padding: '0.75rem', fontWeight: 600 }, children: "Indexes" })] }) }), _jsx("tbody", { children: data.items.map((item, idx) => (_jsxs("tr", { style: { borderBottom: '1px solid var(--hit-border)' }, children: [_jsx("td", { style: { padding: '0.75rem' }, children: item.schema }), _jsx("td", { style: { padding: '0.75rem', fontWeight: 500 }, children: item.table }), _jsx("td", { style: { padding: '0.75rem', textAlign: 'right' }, children: item.row_count.toLocaleString() }), _jsx("td", { style: { padding: '0.75rem', textAlign: 'right', opacity: 0.7 }, children: item.estimated_row_count.toLocaleString() }), _jsx("td", { style: { padding: '0.75rem', textAlign: 'right' }, children: item.table_size }), _jsx("td", { style: { padding: '0.75rem', textAlign: 'right', opacity: 0.7 }, children: item.indexes_size }), _jsx("td", { style: { padding: '0.75rem', textAlign: 'right', fontWeight: 600 }, children: item.total_size }), _jsx("td", { style: { padding: '0.75rem', textAlign: 'right' }, children: item.index_count })] }, idx))) })] }) })) })] }))] }) }));
}
export default DbStats;
