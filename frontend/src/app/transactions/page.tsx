'use client';
import { useEffect, useState } from 'react';
import { api, Transaction, Paginated } from '@/lib/api';

const statusBadge = (s: string) =>
  s === 'success'
    ? 'bg-green-500/20 text-green-300 border-green-500/30'
    : 'bg-red-500/20 text-red-300 border-red-500/30';

export default function TransactionsPage() {
  const [result, setResult] = useState<Paginated<Transaction> | null>(null);
  const [page, setPage]     = useState(1);
  const [status, setStatus] = useState('');

  const load = (p: number, s: string) =>
    api.getTransactions({ page: String(p), limit: '25', ...(s ? { status: s } : {}) })
      .then(setResult)
      .catch(console.error);

  useEffect(() => { load(page, status); }, [page, status]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Transactions</h1>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Tx Hash</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Block</th>
              <th className="px-4 py-3 text-left">Gas Used</th>
              <th className="px-4 py-3 text-left">From</th>
              <th className="px-4 py-3 text-left">Error</th>
              <th className="px-4 py-3 text-left">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {!result && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">Loading…</td></tr>
            )}
            {result?.data.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">No transactions found</td></tr>
            )}
            {result?.data.map(t => (
              <tr key={t._id} className="hover:bg-gray-800/40 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-400 truncate max-w-[140px]">{t.txHash}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium border px-2 py-0.5 rounded-full ${statusBadge(t.status)}`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">{t.blockNumber?.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-400">{Number(t.gasUsed).toLocaleString()}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500 truncate max-w-[120px]">{t.from}</td>
                <td className="px-4 py-3 text-red-400 text-xs truncate max-w-[160px]">{t.errorReason || '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(t.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
