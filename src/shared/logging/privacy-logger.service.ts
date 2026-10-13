import { Injectable, LoggerService } from '@nestjs/common';

export interface LogMetadata {
  requestId?: string;
  userId?: string;
  chatId?: string;
  statusCode?: number;
  durationMs?: number;
  count?: number;
  riskLevel?: 'none' | 'low' | 'medium' | 'high' | 'crisis';
  [key: string]: unknown;
}

@Injectable()
export class PrivacyLogger implements LoggerService {
  private static readonly FORBIDDEN_KEYS = [
    'body',
    'text',
    'message',
    'content',
    'prompt',
    'messages',
    'password',
    'token',
    'authorization',
    'secret',
    'key',
    'apiKey',
  ];

  public lastLoggedMessages: string[] = [];

  log(message: unknown, ...optionalParams: unknown[]) {
    this.writeLog('INFO', message, optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]) {
    this.writeLog('ERROR', message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]) {
    this.writeLog('WARN', message, optionalParams);
  }

  debug?(message: unknown, ...optionalParams: unknown[]) {
    this.writeLog('DEBUG', message, optionalParams);
  }

  verbose?(message: unknown, ...optionalParams: unknown[]) {
    this.writeLog('VERBOSE', message, optionalParams);
  }

  private writeLog(level: string, message: unknown, params: unknown[]) {
    const sanitizedParams = params.map((param) => this.sanitize(param));
    const sanitizedMessage =
      typeof message === 'string' ? message : this.sanitize(message);

    const logEntry = `[${new Date().toISOString()}] [${level}] ${
      typeof sanitizedMessage === 'object'
        ? JSON.stringify(sanitizedMessage)
        : sanitizedMessage
    } ${sanitizedParams.length > 0 ? JSON.stringify(sanitizedParams) : ''}`.trim();

    this.lastLoggedMessages.push(logEntry);
    if (process.env.NODE_ENV !== 'test') {
      console.log(logEntry);
    }
  }

  public sanitize(data: unknown): unknown {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }

    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(
      data as Record<string, unknown>,
    )) {
      const lowerKey = key.toLowerCase();
      if (
        PrivacyLogger.FORBIDDEN_KEYS.some((forbidden) =>
          lowerKey.includes(forbidden.toLowerCase()),
        )
      ) {
        // Drop confidential content completely
        continue;
      }

      if (typeof value === 'object' && value !== null) {
        sanitizedObj[key] = this.sanitize(value);
      } else {
        sanitizedObj[key] = value;
      }
    }

    return sanitizedObj;
  }
}
