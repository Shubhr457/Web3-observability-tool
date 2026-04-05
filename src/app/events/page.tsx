'use client';
import { useEffect, useState } from 'react';
import { api, ContractEvent, Paginated } from '@/lib/api';

export default function EventsPage() {
  const [result, setResult]       = useState<Paginated<ContractEvent> | null>(null);
  const [page, setPage]           = useState(1);
  const [contractId, setContractId] = useState('');

  const load = (p: number, cId: string) =>
    api.getEvents({ page: String(p), limit: '25', ...(cId ? { contractId: cId } : {}) })
      .then(setResult)
      .catch(console.error);

  useEffect(() => { load(page, contractId); }, [page, contractId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Events</h1>
        <input
          placeholder="Filter by contract ID"
          value={contractId}
          onChange={e => { setContractId(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Event</th>
              <th className="px-4 py-3 text-left">Block</th>
              <th className="px-4 py-3 text-left">Tx Hash</th>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">Decoded Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {!result && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">Loading…</td></tr>
            )}
            {result?.data.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No events found</td></tr>
            )}
            {result?.data.map(e => (
              <tr key={e._id} className="hover:bg-gray-800/40 transition-colors">
                <td className="px-4 py-3 font-semibold text-indigo-300">{e.eventName}</td>
                <td className="px-4 py-3 text-gray-400">{e.blockNumber.toLocaleString()}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-400 truncate max-w-[160px]">{e.txHash}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(e.timestamp).toLocaleString()}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-400 truncate max-w-xs">
                  {JSON.stringify(e.decodedData)}
                </td>
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
          <span className="px-3 py-1.5 text-sm text-gray-400">
            {page} / {result.pages}
          </span>
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
