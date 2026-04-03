import { ethers } from 'ethers';
import { Types } from 'mongoose';
import { EventModel } from '../models/event.model';
import { TransactionModel } from '../models/transaction.model';
import { decodeLog } from '../services/decoder.service';

export interface EventJob {
  log: ethers.Log;
  contractId: Types.ObjectId;
  contractIdStr: string;
  abi: object[];
  provider: ethers.WebSocketProvider;
}

const queue: EventJob[] = [];
let timer: NodeJS.Timeout | null = null;

export function enqueue(job: EventJob): void {
  queue.push(job);
}

export function startWorker(): void {
  if (timer) return;
  timer = setInterval(processNext, 100);
  console.log('[EventWorker] started');
}

export function stopWorker(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

async function processNext(): Promise<void> {
  const job = queue.shift();
  if (!job) return;
  try {
    await processJob(job);
  } catch (err) {
    console.error('[EventWorker] error:', (err as Error).message);
  }
}

async function processJob(job: EventJob): Promise<void> {
  const { log, contractId, contractIdStr, abi, provider } = job;

  const decoded = decodeLog(contractIdStr, abi, log);
  const eventName  = decoded?.eventName  ?? 'Unknown';
  const decodedData = decoded?.decodedData ?? { raw: log.data };

  const block = await provider.getBlock(log.blockNumber);
  const timestamp = block ? new Date(block.timestamp * 1000) : new Date();

  await EventModel.create({
    contractId,
    txHash: log.transactionHash,
    blockNumber: log.blockNumber,
    eventName,
    decodedData,
    timestamp,
  });

  const receipt = await provider.getTransactionReceipt(log.transactionHash);
  if (!receipt) return;

  const exists = await TransactionModel.exists({ txHash: log.transactionHash });
  if (exists) return;

  const tx = await provider.getTransaction(log.transactionHash);

  await TransactionModel.create({
    txHash:      log.transactionHash,
    contractId,
    status:      receipt.status === 1 ? 'success' : 'failed',
    gasUsed:     receipt.gasUsed.toString(),
    gasPrice:    tx?.gasPrice?.toString() ?? '0',
    from:        receipt.from,
    to:          receipt.to ?? '',
    blockNumber: receipt.blockNumber,
    errorReason: receipt.status === 0 ? 'transaction reverted' : '',
    timestamp,
  });
}
