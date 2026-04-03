import { ethers } from 'ethers';

const ifaceCache = new Map<string, ethers.Interface>();

export function decodeLog(
  contractId: string,
  abi: object[],
  log: ethers.Log,
): { eventName: string; decodedData: Record<string, unknown> } | null {
  try {
    if (!ifaceCache.has(contractId)) {
      ifaceCache.set(contractId, new ethers.Interface(abi as ethers.InterfaceAbi));
    }
    const iface = ifaceCache.get(contractId)!;
    const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
    if (!parsed) return null;

    const decodedData: Record<string, unknown> = {};
    parsed.fragment.inputs.forEach((input, idx) => {
      const val = parsed.args[idx];
      decodedData[input.name] = typeof val === 'bigint' ? val.toString() : val;
    });

    return { eventName: parsed.name, decodedData };
  } catch {
    return null;
  }
}

export function invalidateCache(contractId: string): void {
  ifaceCache.delete(contractId);
}
