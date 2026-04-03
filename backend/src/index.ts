import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import contractsRouter    from './modules/contracts/contracts.routes';
import eventsRouter       from './modules/events/events.routes';
import transactionsRouter from './modules/transactions/transactions.routes';
import alertsRouter       from './modules/alerts/alerts.routes';
import dashboardRouter    from './modules/dashboard/dashboard.routes';

import { connectRpc, disconnectRpc, subscribeContract } from './services/rpc.service';
import { startWorker, stopWorker }                      from './workers/event.worker';
import { startAlertEngine, stopAlertEngine }            from './services/alert-engine.service';
import { ContractModel }                                from './models/contract.model';

const app  = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use('/contracts',    contractsRouter);
app.use('/events',       eventsRouter);
app.use('/transactions', transactionsRouter);
app.use('/alerts',       alertsRouter);
app.use('/dashboard',    dashboardRouter);

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', ts: new Date().toISOString() })
);

async function bootstrap(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI is required');

  await mongoose.connect(mongoUri);
  console.log('[DB] MongoDB connected');

  startWorker();

  await connectRpc();

  // Re-subscribe all persisted contracts on startup
  const contracts = await ContractModel.find({});
  for (const c of contracts) {
    subscribeContract(c._id, c.address, c.abi);
  }
  if (contracts.length) {
    console.log(`[Bootstrap] re-subscribed ${contracts.length} contract(s)`);
  }

  startAlertEngine();

  app.listen(PORT, () => {
    console.log(`[API] Web3 Observability running → http://localhost:${PORT}`);
  });
}

process.on('SIGTERM', async () => {
  console.log('[Shutdown] graceful shutdown...');
  stopWorker();
  stopAlertEngine();
  await disconnectRpc();
  await mongoose.disconnect();
  process.exit(0);
});

bootstrap().catch((err) => {
  console.error('[Bootstrap] fatal:', err);
  process.exit(1);
});
