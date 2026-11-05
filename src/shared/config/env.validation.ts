import { plainToInstance } from 'class-transformer';
import {
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  MinLength,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsNumber()
  PORT: number = 3000;

  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @MinLength(16)
  JWT_SECRET!: string;

  // The chat module uses a mock LLM today, so these are optional (keeps deployment simple).
  @IsOptional()
  @IsString()
  LLM_API_KEY?: string;

  @IsOptional()
  @IsString()
  LLM_CHAT_MODEL: string = 'gemini-2.5-flash';

  @IsOptional()
  @IsString()
  LLM_CLASSIFIER_MODEL: string = 'gemini-2.5-flash';

  // Optional demo account created at startup (handy for a reviewer).
  @IsOptional()
  @IsString()
  DEMO_EMAIL?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  DEMO_PASSWORD?: string;

  @IsOptional()
  @IsString()
  DEMO_NAME?: string;
}

export function validateConfig(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, {
    ...config,
    PORT: config.PORT ? Number(config.PORT) : 3000,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const formattedErrors = errors
      .map((err) => Object.values(err.constraints || {}).join(', '))
      .join('; ');
    throw new Error(
      `[ConfigValidationException] Environment configuration failed: ${formattedErrors}`,
    );
  }

  return validatedConfig;
}
