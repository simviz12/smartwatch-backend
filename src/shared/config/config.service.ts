import * as dotenv from 'dotenv';
import { EnvironmentVariables, validateConfig } from './env.validation';

dotenv.config();

export const config: EnvironmentVariables = validateConfig(process.env);
