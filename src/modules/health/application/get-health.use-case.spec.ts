import { DatabaseHealthCheckerPort } from '../domain/health.entity';
import { GetHealthUseCase } from './get-health.use-case';

describe('GetHealthUseCase (Unit)', () => {
  let mockDbChecker: jest.Mocked<DatabaseHealthCheckerPort>;
  let useCase: GetHealthUseCase;
  const version = '0.1.0';

  beforeEach(() => {
    mockDbChecker = {
      check: jest.fn(),
    };
    useCase = new GetHealthUseCase(mockDbChecker, version);
  });

  it('should return status ok and database up when database checker returns true', async () => {
    mockDbChecker.check.mockResolvedValue(true);

    const result = await useCase.execute();

    expect(result).toMatchObject({
      status: 'ok',
      service: 'pulso-api',
      version: '0.1.0',
      database: 'up',
    });
    expect(new Date(result.time).toISOString()).toEqual(result.time);
    expect(mockDbChecker.check).toHaveBeenCalledTimes(1);
  });

  it('should return status degraded and database down when database checker returns false', async () => {
    mockDbChecker.check.mockResolvedValue(false);

    const result = await useCase.execute();

    expect(result).toMatchObject({
      status: 'degraded',
      service: 'pulso-api',
      version: '0.1.0',
      database: 'down',
    });
    expect(new Date(result.time).toISOString()).toEqual(result.time);
    expect(mockDbChecker.check).toHaveBeenCalledTimes(1);
  });
});
