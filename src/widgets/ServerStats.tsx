'use client';

import React, { useState, useEffect } from 'react';
import { useUi } from '@hit/ui-kit';
import { Server } from 'lucide-react';

interface ServerStatsData {
  now: string;
  node: {
    version: string;
    pid: number;
    uptime_s: number;
  };
  os: {
    platform: string;
    release: string;
    arch: string;
    hostname: string;
    uptime_s: number;
    loadavg_1_5_15: number[];
    cpus: number | null;
    total_mem_bytes: number;
    free_mem_bytes: number;
  };
  process_memory_bytes: {
    rss: number;
    heap_total: number;
    heap_used: number;
    external: number;
    array_buffers: number | null;
  };
  disks: Array<{
    path: string;
    total_bytes: number;
    used_bytes: number;
    free_bytes: number;
    available_bytes: number;
  }>;
  cgroup: {
    memory_current_bytes: number | null;
    memory_max_bytes: number | null;
    cpu: {
      quota_us: number | null;
      period_us: number | null;
    } | null;
    cpu_stat: Record<string, number> | null;
  } | null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

interface ServerStatsProps {
  onNavigate?: (path: string) => void;
}

export function ServerStats({ onNavigate }: ServerStatsProps) {
  const { Page, Card, Spinner, Alert } = useUi();
  const [data, setData] = useState<ServerStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token =
          typeof document !== 'undefined'
            ? document.cookie.split(';').find((c) => c.trim().startsWith('hit_token='))?.split('=')[1]
            : null;

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/debug/server-stats', { headers, credentials: 'include' });
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err?.message || 'Failed to load server stats');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Page title="Server Stats" icon={Server}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Spinner />
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Server Stats" icon={Server}>
        <Alert variant="error">{error}</Alert>
      </Page>
    );
  }

  if (!data) {
    return (
      <Page title="Server Stats" icon={Server}>
        <Alert variant="info">No data available</Alert>
      </Page>
    );
  }

  return (
    <Page title="Server Stats" icon={Server}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Card title="Node.js">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Version</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{data.node.version}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>PID</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{data.node.pid}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Uptime</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{formatUptime(data.node.uptime_s)}</div>
            </div>
          </div>
        </Card>

        <Card title="Operating System">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Platform</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{data.os.platform}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Release</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{data.os.release}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Architecture</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{data.os.arch}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Hostname</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{data.os.hostname}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Uptime</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{formatUptime(data.os.uptime_s)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>CPUs</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{data.os.cpus ?? '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Load Average</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                {data.os.loadavg_1_5_15.map((v, i) => v.toFixed(2)).join(', ')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Total Memory</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{formatBytes(data.os.total_mem_bytes)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Free Memory</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{formatBytes(data.os.free_mem_bytes)}</div>
            </div>
          </div>
        </Card>

        <Card title="Process Memory">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>RSS</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{formatBytes(data.process_memory_bytes.rss)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Heap Total</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{formatBytes(data.process_memory_bytes.heap_total)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Heap Used</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{formatBytes(data.process_memory_bytes.heap_used)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>External</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{formatBytes(data.process_memory_bytes.external)}</div>
            </div>
            {data.process_memory_bytes.array_buffers !== null && (
              <div>
                <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Array Buffers</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{formatBytes(data.process_memory_bytes.array_buffers)}</div>
              </div>
            )}
          </div>
        </Card>

        {data.disks && data.disks.length > 0 && (
          <Card title="Disk Usage">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.disks.map((disk, idx) => (
                <div key={idx} style={{ padding: '1rem', border: '1px solid var(--hit-border)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{disk.path}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Total</div>
                      <div style={{ fontSize: '1rem', fontWeight: 600 }}>{formatBytes(disk.total_bytes)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Used</div>
                      <div style={{ fontSize: '1rem', fontWeight: 600 }}>{formatBytes(disk.used_bytes)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Free</div>
                      <div style={{ fontSize: '1rem', fontWeight: 600 }}>{formatBytes(disk.free_bytes)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Available</div>
                      <div style={{ fontSize: '1rem', fontWeight: 600 }}>{formatBytes(disk.available_bytes)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {data.cgroup && (
          <Card title="Cgroup (Container)">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {data.cgroup.memory_current_bytes !== null && (
                <div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Memory Current</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{formatBytes(data.cgroup.memory_current_bytes)}</div>
                </div>
              )}
              {data.cgroup.memory_max_bytes !== null && (
                <div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Memory Max</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{formatBytes(data.cgroup.memory_max_bytes)}</div>
                </div>
              )}
              {data.cgroup.cpu && (
                <>
                  {data.cgroup.cpu.quota_us !== null && (
                    <div>
                      <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>CPU Quota (μs)</div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{data.cgroup.cpu.quota_us.toLocaleString()}</div>
                    </div>
                  )}
                  {data.cgroup.cpu.period_us !== null && (
                    <div>
                      <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>CPU Period (μs)</div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{data.cgroup.cpu.period_us.toLocaleString()}</div>
                    </div>
                  )}
                </>
              )}
            </div>
            {data.cgroup.cpu_stat && Object.keys(data.cgroup.cpu_stat).length > 0 && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--hit-border)' }}>
                <div style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '0.5rem' }}>CPU Stats</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
                  {Object.entries(data.cgroup.cpu_stat).map(([key, value]) => (
                    <div key={key}>
                      <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{key}</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{(value as number).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        <div style={{ fontSize: '0.875rem', opacity: 0.6, textAlign: 'right' }}>
          Last updated: {new Date(data.now).toLocaleString()}
        </div>
      </div>
    </Page>
  );
}

export default ServerStats;
