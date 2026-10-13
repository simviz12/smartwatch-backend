import { Injectable } from '@nestjs/common';
import { DatabaseHealthCheckerPort } from '../domain/health.entity';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';

@Injectable()
export class PrismaDatabaseHealthChecker implements DatabaseHealthCheckerPort {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
