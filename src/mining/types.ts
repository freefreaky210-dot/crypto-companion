// Mining module types (rig monitoring/control — Phase: mining integration)
export type RigStatus = 'MINING' | 'OFFLINE' | 'ERROR' | 'UNKNOWN';

export type Rig = {
  id: string;
  name: string;
  status: RigStatus;
  hashrateHs: number; // hashes per second
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
  fetchedAt: string; // ISO time (offline transparency, SPEC 9.4)
};

export type PoolCredentials = {
  apiKey: string;
  apiSecret: string;
  orgId: string;
};
