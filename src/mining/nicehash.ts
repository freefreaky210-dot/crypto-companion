import { ethers } from 'ethers';
import type { MiningStats, PoolCredentials, Rig } from './types';

// NiceHash API v2 client — signed HMAC-SHA256 requests.
// Docs: https://www.nicehash.com/docs/rest/
const BASE = 'https://api2.nicehash.com';

function hmacSha256Hex(secretUtf8: string, payloadUtf8: string): string {
  return ethers.computeHmac(
    'sha256',
    ethers.getBytes(ethers.toUtf8Bytes(secretUtf8)),
    ethers.getBytes(ethers.toUtf8Bytes(payloadUtf8))
  );
}

async function nhFetch(creds: PoolCredentials, method: string, path: string, query = ''): Promise<any> {
  const time = Date.now().toString();
  const nonce = ethers.hexlify(ethers.randomBytes(16)).slice(2); // 32-char hex nonce
  const requestId = ethers.hexlify(ethers.randomBytes(16)).slice(2);

  const payload = [
    creds.apiKey, time, nonce, '', creds.orgId, '', method, path, query,
  ].join('\0');

  const res = await fetch(BASE + path + (query ? `?${query}` : ''), {
    method,
    headers: {
      'X-Time': time,
      'X-Nonce': nonce,
      'X-Organization-Id': creds.orgId,
      'X-Request-Id': requestId,
      'X-Auth': `${creds.apiKey}:${hmacSha256Hex(creds.apiSecret, payload)}`,
    },
  });
  if (!res.ok) throw new Error(`NiceHash ${res.status}: ${await res.text()}`);
  return res.json();
}

// Fetches rig overview + unpaid balance and normalizes into MiningStats.
export async function getNiceHashStats(creds: PoolCredentials): Promise<MiningStats> {
  const rigsResp = await nhFetch(creds, 'GET', '/main/api/v2/mining/rigs2');
  const acct = await nhFetch(creds, 'GET', '/main/api/v2/accounting/account2/BTC').catch(() => null);

  const rigs: Rig[] = (rigsResp.miningRigs ?? []).map((r: any) => ({
    id: r.rigId,
    name: r.name ?? r.rigId,
    status: r.minerStatus ?? 'UNKNOWN',
    hashrateHs: (r.devices ?? []).reduce(
      (s: number, d: any) => s + (d.speeds ?? []).reduce((s2: number, sp: any) => s2 + Number(sp.speed ?? 0), 0),
      0
    ),
    temperatureC: Math.max(...(r.devices ?? []).map((d: any) => d.temperature ?? 0), 0) || undefined,
    powerW: r.devices?.reduce((s: number, d: any) => s + (d.powerUsage ?? 0), 0) || undefined,
  }));

  return {
    pool: 'NiceHash',
    totalHashrateHs: rigs.reduce((s, r) => s + r.hashrateHs, 0),
    activeRigs: rigs.filter((r) => r.status === 'MINING').length,
    totalRigs: rigs.length,
    unpaidBtc: acct ? Number(acct.available ?? 0) : 0,
    rigs,
    fetchedAt: new Date().toISOString(),
  };
}

// Demo mode: fake data so the UI can be tested without pool credentials.
export function getDemoStats(): MiningStats {
  return {
    pool: 'Demo Pool',
    totalHashrateHs: 112_000_000_000_000,
    activeRigs: 2,
    totalRigs: 3,
    unpaidBtc: 0.00042,
    rigs: [
      { id: 'r1', name: 'Rig Alpha (ASIC)', status: 'MINING', hashrateHs: 104e12, temperatureC: 64, powerW: 3250 },
      { id: 'r2', name: 'Rig Beta (GPU x6)', status: 'MINING', hashrateHs: 8e9, temperatureC: 58, powerW: 890 },
      { id: 'r3', name: 'Rig Gamma', status: 'OFFLINE', hashrateHs: 0 },
    ],
    fetchedAt: new Date().toISOString(),
  };
}
