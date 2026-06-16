import { jwtVerify, createRemoteJWKSet, errors } from 'jose';
import type { JWTPayload } from 'jose';

export interface TokenPayload extends JWTPayload {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
}

const JWKS_URL = process.env.JWKS_URL;
const JWT_SECRET = process.env.JWT_SECRET;

let remoteJWKSet: ReturnType<typeof createRemoteJWKSet> | null = null;

function getKeySet() {
  return createRemoteJWKSet(new URL(JWKS_URL!));
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    let payload: TokenPayload;

    if (JWKS_URL) {
      if (!remoteJWKSet) {
        remoteJWKSet = getKeySet();
      }
      const result = await jwtVerify(token, remoteJWKSet, {
        algorithms: ['RS256'],
      });
      payload = result.payload as TokenPayload;
    } else {
      const secret = new TextEncoder().encode(JWT_SECRET ?? '');
      const result = await jwtVerify(token, secret, {
        algorithms: ['HS256'],
      });
      payload = result.payload as TokenPayload;
    }

    return payload;
  } catch (err) {
    if (err instanceof errors.JWTExpired) return null;
    if (err instanceof errors.JWTInvalid) return null;
    return null;
  }
}

export function getRoleFromPayload(payload: TokenPayload): string {
  return payload.role ?? '';
}

export function isTokenExpired(payload: TokenPayload): boolean {
  if (!payload.exp) return true;
  return Date.now() >= payload.exp * 1000;
}
