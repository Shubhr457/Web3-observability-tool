import { ethers } from 'ethers';
import { Types } from 'mongoose';
import { enqueue, EventJob } from '../workers/event.worker';

interface Subscription {
  contractId: Types.ObjectId;
  contractIdStr: string;
  address: string;
  abi: object[];
  handler: ((log: ethers.Log) => void) | null;
}

let provider: ethers.WebSocketProvider | null = null;
const subscriptions = new Map<string, Subscription>();

export async function connectRpc(): Promise<void> {
  const wssUrl = process.env.RPC_WSS_URL;
  if (!wssUrl) {
    console.warn('[RpcService] RPC_WSS_URL not set — listener disabled');
    return;
  }
  try {
    provider = new ethers.WebSocketProvider(wssUrl);
    console.log('[RpcService] WebSocket RPC connected');
    // Re-attach subscriptions (handles reconnect scenario)
    for (const sub of subscriptions.values()) attachListener(sub);
  } catch (err) {
    console.error('[RpcService] connect error:', (err as Error).message);
  }
}

export async function disconnectRpc(): Promise<void> {
  if (provider) {
    await provider.destroy();
    provider = null;
  }
}

export function subscribeContract(
  contractId: Types.ObjectId,
  address: string,
  abi: object[],
): void {
  const key = address.toLowerCase();
  if (subscriptions.has(key)) return;

  const sub: Subscription = {
    contractId,
    contractIdStr: contractId.toString(),
    address: key,
    abi,
    handler: null,
  };
  subscriptions.set(key, sub);

  if (provider) attachListener(sub);
}

export function unsubscribeContract(address: string): void {
  const key = address.toLowerCase();
  const sub = subscriptions.get(key);
  if (!sub) return;

  if (provider && sub.handler) {
    provider.off({ address: sub.address }, sub.handler);
  }
  subscriptions.delete(key);
  console.log(`[RpcService] unsubscribed ${address}`);
}

function attachListener(sub: Subscription): void {
  if (!provider) return;

  const handler = (log: ethers.Log) => {
    const job: EventJob = {
      log,
      contractId: sub.contractId,
      contractIdStr: sub.contractIdStr,
      abi: sub.abi,
      provider: provider!,
    };
    enqueue(job);
  };

  sub.handler = handler;
  provider.on({ address: sub.address }, handler);
  console.log(`[RpcService] subscribed to logs — ${sub.address}`);
}

export function getProvider(): ethers.WebSocketProvider | null {
  return provider;
}
