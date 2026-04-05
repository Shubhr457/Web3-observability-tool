'use client';
import { useEffect, useState } from 'react';
import { api, DashboardStats, Alert, ContractEvent } from '@/lib/api';

const severityColor: Record<string, string> = {
  high:   'bg-red-500/20 text-red-300 border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  low:    'bg-blue-500/20 text-blue-300 border-blue-500/30',
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getStats()
      .then(setStats)
      .catch((e) => setError(e.message));

    const id = setInterval(() => {
      api.getStats().then(setStats).catch(() => null);
    }, 15_000);
    return () => clearInterval(id);
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-400">Could not reach API: {error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">
          RPC&nbsp;
          <span className={stats.health === 'connected' ? 'text-green-400' : 'text-red-400'}>
            ● {stats.health}
          </span>
          {stats.lastBlock ? ` — block #${stats.lastBlock.toLocaleString()}` : ''}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Contracts" value={stats.totalContracts} />
        <StatCard label="Total Events" value={stats.totalEvents.toLocaleString()} />
        <StatCard label="Failed Txs" value={stats.failedTx.toLocaleString()} />
        <StatCard label="Alerts" value={stats.totalAlerts.toLocaleString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent alerts */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Recent Alerts</h2>
          {stats.recentAlerts.length === 0 ? (
            <p className="text-gray-500 text-sm">No alerts yet</p>
          ) : (
            <ul className="space-y-2">
              {stats.recentAlerts.map((a: Alert) => (
                <li
                  key={a._id}
                  className={`text-xs rounded-lg border px-3 py-2 ${severityColor[a.severity]}`}
                >
                  <span className="font-semibold capitalize">[{a.type.replace(/_/g, ' ')}]</span>{' '}
                  {a.message}
                  <span className="block text-gray-500 mt-0.5">
                    {new Date(a.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent events */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Recent Events</h2>
          {stats.recentEvents.length === 0 ? (
            <p className="text-gray-500 text-sm">No events yet</p>
          ) : (
            <ul className="space-y-2">
              {stats.recentEvents.map((e: ContractEvent) => (
                <li key={e._id} className="text-xs bg-gray-800/60 rounded-lg px-3 py-2">
                  <span className="font-semibold text-indigo-300">{e.eventName}</span>
                  <span className="ml-2 text-gray-400">block {e.blockNumber}</span>
                  <span className="block text-gray-500 mt-0.5 font-mono truncate">{e.txHash}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
