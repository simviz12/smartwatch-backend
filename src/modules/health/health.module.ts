import { Module } from '@nestjs/common';
import { HealthController } from './presentation/health.controller';
import {
  DATABASE_HEALTH_CHECKER,
  GetHealthUseCase,
} from './application/get-health.use-case';
import { PrismaDatabaseHealthChecker } from './infrastructure/prisma-database-health-checker';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import * as packageJson from '../../../package.json';

@Module({
  controllers: [HealthController],
  providers: [
    PrismaService,
    {
      provide: DATABASE_HEALTH_CHECKER,
      useClass: PrismaDatabaseHealthChecker,
    },
    {
      provide: GetHealthUseCase,
      useFactory: (checker: PrismaDatabaseHealthChecker) => {
        return new GetHealthUseCase(checker, packageJson.version || '0.1.0');
      },
      inject: [DATABASE_HEALTH_CHECKER],
    },
  ],
  exports: [GetHealthUseCase],
})
export class HealthModule {}
