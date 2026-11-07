import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../services/api';
import type { LogsResponse } from '../types';

export default function AdminLogsPage() {
  const [data, setData] = useState<LogsResponse>({ logs: [], total: 0, page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getLogs(page).then(setData).catch((err) => setError(getErrorMessage(err)));
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
          <tbody>
            {data.logs.map((log) => (
              <tr key={log._id}>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
                <td>{log.user?.email || '-'}</td>
                <td><code>{log.action}</code></td>
                <td>{log.details || '-'}</td>
                <td>{log.ipAddress || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
        <span>Page {data.page} of {data.pages || 1}</span>
        <button className="btn-secondary" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}