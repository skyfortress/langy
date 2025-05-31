import { NextApiRequest, NextApiResponse } from 'next';
import { serialize, parse } from 'cookie';
import { UserSession } from '../types/user';
import * as crypto from 'crypto';

const TOKEN_NAME = 'langy_auth_token';
const MAX_AGE = 60 * 60 * 24 * 365; // 7 days
const SECRET_KEY = process.env.SECRET_KEY || 'your-default-secret-key-change-this';

export interface AuthenticatedRequest extends NextApiRequest {
  user: UserSession;
}

export function setAuthCookie(res: NextApiResponse, username: string): void {
  const token = createToken({ username, isLoggedIn: true });
  
  const cookie = serialize(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE,
    sameSite: 'strict',
    path: '/',
  });
  
  res.setHeader('Set-Cookie', cookie);
}

export function clearAuthCookie(res: NextApiResponse): void {
  const cookie = serialize(TOKEN_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: -1,
    sameSite: 'strict',
    path: '/',
  });
  
  res.setHeader('Set-Cookie', cookie);
}

function createToken(data: UserSession): string {
  const payload = JSON.stringify({
    data,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE,
  });
  
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  const signature = hmac.update(payload).digest('base64');
  
  return Buffer.from(`${payload}.${signature}`).toString('base64');
}

function verifyToken(token: string): UserSession | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const [payloadStr, signature] = decoded.split('.');
    
    const hmac = crypto.createHmac('sha256', SECRET_KEY);
    const expectedSignature = hmac.update(payloadStr).digest('base64');
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    const payload = JSON.parse(payloadStr);
    
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return payload.data as UserSession;
  } catch (error) {
    return null;
  }
}

export function getUserFromRequest(req: NextApiRequest): UserSession | null {
  try {
    const cookies = parse(req.headers.cookie || '');
    const token = cookies[TOKEN_NAME];
    
    if (!token) {
      return null;
    }
    
    return verifyToken(token);
  } catch (error) {
    return null;
  }
}

export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = getUserFromRequest(req);
    
    if (!user || !user.isLoggedIn) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    (req as AuthenticatedRequest).user = user;
    return handler(req as AuthenticatedRequest, res);
  };
}