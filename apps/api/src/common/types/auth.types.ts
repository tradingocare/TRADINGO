import { Request } from 'express';

export interface AuthUser {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
  companyId?: string;
  companies?: Array<{ id: string }>;
  sessionId?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
  correlationId?: string;
}
