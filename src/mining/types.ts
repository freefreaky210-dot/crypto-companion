// Mining module types (rig monitoring/control)
export type RigStatus = 'MINING' | 'OFFLINE' | 'ERROR' | 'UNKNOWN';
export type PoolId = 'nicehash' | 'braiins' | 'f2pool';

export type Rig = {
  id: string;
  name: string;
  status: RigStatus;
  hashrateHs: number;
  temperatureC?: number;
  powerW?: number;
};

export type MiningStats = {
  pool: string;
  totalHashrateHs: number;
  activeRigs: number;
  totalRigs: number;
  unpaidBtc: number;
  rigs: Rig[];
  fetchedAt: string;
};

export type PoolCredentials = {
  pool: PoolId;
  apiKey: string;
  apiSecret?: string; // NiceHash only
  orgId?: string;     // NiceHash only
  currency?: string;  // F2Pool currency slug, e.g. 'bitcoin'
};
