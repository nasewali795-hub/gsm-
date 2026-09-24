import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { store, User, ApiKey, Device } from './store.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
  apiKey?: ApiKey;
  device?: Device;
  authType?: 'session' | 'api_key' | 'device';
}

// In-memory active user sessions
const activeSessions = new Map<string, { userId: string; expiresAt: number }>();

export function createSessionToken(userId: string): string {
  const token = 'gsm_sess_' + crypto.randomBytes(24).toString('hex');
  // 7 days expiration
  activeSessions.set(token, {
    userId,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  return token;
}

export function revokeSession(token: string) {
  activeSessions.delete(token);
}

// Unified Authenticator: Accepts Session Token or API Key or Device Token
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing Authorization header. Provide Bearer <session_token> or Bearer <api_key>',
    });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  // 1. Check if it's a User Session
  if (token.startsWith('gsm_sess_')) {
    const session = activeSessions.get(token);
    if (!session || session.expiresAt < Date.now()) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Session expired or invalid' });
    }
    const user = store.get().users.find((u) => u.id === session.userId);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
    }
    req.user = user;
    req.authType = 'session';
    return next();
  }

  // 2. Check if it's an API Key (gsm_live_...)
  if (token.startsWith('gsm_live_')) {
    const apiKey = store.get().apiKeys.find((k) => k.key === token && k.isActive);
    if (!apiKey) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or revoked API key' });
    }
    if (apiKey.expiresAt && new Date(apiKey.expiresAt).getTime() < Date.now()) {
      return res.status(401).json({ error: 'Unauthorized', message: 'API key has expired' });
    }

    // Update lastUsedAt
    store.update((data) => {
      const target = data.apiKeys.find((k) => k.id === apiKey.id);
      if (target) {
        target.lastUsedAt = new Date().toISOString();
      }
    });

    const user = store.get().users.find((u) => u.id === apiKey.userId);
    req.apiKey = apiKey;
    req.user = user;
    req.authType = 'api_key';
    return next();
  }

  // 3. Check if it's a Device Token (gsm_dev_...)
  if (token.startsWith('gsm_dev_')) {
    const device = store.get().devices.find((d) => d.token === token);
    if (!device) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Unknown device gateway token' });
    }
    req.device = device;
    req.authType = 'device';
    return next();
  }

  return res.status(401).json({
    error: 'Unauthorized',
    message: 'Invalid token format. Supported: Bearer gsm_sess_..., Bearer gsm_live_..., Bearer gsm_dev_...',
  });
}

// Permission enforcement for API Keys
export function requirePermission(permission: 'sms:send' | 'sms:read' | 'ussd:run' | 'device:manage') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // If it's an interactive web session user, allow full access
    if (req.authType === 'session') {
      return next();
    }

    // If it's an API Key, check permissions array
    if (req.authType === 'api_key' && req.apiKey) {
      if (req.apiKey.permissions.includes(permission)) {
        return next();
      }
      return res.status(403).json({
        error: 'Forbidden',
        message: `API key lacks required permission: '${permission}'`,
      });
    }

    return res.status(403).json({ error: 'Forbidden', message: 'Insufficient privileges' });
  };
}

// Device-only middleware (for Android client endpoints)
export function requireDevice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.authType === 'device' && req.device) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized', message: 'Endpoint requires Android Gateway Device token' });
}
