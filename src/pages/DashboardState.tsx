'use client';

import React, { useState, useEffect } from 'react';
import { useUi } from '@hit/ui-kit';
import { LayoutDashboard } from 'lucide-react';

interface DashboardStateData {
  found: boolean;
  key: string;
  name: string;
  description: string | null;
  updated_at: string;
  widget_count: number;
  pie_chart_count: number;
  pie_charts: Array<{
    key: string;
    title: string;
    endpoint: string;
  }>;
  all_widget_kinds: string[];
  drizzle_migrations: {
    table: string;
    rows: Array<{
      id: number;
      hash: string;
      created_at: string;
    }>;
  } | null;
}

interface DashboardStateProps {
  onNavigate?: (path: string) => void;
}

export function DashboardState({ onNavigate }: DashboardStateProps) {
  const { Page, Card, Spinner, Alert } = useUi();
  const [data, setData] = useState<DashboardStateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = typeof document !== 'undefined' 
          ? document.cookie.split(';').find(c => c.trim().startsWith('hit_token='))?.split('=')[1]
          : null;
        
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/debug/dashboard-state', { headers, credentials: 'include' });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(errorData.error || `Failed to fetch: ${res.status} ${res.statusText}`);
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err?.message || 'Failed to load dashboard state');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Page title="Dashboard State" icon={LayoutDashboard}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Spinner />
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Dashboard State" icon={LayoutDashboard}>
        <Alert variant="error">{error}</Alert>
      </Page>
    );
  }

  if (!data) {
    return (
      <Page title="Dashboard State" icon={LayoutDashboard}>
        <Alert variant="info">No data available</Alert>
      </Page>
    );
  }

  if (!data.found) {
    return (
      <Page title="Dashboard State" icon={LayoutDashboard}>
        <Alert variant="warning">Dashboard not found</Alert>
      </Page>
    );
  }

  return (
    <Page title="Dashboard State" icon={LayoutDashboard}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Card title="Dashboard Info">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Key</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600, fontFamily: 'monospace' }}>{data.key}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Name</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{data.name}</div>
            </div>
            {data.description && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Description</div>
                <div style={{ fontSize: '1rem' }}>{data.description}</div>
              </div>
            )}
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Updated</div>
              <div style={{ fontSize: '1rem' }}>{new Date(data.updated_at).toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Widget Count</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{data.widget_count}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Pie Chart Count</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{data.pie_chart_count}</div>
            </div>
          </div>
        </Card>

        {data.pie_charts && data.pie_charts.length > 0 && (
          <Card title="Pie Chart Widgets">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.pie_charts.map((chart, idx) => (
                <div key={idx} style={{ padding: '1rem', border: '1px solid var(--hit-border)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{chart.title}</div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '0.25rem' }}>
                    Key: <code style={{ fontSize: '0.875rem' }}>{chart.key}</code>
                  </div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                    Endpoint: <code style={{ fontSize: '0.875rem' }}>{chart.endpoint}</code>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {data.all_widget_kinds && data.all_widget_kinds.length > 0 && (
          <Card title="Widget Kinds">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {Array.from(new Set(data.all_widget_kinds)).map((kind, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.375rem 0.75rem',
                    backgroundColor: 'var(--hit-muted)',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                  }}
                >
                  {kind}
                </div>
              ))}
            </div>
          </Card>
        )}

        {data.drizzle_migrations && (
          <Card title={`Drizzle Migrations (${data.drizzle_migrations.table})`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.drizzle_migrations.rows.map((migration, idx) => (
                <div key={idx} style={{ padding: '0.75rem', border: '1px solid var(--hit-border)', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: 500 }}>
                        {migration.hash}
                      </div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.25rem' }}>
                        {new Date(migration.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>#{migration.id}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Page>
  );
}

export default DashboardState;
