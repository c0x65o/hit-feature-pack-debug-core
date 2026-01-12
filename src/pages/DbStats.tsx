'use client';

import React, { useState, useEffect } from 'react';
import { useUi } from '@hit/ui-kit';
import { Database } from 'lucide-react';

interface DbStatsItem {
  schema: string;
  table: string;
  row_count: number;
  estimated_row_count: number;
  table_bytes: number;
  indexes_bytes: number;
  total_bytes: number;
  table_size: string;
  indexes_size: string;
  total_size: string;
  index_count: number;
}

interface DbStatsData {
  schema: string | null;
  limit: number;
  row_count_source: string;
  estimated_row_count_source: string;
  items: DbStatsItem[];
}

interface DbStatsProps {
  onNavigate?: (path: string) => void;
}

export function DbStats({ onNavigate }: DbStatsProps) {
  const { Page, Card, Spinner, Alert, Input, Button } = useUi();
  const [data, setData] = useState<DbStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schemaFilter, setSchemaFilter] = useState<string>('');
  const [limit, setLimit] = useState<number>(200);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof document !== 'undefined' 
        ? document.cookie.split(';').find(c => c.trim().startsWith('hit_token='))?.split('=')[1]
        : null;
      
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const params = new URLSearchParams();
      if (schemaFilter) params.set('schema', schemaFilter);
      params.set('limit', String(limit));

      const res = await fetch(`/api/debug/db-stats?${params.toString()}`, { headers, credentials: 'include' });
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err?.message || 'Failed to load database stats');
    } finally {
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
    return (
      <Page title="Database Stats" icon={Database}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Spinner />
        </div>
      </Page>
    );
  }

  if (error && !data) {
    return (
      <Page title="Database Stats" icon={Database}>
        <Alert variant="error">{error}</Alert>
      </Page>
    );
  }

  return (
    <Page title="Database Stats" icon={Database}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Card>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px', minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', opacity: 0.7 }}>
                Schema Filter
              </label>
              <Input
                value={schemaFilter}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSchemaFilter(e.target.value)}
                placeholder="All schemas"
              />
            </div>
            <div style={{ flex: '1 1 150px', minWidth: '100px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', opacity: 0.7 }}>
                Limit
              </label>
              <Input
                type="number"
                value={limit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLimit(Number.parseInt(e.target.value) || 200)}
                min={1}
                max={2000}
              />
            </div>
            <Button onClick={handleRefresh} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </Card>

        {error && data && (
          <Alert variant="error">{error}</Alert>
        )}

        {data && (
          <>
            <Card title="Metadata">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Schema</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{data.schema || 'All'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Limit</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{data.limit}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Tables Shown</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{data.items.length}</div>
                </div>
              </div>
              <div style={{ marginTop: '1rem', fontSize: '0.875rem', opacity: 0.6 }}>
                <div>Row count source: {data.row_count_source}</div>
                <div>Estimated row count source: {data.estimated_row_count_source}</div>
              </div>
            </Card>

            <Card title={`Tables (sorted by total size, showing ${data.items.length})`}>
              {data.items.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.6 }}>
                  No tables found
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--hit-border)' }}>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: 600 }}>Schema</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: 600 }}>Table</th>
                        <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: 600 }}>Row Count</th>
                        <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: 600 }}>Est. Rows</th>
                        <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: 600 }}>Table Size</th>
                        <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: 600 }}>Indexes Size</th>
                        <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: 600 }}>Total Size</th>
                        <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: 600 }}>Indexes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--hit-border)' }}>
                          <td style={{ padding: '0.75rem' }}>{item.schema}</td>
                          <td style={{ padding: '0.75rem', fontWeight: 500 }}>{item.table}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>{item.row_count.toLocaleString()}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', opacity: 0.7 }}>
                            {item.estimated_row_count.toLocaleString()}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>{item.table_size}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', opacity: 0.7 }}>{item.indexes_size}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>{item.total_size}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>{item.index_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </Page>
  );
}

export default DbStats;
