import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AppError, ErrorResponseBody } from './app.error';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let errorMessage = 'An unexpected error occurred';
    let details: unknown = undefined;

    if (exception instanceof AppError) {
      statusCode = exception.statusCode;
      errorCode = exception.code;
      errorMessage = exception.message;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        errorMessage = res;
        errorCode = this.mapStatusToErrorCode(statusCode);
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        errorCode =
          (resObj.code as string) || this.mapStatusToErrorCode(statusCode);
        if (Array.isArray(resObj.message)) {
          errorMessage = 'Validation failed';
          details = resObj.message;
        } else {
          errorMessage = (resObj.message as string) || exception.message;
        }
      }
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
    }

    const payload: ErrorResponseBody = {
      error: {
        code: errorCode,
        message: errorMessage,
        ...(details ? { details } : {}),
      },
    };

    response.status(statusCode).json(payload);
  }

  private mapStatusToErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'UNPROCESSABLE_ENTITY';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}
