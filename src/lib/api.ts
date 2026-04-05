const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const TIMEOUT_MS = 8000;

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...init,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? res.statusText);
    }
    return res.json();
  } catch (err: any) {
    if (err.name === 'AbortError') throw new Error('API request timed out');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface Contract {
  _id: string;
  address: string;
  chain: string;
  name: string;
  abi: object[];
  createdAt: string;
}

export interface ContractEvent {
  _id: string;
  contractId: string;
  txHash: string;
  blockNumber: number;
  eventName: string;
  decodedData: Record<string, unknown>;
  timestamp: string;
}

export interface Transaction {
  _id: string;
  txHash: string;
  contractId: string;
  status: 'success' | 'failed';
  gasUsed: string;
  gasPrice: string;
  from: string;
  to: string;
  blockNumber: number;
  errorReason: string;
  timestamp: string;
}

export interface Alert {
  _id: string;
  contractId: string;
  type: 'failed_tx_spike' | 'no_events' | 'gas_spike';
  severity: 'low' | 'medium' | 'high';
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface DashboardStats {
  totalContracts: number;
  totalEvents: number;
  failedTx: number;
  totalAlerts: number;
  lastBlock: number | null;
  health: 'connected' | 'disconnected';
  recentAlerts: Alert[];
  recentEvents: ContractEvent[];
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}

// ── API calls ────────────────────────────────────────────────────────────────

export const api = {
  // Contracts
  getContracts:   () => req<Contract[]>('/contracts'),
  getContract:    (id: string) => req<Contract>(`/contracts/${id}`),
  createContract: (body: Partial<Contract>) =>
    req<Contract>('/contracts', { method: 'POST', body: JSON.stringify(body) }),
  deleteContract: (id: string) =>
    req<{ deleted: boolean }>(`/contracts/${id}`, { method: 'DELETE' }),

  // Events
  getEvents: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return req<Paginated<ContractEvent>>(`/events${qs}`);
  },

  // Transactions
  getTransactions: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return req<Paginated<Transaction>>(`/transactions${qs}`);
  },

  // Alerts
  getAlerts: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return req<Paginated<Alert>>(`/alerts${qs}`);
  },

  // Dashboard
  getStats: () => req<DashboardStats>('/dashboard/stats'),
};
