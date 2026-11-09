import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../services/api';
import type { LogsResponse } from '../types';

export default function AdminLogsPage() {
  const [data, setData] = useState<LogsResponse>({ logs: [], total: 0, page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api.getLogs(page)
      .then(setData)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="card">
      <h1>Usage Logs</h1>
      {error && <p className="error">{error}</p>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Time</th><th>User</th><th>Action</th><th>Details</th><th>IP</th></tr>
          </thead>
          <tbody aria-busy={loading}>
            {loading
              ? Array.from({ length: 8 }, (_, index) => (
                  <tr key={`skeleton-${index}`} aria-hidden="true">
                    <td><span className="block h-4 w-36 animate-pulse rounded bg-[var(--border)]" /></td>
                    <td><span className="block h-4 w-40 animate-pulse rounded bg-[var(--border)]" /></td>
                    <td><span className="block h-4 w-24 animate-pulse rounded bg-[var(--border)]" /></td>
                    <td><span className="block h-4 w-48 animate-pulse rounded bg-[var(--border)]" /></td>
                    <td><span className="block h-4 w-28 animate-pulse rounded bg-[var(--border)]" /></td>
                  </tr>
                ))
              : data.logs.map((log) => (
              <tr key={log._id}>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
                <td>{log.user?.email || '-'}</td>
                <td><code>{log.action}</code></td>
                <td>{log.details || '-'}</td>
                <td>{log.ipAddress || '-'}</td>
              </tr>
            ))}
            {!loading && !error && data.logs.length === 0 && (
              <tr><td colSpan={5} className="text-center text-[var(--muted)]">No usage logs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <button className="btn-secondary" disabled={loading || page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
        <span>Page {data.page} of {data.pages || 1}</span>
        <button className="btn-secondary" disabled={loading || page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}