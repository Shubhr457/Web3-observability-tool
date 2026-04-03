# Web3 Observability Tool

On-chain contract monitoring dashboard — Node.js + MongoDB + Next.js.

## Architecture

```
Blockchain RPC (WebSocket)
        ↓
RPC Service (ethers filtered log subscription)
        ↓
In-Memory Queue / Event Worker (100 ms loop)
        ↓
MongoDB  ←──  Alert Engine (30 s interval)
        ↓                ↓
  REST API          Notification stub
        ↓
  Next.js Dashboard
```

## Stack

| Layer     | Tech                          |
|-----------|-------------------------------|
| Backend   | Node.js + Express + TypeScript |
| Database  | MongoDB via Mongoose           |
| Chain     | ethers v6 (WebSocket RPC)      |
| Frontend  | Next.js 15 (App Router) + Tailwind CSS |

## Project layout

```
.
├── backend/
│   └── src/
│       ├── index.ts                   ← Express app + bootstrap
│       ├── models/                    ← Mongoose models
│       ├── modules/                   ← Express routers per feature
│       │   ├── contracts/
│       │   ├── events/
│       │   ├── transactions/
│       │   ├── alerts/
│       │   └── dashboard/
│       ├── services/
│       │   ├── rpc.service.ts         ← ethers WebSocket listener
│       │   ├── decoder.service.ts     ← ABI log decoder
│       │   ├── alert-engine.service.ts← 30 s alert checks
│       │   └── notification.service.ts← stub notifier
│       └── workers/
│           └── event.worker.ts        ← in-memory queue processor
└── frontend/
    └── src/app/
        ├── page.tsx                   ← Dashboard overview
        ├── contracts/                 ← Add / remove contracts
        ├── events/                    ← Decoded log explorer
        ├── transactions/              ← Tx table with failed filter
        └── alerts/                    ← Alert timeline
```

## Quick start

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- An EVM WebSocket RPC URL (Infura, Alchemy, etc.)

### Backend

```bash
cd backend
cp .env.example .env          # fill in MONGODB_URI and RPC_WSS_URL
npm install
npm run dev                   # ts-node watch, port 3001
```

### Frontend

```bash
cd frontend
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:3001
npm install
npm run dev                   # Next.js dev server, port 3000
```

## API endpoints

| Method | Path                 | Description                    |
|--------|----------------------|--------------------------------|
| POST   | /contracts           | Add contract + start listener  |
| GET    | /contracts           | List all monitored contracts   |
| DELETE | /contracts/:id       | Remove contract + stop listener|
| GET    | /events              | Decoded event log explorer     |
| GET    | /transactions        | Transaction history (filterable by status) |
| GET    | /alerts              | Alert timeline                 |
| GET    | /dashboard/stats     | Aggregated stats + health      |
| GET    | /health              | Liveness check                 |

All list endpoints support `?page=1&limit=20` pagination.

## Alert types

| Type              | Trigger                                   | Severity |
|-------------------|-------------------------------------------|----------|
| `failed_tx_spike` | > 3 failed txs in 5 minutes per contract  | high     |
| `no_events`       | No events for > 5 minutes per contract    | medium   |
| `gas_spike`       | Recent avg gas > 3× 24-hour baseline      | medium   |

Thresholds are configurable via `.env` (`FAILED_TX_SPIKE_THRESHOLD`, `NO_EVENTS_SILENCE_MS`, `GAS_SPIKE_MULTIPLIER`).
