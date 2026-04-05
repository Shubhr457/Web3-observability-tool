'use client';
import { useEffect, useState } from 'react';
import { api, Alert, Paginated } from '@/lib/api';

const severityStyle: Record<string, string> = {
  high:   'border-red-500/50 bg-red-500/10',
  medium: 'border-yellow-500/50 bg-yellow-500/10',
  low:    'border-blue-500/50 bg-blue-500/10',
};

const severityBadge: Record<string, string> = {
  high:   'bg-red-500/20 text-red-300 border border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  low:    'bg-blue-500/20 text-blue-300 border border-blue-500/30',
};

const typeLabel: Record<string, string> = {
  failed_tx_spike: 'Failed Tx Spike',
  no_events:       'No Events',
  gas_spike:       'Gas Spike',
};

export default function AlertsPage() {
  const [result, setResult]   = useState<Paginated<Alert> | null>(null);
  const [page, setPage]       = useState(1);
  const [severity, setSeverity] = useState('');

  const load = (p: number, s: string) =>
    api.getAlerts({ page: String(p), limit: '20', ...(s ? { severity: s } : {}) })
      .then(setResult)
      .catch(console.error);

  useEffect(() => { load(page, severity); }, [page, severity]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Alerts</h1>
        <select
          value={severity}
          onChange={e => { setSeverity(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All severities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {!result && (
          <p className="text-gray-500 text-sm py-8 text-center">Loading…</p>
        )}
        {result?.data.length === 0 && (
          <p className="text-gray-500 text-sm py-8 text-center">No alerts — system is healthy</p>
        )}
        {result?.data.map(a => (
          <div
            key={a._id}
            className={`border rounded-xl px-5 py-4 ${severityStyle[a.severity]}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${severityBadge[a.severity]}`}>
                    {a.severity}
                  </span>
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                    {typeLabel[a.type] ?? a.type}
                  </span>
                </div>
                <p className="text-sm text-gray-200 mt-1">{a.message}</p>
                {Object.keys(a.metadata).length > 0 && (
                  <pre className="text-xs text-gray-500 mt-1 font-mono whitespace-pre-wrap">
                    {JSON.stringify(a.metadata, null, 2)}
                  </pre>
                )}
              </div>
              <time className="text-xs text-gray-500 whitespace-nowrap shrink-0">
                {new Date(a.createdAt).toLocaleString()}
              </time>
            </div>
          </div>
        ))}
      </div>

      {result && result.pages > 1 && (
        <div className="flex gap-2 justify-end">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-40 rounded-lg text-white transition-colors"
          >
            ← Prev
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-400">{page} / {result.pages}</span>
          <button
            disabled={page >= result.pages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-40 rounded-lg text-white transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
