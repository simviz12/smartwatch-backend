export type DatabaseStatus = 'up' | 'down';

export interface HealthCheckResult {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  time: string;
  database: DatabaseStatus;
}

export interface DatabaseHealthCheckerPort {
  check(): Promise<boolean>;
}
