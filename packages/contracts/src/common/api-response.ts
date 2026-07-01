export interface ApiResponse<T = unknown> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
}

export interface ValidationErrorResponse {
  statusCode: number;
  message: string[];
  error: string;
  timestamp: string;
}

export function success<T>(data: T, message = 'Success'): ApiResponse<T> {
  return { statusCode: 200, message, data, timestamp: new Date().toISOString() };
}

export function created<T>(data: T, message = 'Created'): ApiResponse<T> {
  return { statusCode: 201, message, data, timestamp: new Date().toISOString() };
}

export function paginated<T>(data: T[], meta: PaginationMeta): ApiResponse<PaginatedResponse<T>> {
  return { statusCode: 200, message: 'Success', data: { data, meta }, timestamp: new Date().toISOString() };
}
