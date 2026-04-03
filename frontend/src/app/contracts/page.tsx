'use client';
import { useEffect, useState } from 'react';
import { api, Contract } from '@/lib/api';

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [address, setAddress] = useState('');
  const [chain, setChain]     = useState('mainnet');
  const [name, setName]       = useState('');
  const [abi, setAbi]         = useState('');
  const [error, setError]     = useState('');
  const [adding, setAdding]   = useState(false);

  const load = () => api.getContracts().then(setContracts).catch(() => null);

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAdding(true);
    try {
      let parsedAbi: object[] = [];
      if (abi.trim()) parsedAbi = JSON.parse(abi);
      await api.createContract({ address, chain, name, abi: parsedAbi });
      setAddress(''); setChain('mainnet'); setName(''); setAbi('');
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this contract and stop monitoring?')) return;
    await api.deleteContract(id);
    await load();
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Contracts</h1>

      {/* Add form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-xl">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Add Contract</h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <input
            required
            placeholder="0x contract address"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-2">
            <input
              required
              placeholder="Chain (e.g. mainnet)"
              value={chain}
              onChange={e => setChain(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              placeholder="Label (optional)"
              value={name}
              onChange={e => setName(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <textarea
            rows={3}
            placeholder='ABI JSON (optional) — paste [...] array'
            value={abi}
            onChange={e => setAbi(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 placeholder-gray-500 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={adding}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {adding ? 'Adding…' : 'Add & Monitor'}
          </button>
        </form>
      </div>

      {/* Contracts list */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Address</th>
              <th className="px-4 py-3 text-left">Label</th>
              <th className="px-4 py-3 text-left">Chain</th>
              <th className="px-4 py-3 text-left">Added</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {contracts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  No contracts yet — add one above
                </td>
              </tr>
            )}
            {contracts.map(c => (
              <tr key={c._id} className="hover:bg-gray-800/40 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-indigo-300 truncate max-w-xs">{c.address}</td>
                <td className="px-4 py-3 text-gray-300">{c.name || '—'}</td>
                <td className="px-4 py-3 text-gray-400">{c.chain}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(c._id)}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
