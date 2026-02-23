import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SKIP_TRANSFORM_KEY } from '../decorators/skip-transform.decorator';

export interface ApiResponse<T = unknown> {
  code: string;
  message: string;
  data: T | null;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_TRANSFORM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skip) {
      return next.handle() as unknown as Observable<ApiResponse<T>>;
    }

    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse<{ statusCode: number }>();

    return next.handle().pipe(
      map((data) => {
        const status: number = response.statusCode ?? 200;
        const code = status === 201 ? 'CREATED' : 'OK';

        return {
          code,
          message: code === 'CREATED' ? 'Created' : 'Success',
          data: (data ?? null) as T | null,
        };
      }),
    );
  }
}
