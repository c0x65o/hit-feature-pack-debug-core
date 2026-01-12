'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useUi } from '@hit/ui-kit';
import { LayoutDashboard } from 'lucide-react';
export function DashboardState({ onNavigate }) {
    const { Page, Card, Spinner, Alert } = useUi();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = typeof document !== 'undefined'
                    ? document.cookie.split(';').find(c => c.trim().startsWith('hit_token='))?.split('=')[1]
                    : null;
                const headers = { 'Content-Type': 'application/json' };
                if (token)
                    headers['Authorization'] = `Bearer ${token}`;
                const res = await fetch('/api/debug/dashboard-state', { headers, credentials: 'include' });
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({ error: res.statusText }));
                    throw new Error(errorData.error || `Failed to fetch: ${res.status} ${res.statusText}`);
                }
                const json = await res.json();
                setData(json);
            }
            catch (err) {
                setError(err?.message || 'Failed to load dashboard state');
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);
    if (loading) {
        return (_jsx(Page, { title: "Dashboard State", icon: LayoutDashboard, children: _jsx("div", { style: { display: 'flex', justifyContent: 'center', padding: '2rem' }, children: _jsx(Spinner, {}) }) }));
    }
    if (error) {
        return (_jsx(Page, { title: "Dashboard State", icon: LayoutDashboard, children: _jsx(Alert, { variant: "error", children: error }) }));
    }
    if (!data) {
        return (_jsx(Page, { title: "Dashboard State", icon: LayoutDashboard, children: _jsx(Alert, { variant: "info", children: "No data available" }) }));
    }
    if (!data.found) {
        return (_jsx(Page, { title: "Dashboard State", icon: LayoutDashboard, children: _jsx(Alert, { variant: "warning", children: "Dashboard not found" }) }));
    }
    return (_jsx(Page, { title: "Dashboard State", icon: LayoutDashboard, children: _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '1.5rem' }, children: [_jsx(Card, { title: "Dashboard Info", children: _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "Key" }), _jsx("div", { style: { fontSize: '1.125rem', fontWeight: 600, fontFamily: 'monospace' }, children: data.key })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "Name" }), _jsx("div", { style: { fontSize: '1.125rem', fontWeight: 600 }, children: data.name })] }), data.description && (_jsxs("div", { style: { gridColumn: '1 / -1' }, children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "Description" }), _jsx("div", { style: { fontSize: '1rem' }, children: data.description })] })), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "Updated" }), _jsx("div", { style: { fontSize: '1rem' }, children: new Date(data.updated_at).toLocaleString() })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "Widget Count" }), _jsx("div", { style: { fontSize: '1.125rem', fontWeight: 600 }, children: data.widget_count })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "Pie Chart Count" }), _jsx("div", { style: { fontSize: '1.125rem', fontWeight: 600 }, children: data.pie_chart_count })] })] }) }), data.pie_charts && data.pie_charts.length > 0 && (_jsx(Card, { title: "Pie Chart Widgets", children: _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem' }, children: data.pie_charts.map((chart, idx) => (_jsxs("div", { style: { padding: '1rem', border: '1px solid var(--hit-border)', borderRadius: '4px' }, children: [_jsx("div", { style: { fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }, children: chart.title }), _jsxs("div", { style: { fontSize: '0.875rem', opacity: 0.7, marginBottom: '0.25rem' }, children: ["Key: ", _jsx("code", { style: { fontSize: '0.875rem' }, children: chart.key })] }), _jsxs("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: ["Endpoint: ", _jsx("code", { style: { fontSize: '0.875rem' }, children: chart.endpoint })] })] }, idx))) }) })), data.all_widget_kinds && data.all_widget_kinds.length > 0 && (_jsx(Card, { title: "Widget Kinds", children: _jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }, children: Array.from(new Set(data.all_widget_kinds)).map((kind, idx) => (_jsx("div", { style: {
                                padding: '0.375rem 0.75rem',
                                backgroundColor: 'var(--hit-muted)',
                                borderRadius: '4px',
                                fontSize: '0.875rem',
                                fontFamily: 'monospace',
                            }, children: kind }, idx))) }) })), data.drizzle_migrations && (_jsx(Card, { title: `Drizzle Migrations (${data.drizzle_migrations.table})`, children: _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.5rem' }, children: data.drizzle_migrations.rows.map((migration, idx) => (_jsx("div", { style: { padding: '0.75rem', border: '1px solid var(--hit-border)', borderRadius: '4px' }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: 500 }, children: migration.hash }), _jsx("div", { style: { fontSize: '0.75rem', opacity: 0.6, marginTop: '0.25rem' }, children: new Date(migration.created_at).toLocaleString() })] }), _jsxs("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: ["#", migration.id] })] }) }, idx))) }) }))] }) }));
}
export default DashboardState;
