import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetHealthUseCase } from '../application/get-health.use-case';
import { HealthCheckResult } from '../domain/health.entity';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly getHealthUseCase: GetHealthUseCase) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieve service and database health status' })
  @ApiOkResponse({
    description: 'Service health check response',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        service: { type: 'string', example: 'pulso-api' },
        version: { type: 'string', example: '0.1.0' },
        time: { type: 'string', example: '2026-10-13T01:40:00.000Z' },
        database: { type: 'string', example: 'up' },
      },
    },
  })
  async getHealth(): Promise<HealthCheckResult> {
    return this.getHealthUseCase.execute();
  }
}
