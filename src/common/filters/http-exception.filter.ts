import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const body = exceptionResponse as Record<string, unknown>;

        // Handles class-validator errors: { message: string[] }
        if (Array.isArray(body['message'])) {
          message = (body['message'] as string[]).join('; ');
          code = 'INVALID_PARAMETERS';
        } else if (typeof body['message'] === 'string') {
          message = body['message'];
        }

        // Derive code from the error field when not already overridden
        if (
          code !== 'INVALID_PARAMETERS' &&
          typeof body['error'] === 'string'
        ) {
          code = body['error'].toUpperCase().replace(/\s+/g, '_');
        }
      }

      if (code === 'INTERNAL_SERVER_ERROR') {
        code =
          exception.constructor.name.replace('Exception', '').toUpperCase() ||
          'INTERNAL_SERVER_ERROR';
      }
    } else {
      this.logger.error('Unhandled exception', exception as Error);
    }

    response.status(status).json({ code, message });
  }
}
