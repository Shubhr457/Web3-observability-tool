import { ContractModel } from '../models/contract.model';
import { EventModel } from '../models/event.model';
import { TransactionModel } from '../models/transaction.model';
import { AlertModel } from '../models/alert.model';
import { sendNotification } from './notification.service';
import { getProvider } from './rpc.service';

const FAILED_TX_THRESHOLD    = parseInt(process.env.FAILED_TX_SPIKE_THRESHOLD ?? '3', 10);
const NO_EVENTS_SILENCE_MS   = parseInt(process.env.NO_EVENTS_SILENCE_MS      ?? '300000', 10);
const GAS_SPIKE_MULTIPLIER   = parseFloat(process.env.GAS_SPIKE_MULTIPLIER    ?? '3');

let timer: NodeJS.Timeout | null = null;

export function startAlertEngine(): void {
  if (timer) return;
  timer = setInterval(runChecks, 30_000);
  console.log('[AlertEngine] started (30 s interval)');
}

export function stopAlertEngine(): void {
  if (timer) { clearInterval(timer); timer = null; }
}

async function runChecks(): Promise<void> {
  try {
    await Promise.all([checkFailedTxSpikes(), checkNoEvents(), checkGasSpike()]);
  } catch (err) {
    console.error('[AlertEngine] error:', (err as Error).message);
  }
}

// ── Failed-tx spike: >N failures per contract in the last 5 min ──────────────
async function checkFailedTxSpikes(): Promise<void> {
  const since = new Date(Date.now() - 5 * 60_000);

  const spikes = await TransactionModel.aggregate([
    { $match: { status: 'failed', timestamp: { $gte: since } } },
    { $group: { _id: '$contractId', count: { $sum: 1 } } },
    { $match: { count: { $gte: FAILED_TX_THRESHOLD } } },
  ]);

  for (const spike of spikes) {
    const already = await AlertModel.findOne({
      contractId: spike._id,
      type: 'failed_tx_spike',
      createdAt: { $gte: since },
    });
    if (already) continue;

    await AlertModel.create({
      contractId: spike._id,
      type: 'failed_tx_spike',
      severity: 'high',
      message: `${spike.count} failed transactions in the last 5 minutes`,
      metadata: { count: spike.count, since: since.toISOString() },
    });

    sendNotification({
      type: 'failed_tx_spike',
      severity: 'high',
      message: `Contract ${spike._id}: ${spike.count} failed txs in 5 min`,
      metadata: spike,
    });
  }
}

// ── No-events silence: no events for a monitored contract within threshold ───
async function checkNoEvents(): Promise<void> {
  const contracts = await ContractModel.find({});
  const cutoff    = new Date(Date.now() - NO_EVENTS_SILENCE_MS);

  for (const contract of contracts) {
    const latest = await EventModel.findOne(
      { contractId: contract._id },
      {},
      { sort: { timestamp: -1 } },
    );

    // Newly added contracts or recently active — skip
    if (latest && latest.timestamp > cutoff) continue;
    if (!latest && contract.createdAt > cutoff) continue;

    const already = await AlertModel.findOne({
      contractId: contract._id,
      type: 'no_events',
      createdAt: { $gte: cutoff },
    });
    if (already) continue;

    await AlertModel.create({
      contractId: contract._id,
      type: 'no_events',
      severity: 'medium',
      message: `No events for ${contract.address} in the last ${NO_EVENTS_SILENCE_MS / 60_000} minutes`,
      metadata: { lastEventAt: latest?.timestamp ?? null },
    });
  }
}

// ── Gas spike: recent avg gas > N× 24 h baseline ─────────────────────────────
async function checkGasSpike(): Promise<void> {
  const oneHourAgo       = new Date(Date.now() - 60 * 60_000);
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60_000);
  const contracts        = await ContractModel.find({});

  for (const contract of contracts) {
    const [recent] = await TransactionModel.aggregate([
      { $match: { contractId: contract._id, timestamp: { $gte: oneHourAgo } } },
      { $group: { _id: null, avgGas: { $avg: { $toLong: '$gasUsed' } } } },
    ]);
    const [baseline] = await TransactionModel.aggregate([
      { $match: { contractId: contract._id, timestamp: { $gte: twentyFourHoursAgo, $lt: oneHourAgo } } },
      { $group: { _id: null, avgGas: { $avg: { $toLong: '$gasUsed' } } } },
    ]);

    if (!recent?.avgGas || !baseline?.avgGas) continue;
    if (recent.avgGas < baseline.avgGas * GAS_SPIKE_MULTIPLIER) continue;

    const already = await AlertModel.findOne({
      contractId: contract._id,
      type: 'gas_spike',
      createdAt: { $gte: oneHourAgo },
    });
    if (already) continue;

    await AlertModel.create({
      contractId: contract._id,
      type: 'gas_spike',
      severity: 'medium',
      message: `Gas spike on ${contract.address}: ${Math.round(recent.avgGas).toLocaleString()} avg (${GAS_SPIKE_MULTIPLIER}× baseline)`,
      metadata: { recentAvg: recent.avgGas, baselineAvg: baseline.avgGas },
    });
  }
}
