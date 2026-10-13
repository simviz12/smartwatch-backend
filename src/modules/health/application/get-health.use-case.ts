import { Inject, Injectable } from '@nestjs/common';
import {
  DatabaseHealthCheckerPort,
  HealthCheckResult,
} from '../domain/health.entity';

export const DATABASE_HEALTH_CHECKER = Symbol('DATABASE_HEALTH_CHECKER');

@Injectable()
export class GetHealthUseCase {
  constructor(
    @Inject(DATABASE_HEALTH_CHECKER)
    private readonly dbChecker: DatabaseHealthCheckerPort,
    private readonly appVersion: string,
  ) {}

  async execute(): Promise<HealthCheckResult> {
    const isDbUp = await this.dbChecker.check();

    return {
      status: isDbUp ? 'ok' : 'degraded',
      service: 'pulso-api',
      version: this.appVersion,
      time: new Date().toISOString(),
      database: isDbUp ? 'up' : 'down',
    };
  }
}
