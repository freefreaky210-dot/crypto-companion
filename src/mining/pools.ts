import { ethers } from 'ethers';
import type { MiningStats, PoolCredentials, Rig } from './types';

// Pool connectors: NiceHash (HMAC v2), Braiins Pool (token header), F2Pool (key query).

// ---------- NiceHash ----------
const NH = 'https://api2.nicehash.com';

function hmac(secret: string, payload: string): string {
  return ethers.computeHmac('sha256',
    ethers.getBytes(ethers.toUtf8Bytes(secret)),
    ethers.getBytes(ethers.toUtf8Bytes(payload)));
}

async function nhFetch(c: PoolCredentials, method: string, path: string, body?: any): Promise<any> {
  const time = Date.now().toString();
  const nonce = ethers.hexlify(ethers.randomBytes(16)).slice(2);
  const requestId = ethers.hexlify(ethers.randomBytes(16)).slice(2);
  const payload = [c.apiKey, time, nonce, '', c.orgId ?? '', '', method, path,
    body ? JSON.stringify(body) : ''].join('\0');
  const res = await fetch(NH + path, {
    method,
    headers: {
      'X-Time': time, 'X-Nonce': nonce, 'X-Organization-Id': c.orgId ?? '',
      'X-Request-Id': requestId, 'X-Auth': `${c.apiKey}:${hmac(c.apiSecret ?? '', payload)}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(`NiceHash ${res.status}`);
  return res.status === 204 ? {} : res.json();
}

export async function nicehashStats(c: PoolCredentials): Promise<MiningStats> {
  const r = await nhFetch(c, 'GET', '/main/api/v2/mining/rigs2');
  const acct = await nhFetch(c, 'GET', '/main/api/v2/accounting/account2/BTC').catch(() => null);
  const rigs: Rig[] = (r.miningRigs ?? []).map((x: any) => ({
    id: x.rigId, name: x.name ?? x.rigId, status: x.minerStatus ?? 'UNKNOWN',
    hashrateHs: (x.devices ?? []).reduce((s: number, d: any) =>
      s + (d.speeds ?? []).reduce((s2: number, sp: any) => s2 + Number(sp.speed ?? 0), 0), 0),
    temperatureC: Math.max(...(x.devices ?? []).map((d: any) => d.temperature ?? 0), 0) || undefined,
    powerW: x.devices?.reduce((s: number, d: any) => s + (d.powerUsage ?? 0), 0) || undefined,
  }));
  return {
    pool: 'NiceHash',
    totalHashrateHs: rigs.reduce((s, r) => s + r.hashrateHs, 0),
    activeRigs: rigs.filter((x) => x.status === 'MINING').length,
    totalRigs: rigs.length,
    unpaidBtc: acct ? Number(acct.available ?? 0) : 0,
    rigs, fetchedAt: new Date().toISOString(),
  };
}

// Rig control (requires write-scoped API key + biometric confirm in UI).
export async function nicehashSetRig(c: PoolCredentials, rigId: string, action: 'START' | 'STOP'): Promise<void> {
  await nhFetch(c, 'POST', '/main/api/v2/mining/rigs/status2', { rigId, action });
}

// ---------- Braiins Pool ----------
export async function braiinsStats(c: PoolCredentials): Promise<MiningStats> {
  const res = await fetch('https://pool.braiins.com/accounts/profile/json/btc/', {
    headers: { 'Pool-Auth-Token': c.apiKey },
  });
  if (!res.ok) throw new Error(`Braiins ${res.status}`);
  const j = await res.json();
  const workers: Rig[] = Object.entries(j.btc?.workers ?? {}).map(([name, w]: any) => ({
    id: name, name,
    status: w.hash_rate_scoring > 0 ? 'MINING' : 'OFFLINE',
    hashrateHs: (w.hash_rate_scoring ?? 0) * 1e9, // Braiins reports GH/s
  }));
  return {
    pool: 'Braiins Pool',
    totalHashrateHs: workers.reduce((s, r) => s + r.hashrateHs, 0),
    activeRigs: workers.filter((r) => r.status === 'MINING').length,
    totalRigs: workers.length,
    unpaidBtc: Number(j.btc?.confirmed_reward ?? 0),
    rigs: workers, fetchedAt: new Date().toISOString(),
  };
}

// ---------- F2Pool ----------
export async function f2poolStats(c: PoolCredentials): Promise<MiningStats> {
  const currency = c.currency ?? 'bitcoin';
  const res = await fetch(
    `https://api.f2pool.com/${currency}/${c.apiKey}` // F2Pool: account name or key in path
  );
  if (!res.ok) throw new Error(`F2Pool ${res.status}`);
  const j = await res.json();
  const workers: Rig[] = (j.workers ?? []).map((w: any) => ({
    id: String(w[0]), name: String(w[0]),
    status: Number(w[2]) > 0 ? 'MINING' : 'OFFLINE',
    hashrateHs: Number(w[2] ?? 0),
  }));
  return {
    pool: 'F2Pool',
    totalHashrateHs: workers.reduce((s, r) => s + r.hashrateHs, 0),
    activeRigs: workers.filter((r) => r.status === 'MINING').length,
    totalRigs: workers.length,
    unpaidBtc: Number(j.balance ?? 0),
    rigs: workers, fetchedAt: new Date().toISOString(),
  };
}

// ---------- Router ----------
export async function getStats(c: PoolCredentials): Promise<MiningStats> {
  if (c.pool === 'nicehash') return nicehashStats(c);
  if (c.pool === 'braiins') return braiinsStats(c);
  return f2poolStats(c);
}

export function getDemoStats(): MiningStats {
  return {
    pool: 'Demo Pool', totalHashrateHs: 112_000_000_000_000, activeRigs: 2, totalRigs: 3,
    unpaidBtc: 0.00042,
    rigs: [
      { id: 'r1', name: 'Rig Alpha (ASIC)', status: 'MINING', hashrateHs: 104e12, temperatureC: 64, powerW: 3250 },
      { id: 'r2', name: 'Rig Beta (GPU x6)', status: 'MINING', hashrateHs: 8e9, temperatureC: 58, powerW: 890 },
      { id: 'r3', name: 'Rig Gamma', status: 'OFFLINE', hashrateHs: 0 },
    ],
    fetchedAt: new Date().toISOString(),
  };
}
