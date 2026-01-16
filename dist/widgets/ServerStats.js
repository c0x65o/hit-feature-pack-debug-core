'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useUi } from '@hit/ui-kit';
import { Server } from 'lucide-react';
function formatBytes(bytes) {
    if (bytes === 0)
        return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (days > 0)
        return `${days}d ${hours}h ${mins}m`;
    if (hours > 0)
        return `${hours}h ${mins}m ${secs}s`;
    if (mins > 0)
        return `${mins}m ${secs}s`;
    return `${secs}s`;
}
export function ServerStats({ onNavigate }) {
    const { Page, Card, Spinner, Alert } = useUi();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = typeof document !== 'undefined'
                    ? document.cookie.split(';').find((c) => c.trim().startsWith('hit_token='))?.split('=')[1]
                    : null;
                const headers = { 'Content-Type': 'application/json' };
                if (token)
                    headers['Authorization'] = `Bearer ${token}`;
                const res = await fetch('/api/debug/server-stats', { headers, credentials: 'include' });
                if (!res.ok) {
                    throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
                }
                const json = await res.json();
                setData(json);
            }
            catch (err) {
                setError(err?.message || 'Failed to load server stats');
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);
    if (loading) {
        return (_jsx(Page, { title: "Server Stats", icon: Server, children: _jsx("div", { style: { display: 'flex', justifyContent: 'center', padding: '2rem' }, children: _jsx(Spinner, {}) }) }));
    }
    if (error) {
        return (_jsx(Page, { title: "Server Stats", icon: Server, children: _jsx(Alert, { variant: "error", children: error }) }));
    }
    if (!data) {
        return (_jsx(Page, { title: "Server Stats", icon: Server, children: _jsx(Alert, { variant: "info", children: "No data available" }) }));
    }
    return (_jsx(Page, { title: "Server Stats", icon: Server, children: _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '1.5rem' }, children: [_jsx(Card, { title: "Node.js", children: _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "Version" }), _jsx("div", { style: { fontSize: '1.125rem', fontWeight: 600 }, children: data.node.version })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "PID" }), _jsx("div", { style: { fontSize: '1.125rem', fontWeight: 600 }, children: data.node.pid })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "Uptime" }), _jsx("div", { style: { fontSize: '1.125rem', fontWeight: 600 }, children: formatUptime(data.node.uptime_s) })] })] }) }), _jsx(Card, { title: "Operating System", children: _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "Platform" }), _jsx("div", { style: { fontSize: '1.125rem', fontWeight: 600 }, children: data.os.platform })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "Release" }), _jsx("div", { style: { fontSize: '1.125rem', fontWeight: 600 }, children: data.os.release })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "Architecture" }), _jsx("div", { style: { fontSize: '1.125rem', fontWeight: 600 }, children: data.os.arch })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "Hostname" }), _jsx("div", { style: { fontSize: '1.125rem', fontWeight: 600 }, children: data.os.hostname })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "Uptime" }), _jsx("div", { style: { fontSize: '1.125rem', fontWeight: 600 }, children: formatUptime(data.os.uptime_s) })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "CPUs" }), _jsx("div", { style: { fontSize: '1.125rem', fontWeight: 600 }, children: data.os.cpus ?? '—' })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "Load Average" }), _jsx("div", { style: { fontSize: '1.125rem', fontWeight: 600 }, children: data.os.loadavg_1_5_15.map((v, i) => v.toFixed(2)).join(', ') })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "Total Memory" }), _jsx("div", { style: { fontSize: '1.125rem', fontWeight: 600 }, children: formatBytes(data.os.total_mem_bytes) })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "Free Memory" }), _jsx("div", { style: { fontSize: '1.125rem', fontWeight: 600 }, children: formatBytes(data.os.free_mem_bytes) })] })] }) }), _jsx(Card, { title: "Process Memory", children: _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "RSS" }), _jsx("div", { style: { fontSize: '1.125rem', fontWeight: 600 }, children: formatBytes(data.process_memory_bytes.rss) })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "Heap Total" }), _jsx("div", { style: { fontSize: '1.125rem', fontWeight: 600 }, children: formatBytes(data.process_memory_bytes.heap_total) })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "Heap Used" }), _jsx("div", { style: { fontSize: '1.125rem', fontWeight: 600 }, children: formatBytes(data.process_memory_bytes.heap_used) })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "External" }), _jsx("div", { style: { fontSize: '1.125rem', fontWeight: 600 }, children: formatBytes(data.process_memory_bytes.external) })] }), data.process_memory_bytes.array_buffers !== null && (_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "Array Buffers" }), _jsx("div", { style: { fontSize: '1.125rem', fontWeight: 600 }, children: formatBytes(data.process_memory_bytes.array_buffers) })] }))] }) }), data.disks && data.disks.length > 0 && (_jsx(Card, { title: "Disk Usage", children: _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem' }, children: data.disks.map((disk, idx) => (_jsxs("div", { style: { padding: '1rem', border: '1px solid var(--hit-border)', borderRadius: '4px' }, children: [_jsx("div", { style: { fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }, children: disk.path }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "Total" }), _jsx("div", { style: { fontSize: '1rem', fontWeight: 600 }, children: formatBytes(disk.total_bytes) })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "Used" }), _jsx("div", { style: { fontSize: '1rem', fontWeight: 600 }, children: formatBytes(disk.used_bytes) })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "Free" }), _jsx("div", { style: { fontSize: '1rem', fontWeight: 600 }, children: formatBytes(disk.free_bytes) })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "Available" }), _jsx("div", { style: { fontSize: '1rem', fontWeight: 600 }, children: formatBytes(disk.available_bytes) })] })] })] }, idx))) }) })), data.cgroup && (_jsxs(Card, { title: "Cgroup (Container)", children: [_jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }, children: [data.cgroup.memory_current_bytes !== null && (_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "Memory Current" }), _jsx("div", { style: { fontSize: '1.125rem', fontWeight: 600 }, children: formatBytes(data.cgroup.memory_current_bytes) })] })), data.cgroup.memory_max_bytes !== null && (_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "Memory Max" }), _jsx("div", { style: { fontSize: '1.125rem', fontWeight: 600 }, children: formatBytes(data.cgroup.memory_max_bytes) })] })), data.cgroup.cpu && (_jsxs(_Fragment, { children: [data.cgroup.cpu.quota_us !== null && (_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "CPU Quota (\u03BCs)" }), _jsx("div", { style: { fontSize: '1.125rem', fontWeight: 600 }, children: data.cgroup.cpu.quota_us.toLocaleString() })] })), data.cgroup.cpu.period_us !== null && (_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7 }, children: "CPU Period (\u03BCs)" }), _jsx("div", { style: { fontSize: '1.125rem', fontWeight: 600 }, children: data.cgroup.cpu.period_us.toLocaleString() })] }))] }))] }), data.cgroup.cpu_stat && Object.keys(data.cgroup.cpu_stat).length > 0 && (_jsxs("div", { style: { marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--hit-border)' }, children: [_jsx("div", { style: { fontSize: '0.875rem', opacity: 0.7, marginBottom: '0.5rem' }, children: "CPU Stats" }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }, children: Object.entries(data.cgroup.cpu_stat).map(([key, value]) => (_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.75rem', opacity: 0.6 }, children: key }), _jsx("div", { style: { fontSize: '0.875rem', fontWeight: 600 }, children: value.toLocaleString() })] }, key))) })] }))] })), _jsxs("div", { style: { fontSize: '0.875rem', opacity: 0.6, textAlign: 'right' }, children: ["Last updated: ", new Date(data.now).toLocaleString()] })] }) }));
}
export default ServerStats;
