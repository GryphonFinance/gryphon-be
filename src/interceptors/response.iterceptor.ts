import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { map } from 'rxjs/operators';
  
  @Injectable()
  export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
      return next.handle().pipe(
        map((data) => ({
          success: true,
          message: 'OK',
          data,
          meta: null,
        })),
      );
    }
  }
  
  export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    meta: any | null;
  }
  