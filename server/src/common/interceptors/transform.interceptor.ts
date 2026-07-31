import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  private readonly sensitiveFields = [
    'password',
    'currentHashedRefreshToken',
    'refreshToken',
    'accessToken',
  ];

  intercept(
    _ctx: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data: this.sanitize(data),
        timestamp: new Date().toISOString(),
      })),
    );
  }

  private sanitize(data: any): any {
    // Handle primitives and null/undefined
    if (data === null || data === undefined) return data;
    if (typeof data !== 'object') return data;

    // Handle Date objects
    if (data instanceof Date) {
      return data.toISOString();
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }

    // Handle objects
    const sanitized = { ...data };

    // Remove sensitive top-level fields
    this.sensitiveFields.forEach((field) => {
      delete sanitized[field];
    });

    // Recursively sanitize nested objects
    Object.keys(sanitized).forEach((key) => {
      const value = sanitized[key];
      if (value && typeof value === 'object') {
        // Handle Date objects before recursing
        if (value instanceof Date) {
          sanitized[key] = value.toISOString();
        } else {
          sanitized[key] = this.sanitize(value);
        }
      }
    });

    return sanitized;
  }
}
