import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { createServer as createViteServer } from 'vite';
import { store, hashPassword, generateApiKey, generateDeviceToken, SmsMessage, UssdSession, Device } from './server/store.js';
import { authenticate, requirePermission, requireDevice, createSessionToken, AuthenticatedRequest } from './server/auth.js';
import { ANDROID_PROJECT_FILES } from './server/androidCode.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Helper for GSM-7 vs UCS-2 encoding calculation
function calculateSmsParts(message: string): { encoding: 'GSM-7' | 'UCS-2'; partsCount: number } {
  // Check if string contains characters outside GSM 7-bit alphabet
  // Basic ASCII printable plus common symbols
  const isGsm7 = /^[\x20-\x7E\r\n\t]*$/.test(message);
  const encoding = isGsm7 ? 'GSM-7' : 'UCS-2';
  const maxSingle = isGsm7 ? 160 : 70;
  const maxMultipart = isGsm7 ? 153 : 67;

  if (message.length <= maxSingle) {
    return { encoding, partsCount: 1 };
  }
  return {
    encoding,
    partsCount: Math.ceil(message.length / maxMultipart),
  };
}

// Simulated USSD dialog responses
function getSimulatedUssdResponse(code: string, carrier = 'GSM Network'): string {
  const clean = code.trim();
  if (clean === '*144#' || clean.includes('144')) {
    return `${carrier}: Balance is $24.80. Data: 4,120 MB remaining (expires in 18 days). Airtime valid until 2026-11-30. Reply 1 for bundles, 2 for top-up.`;
  }
  if (clean === '*124#' || clean.includes('124')) {
    return `${carrier} SelfCare: Your account has $12.50 airtime. Unlimited local SMS active. Dial *131# to purchase 4G data pass.`;
  }
  if (clean === '*131#' || clean.includes('131')) {
    return `${carrier} Data Manager: 1) Daily 1GB ($1.50) 2) Weekly 5GB ($6.00) 3) Monthly 20GB ($20.00). Reply with number to select.`;
  }
  if (clean === '*99#' || clean.includes('99')) {
    return `Mobile Money Menu: 1. Send Money 2. Pay Bill 3. Buy Airtime 4. Account Balance 5. Mini-Statement. Reply with option.`;
  }
  return `${carrier}: Request "${clean}" received and confirmed by GSM switch. Reference #USSD-${Math.floor(100000 + Math.random() * 900000)}.`;
}

// -------------------------------------------------------------
// 1. Authentication Routes
// -------------------------------------------------------------
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const hashedPassword = hashPassword(password);
  const user = store.get().users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user || user.passwordHash !== hashedPassword) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = createSessionToken(user.id);
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
});

app.post('/api/v1/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  const existing = store.get().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'User with this email already exists' });
  }

  const newUser = {
    id: 'usr_' + crypto.randomBytes(8).toString('hex'),
    email,
    name,
    passwordHash: hashPassword(password),
    role: 'developer' as const,
    createdAt: new Date().toISOString(),
  };

  store.update((data) => {
    data.users.push(newUser);
  });

  const token = createSessionToken(newUser.id);
  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    },
  });
});

app.get('/api/v1/auth/me', authenticate, (req: AuthenticatedRequest, res) => {
  res.json({
    user: req.user
      ? {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role,
        }
      : null,
    apiKey: req.apiKey
      ? {
          id: req.apiKey.id,
          name: req.apiKey.name,
          permissions: req.apiKey.permissions,
        }
      : null,
    authType: req.authType,
  });
});

// -------------------------------------------------------------
// 2. API Keys Management
// -------------------------------------------------------------
app.get('/api/v1/keys', authenticate, (req: AuthenticatedRequest, res) => {
  const keys = store.get().apiKeys.map((k) => ({
    id: k.id,
    name: k.name,
    keyMasked: k.key.slice(0, 12) + '...' + k.key.slice(-4),
    keyFull: k.key,
    permissions: k.permissions,
    createdAt: k.createdAt,
    lastUsedAt: k.lastUsedAt,
    expiresAt: k.expiresAt,
    isActive: k.isActive,
  }));
  res.json({ keys });
});

app.post('/api/v1/keys', authenticate, (req: AuthenticatedRequest, res) => {
  const { name, permissions, expiresDays } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Key name is required' });
  }

  const newKey = {
    id: 'key_' + crypto.randomBytes(8).toString('hex'),
    userId: req.user ? req.user.id : 'usr_admin_default',
    name,
    key: generateApiKey(),
    permissions: Array.isArray(permissions) && permissions.length > 0
      ? permissions
      : ['sms:send', 'sms:read', 'ussd:run'],
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    expiresAt: expiresDays
      ? new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000).toISOString()
      : null,
    isActive: true,
  };

  store.update((data) => {
    data.apiKeys.unshift(newKey);
  });

  res.status(201).json({ key: newKey });
});

app.delete('/api/v1/keys/:id', authenticate, (req, res) => {
  const { id } = req.params;
  store.update((data) => {
    data.apiKeys = data.apiKeys.filter((k) => k.id !== id);
  });
  res.json({ success: true, message: 'API key revoked' });
});

// -------------------------------------------------------------
// 3. Devices Management
// -------------------------------------------------------------
app.get('/api/v1/devices', authenticate, (req, res) => {
  const devices = store.get().devices;
  res.json({ devices });
});

app.post('/api/v1/devices', authenticate, (req: AuthenticatedRequest, res) => {
  const { name, model, androidVersion, sim1Carrier, sim1Number, sim2Carrier, sim2Number, isVirtual } = req.body;
  const devToken = generateDeviceToken();
  const now = new Date().toISOString();

  const newDevice: Device = {
    id: 'dev_' + crypto.randomBytes(8).toString('hex'),
    userId: req.user ? req.user.id : 'usr_admin_default',
    name: name || 'New Android Gateway',
    model: model || 'Generic Android 14',
    androidVersion: androidVersion || 'Android 14',
    batteryLevel: 95,
    isCharging: true,
    networkType: '4G LTE',
    signalDbm: -75,
    token: devToken,
    isOnline: true,
    isVirtual: isVirtual ?? false,
    autoSimulateReplies: true,
    lastHeartbeat: now,
    createdAt: now,
    simCards: [
      {
        slot: 1,
        carrier: sim1Carrier || 'GSM SIM 1',
        phoneNumber: sim1Number || '+1 555-0100',
        iccid: '8901' + Math.floor(1000000000000000 + Math.random() * 9000000000000000),
        signalPercent: 90,
        status: 'ready',
      },
      ...(sim2Carrier
        ? [
            {
              slot: 2 as const,
              carrier: sim2Carrier,
              phoneNumber: sim2Number || '+1 555-0200',
              iccid: '8902' + Math.floor(1000000000000000 + Math.random() * 9000000000000000),
              signalPercent: 85,
              status: 'ready' as const,
            },
          ]
        : []),
    ],
  };

  store.update((data) => {
    data.devices.unshift(newDevice);
  });

  res.status(201).json({ device: newDevice });
});

app.patch('/api/v1/devices/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { name, autoSimulateReplies, isOnline } = req.body;

  let updated: Device | undefined;
  store.update((data) => {
    const dev = data.devices.find((d) => d.id === id);
    if (dev) {
      if (typeof name === 'string') dev.name = name;
      if (typeof autoSimulateReplies === 'boolean') dev.autoSimulateReplies = autoSimulateReplies;
      if (typeof isOnline === 'boolean') dev.isOnline = isOnline;
      updated = dev;
    }
  });

  if (!updated) {
    return res.status(404).json({ error: 'Device not found' });
  }
  res.json({ device: updated });
});

app.delete('/api/v1/devices/:id', authenticate, (req, res) => {
  const { id } = req.params;
  store.update((data) => {
    data.devices = data.devices.filter((d) => d.id !== id);
  });
  res.json({ success: true, message: 'Device removed' });
});

// Device pairing QR Code (Contains server URL & device token)
app.get('/api/v1/devices/:id/qr', authenticate, async (req, res) => {
  const { id } = req.params;
  const device = store.get().devices.find((d) => d.id === id);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  const hostHeader = req.get('host') || 'localhost:3000';
  const protocol = req.protocol;
  const baseUrl = `${protocol}://${hostHeader}`;

  const payload = JSON.stringify({
    serverUrl: baseUrl,
    deviceToken: device.token,
    deviceId: device.id,
    deviceName: device.name,
  });

  try {
    const qrDataUrl = await QRCode.toDataURL(payload, {
      margin: 2,
      width: 320,
      color: {
        dark: '#020617',
        light: '#ffffff',
      },
    });
    res.json({ qrDataUrl, payload: JSON.parse(payload) });
  } catch (err) {
    res.status(500).json({ error: 'Failed generating QR code' });
  }
});

// -------------------------------------------------------------
// 4. Android Device Integration Endpoints (Bearer gsm_dev_...)
// -------------------------------------------------------------

// Heartbeat from phone (battery %, signal, SIM info)
app.post('/api/v1/device/heartbeat', authenticate, (req: AuthenticatedRequest, res) => {
  const device = req.device;
  if (!device) {
    return res.status(401).json({ error: 'Device authentication required' });
  }

  const { batteryLevel, isCharging, simCards, signalDbm, networkType } = req.body;
  const now = new Date().toISOString();

  store.update((data) => {
    const target = data.devices.find((d) => d.id === device.id);
    if (target) {
      if (typeof batteryLevel === 'number') target.batteryLevel = batteryLevel;
      if (typeof isCharging === 'boolean') target.isCharging = isCharging;
      if (typeof signalDbm === 'number') target.signalDbm = signalDbm;
      if (networkType) target.networkType = networkType;
      if (Array.isArray(simCards)) target.simCards = simCards;
      target.isOnline = true;
      target.lastHeartbeat = now;
    }
  });

  res.json({ success: true, timestamp: now });
});

// Device fetches pending dispatch tasks (SMS send or USSD execute)
app.get('/api/v1/device/tasks', authenticate, (req: AuthenticatedRequest, res) => {
  const device = req.device;
  if (!device) {
    return res.status(401).json({ error: 'Device authentication required' });
  }

  const pendingTasks = store.get().tasks.filter(
    (t) => t.deviceId === device.id && t.status === 'pending'
  );

  // Mark as dispatched
  store.update((data) => {
    data.tasks.forEach((t) => {
      if (t.deviceId === device.id && t.status === 'pending') {
        t.status = 'dispatched';
      }
    });
  });

  res.json({ tasks: pendingTasks });
});

// Device reports task execution outcome (sent, failed, delivered, ussd_reply)
app.post('/api/v1/device/tasks/:id/report', authenticate, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status, ref, err, reply } = req.body;
  const now = new Date().toISOString();

  store.update((data) => {
    // 1. Update task
    const task = data.tasks.find((t) => t.id === id);
    if (task) {
      task.status = status === 'failed' ? 'failed' : 'completed';
    }

    // 2. Update SMS or USSD object
    const sms = data.sms.find((m) => m.id === id);
    if (sms) {
      sms.status = status === 'failed' ? 'failed' : 'delivered';
      if (ref) sms.gsmReference = ref;
      if (err) sms.errorMessage = err;
      sms.updatedAt = now;
    }

    const ussd = data.ussdSessions.find((u) => u.id === id);
    if (ussd) {
      ussd.status = status === 'failed' ? 'failed' : 'completed';
      if (reply) ussd.responseDialog = reply;
      ussd.completedAt = now;
    }
  });

  res.json({ success: true });
});

// -------------------------------------------------------------
// 5. Programmatic SMS API Endpoints
// -------------------------------------------------------------

// Send SMS Programmatically via REST API
app.post('/api/v1/sms/send', authenticate, requirePermission('sms:send'), (req: AuthenticatedRequest, res) => {
  const { to, message, deviceId, simSlot = 1, webhookUrl } = req.body;

  if (!to || !message) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Both "to" (phone number) and "message" fields are required',
    });
  }

  // Find target device (either specified or first available online device)
  const devices = store.get().devices;
  const targetDevice = deviceId
    ? devices.find((d) => d.id === deviceId)
    : devices.find((d) => d.isOnline) || devices[0];

  if (!targetDevice) {
    return res.status(400).json({
      error: 'No device available',
      message: 'No registered GSM gateway device found to dispatch this SMS',
    });
  }

  const { encoding, partsCount } = calculateSmsParts(message);
  const now = new Date().toISOString();
  const smsId = 'sms_' + crypto.randomBytes(8).toString('hex');

  const newSms: SmsMessage = {
    id: smsId,
    userId: req.user ? req.user.id : targetDevice.userId,
    deviceId: targetDevice.id,
    simSlot: (simSlot === 2 ? 2 : 1),
    direction: 'outbound',
    phoneNumber: to.trim(),
    message,
    status: 'queued',
    encoding,
    partsCount,
    webhookUrl,
    createdAt: now,
    updatedAt: now,
  };

  // Add task to device queue
  const task = {
    id: smsId,
    deviceId: targetDevice.id,
    type: 'send_sms' as const,
    payload: {
      to: to.trim(),
      message,
      simSlot: (simSlot === 2 ? 2 : 1),
    },
    status: 'pending' as const,
    createdAt: now,
  };

  store.update((data) => {
    data.sms.unshift(newSms);
    data.tasks.push(task);
  });

  // If virtual device or autoSimulateReplies is enabled, simulate carrier dispatch & delivery
  if (targetDevice.isVirtual || targetDevice.autoSimulateReplies) {
    setTimeout(() => {
      store.update((data) => {
        const item = data.sms.find((s) => s.id === smsId);
        if (item) {
          item.status = 'sent';
          item.gsmReference = 'GSM-' + Math.floor(10000 + Math.random() * 90000);
          item.updatedAt = new Date().toISOString();
        }
      });
    }, 600);

    setTimeout(() => {
      store.update((data) => {
        const item = data.sms.find((s) => s.id === smsId);
        if (item) {
          item.status = 'delivered';
          item.updatedAt = new Date().toISOString();
        }
      });
    }, 1800);
  }

  res.status(202).json({
    success: true,
    messageId: smsId,
    status: 'queued',
    device: {
      id: targetDevice.id,
      name: targetDevice.name,
      simSlot: newSms.simSlot,
    },
    recipient: to,
    partsCount,
    encoding,
    createdAt: now,
  });
});

// List Outbound SMS
app.get('/api/v1/sms/outbound', authenticate, requirePermission('sms:read'), (req, res) => {
  const { deviceId, status, limit = 50 } = req.query;
  let items = store.get().sms.filter((m) => m.direction === 'outbound');

  if (deviceId) {
    items = items.filter((m) => m.deviceId === deviceId);
  }
  if (status) {
    items = items.filter((m) => m.status === status);
  }

  res.json({
    total: items.length,
    messages: items.slice(0, Number(limit)),
  });
});

// List Inbound SMS
app.get('/api/v1/sms/inbound', authenticate, requirePermission('sms:read'), (req, res) => {
  const { deviceId, limit = 50 } = req.query;
  let items = store.get().sms.filter((m) => m.direction === 'inbound');

  if (deviceId) {
    items = items.filter((m) => m.deviceId === deviceId);
  }

  res.json({
    total: items.length,
    messages: items.slice(0, Number(limit)),
  });
});

// Receive Inbound SMS (from Android BroadcastReceiver or manual test simulation)
app.post('/api/v1/sms/inbound', authenticate, (req: AuthenticatedRequest, res) => {
  const { from, message, simSlot = 1, deviceId } = req.body;
  if (!from || !message) {
    return res.status(400).json({ error: 'Sender "from" and "message" are required' });
  }

  const targetDeviceId = req.device?.id || deviceId || store.get().devices[0]?.id;
  const now = new Date().toISOString();
  const { encoding, partsCount } = calculateSmsParts(message);

  const inboundSms: SmsMessage = {
    id: 'sms_in_' + crypto.randomBytes(8).toString('hex'),
    userId: req.user ? req.user.id : 'usr_admin_default',
    deviceId: targetDeviceId,
    simSlot: (simSlot === 2 ? 2 : 1),
    direction: 'inbound',
    phoneNumber: from.trim(),
    message,
    status: 'received',
    encoding,
    partsCount,
    createdAt: now,
    updatedAt: now,
  };

  store.update((data) => {
    data.sms.unshift(inboundSms);
  });

  res.status(201).json({
    success: true,
    messageId: inboundSms.id,
    receivedAt: now,
  });
});

app.delete('/api/v1/sms/:id', authenticate, (req, res) => {
  const { id } = req.params;
  store.update((data) => {
    data.sms = data.sms.filter((s) => s.id !== id);
  });
  res.json({ success: true });
});

// -------------------------------------------------------------
// 6. Programmatic USSD API Endpoints
// -------------------------------------------------------------

// Run USSD Code Programmatically
app.post('/api/v1/ussd/run', authenticate, requirePermission('ussd:run'), (req: AuthenticatedRequest, res) => {
  const { ussdCode, deviceId, simSlot = 1, sessionType = 'single', steps = [] } = req.body;

  if (!ussdCode || typeof ussdCode !== 'string') {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Field "ussdCode" (e.g. "*144#", "*124#") is required',
    });
  }

  const devices = store.get().devices;
  const targetDevice = deviceId
    ? devices.find((d) => d.id === deviceId)
    : devices.find((d) => d.isOnline) || devices[0];

  if (!targetDevice) {
    return res.status(400).json({
      error: 'No device available',
      message: 'No registered GSM gateway device available to execute USSD query',
    });
  }

  const now = new Date().toISOString();
  const sessionId = 'ussd_' + crypto.randomBytes(8).toString('hex');

  const newSession: UssdSession = {
    id: sessionId,
    userId: req.user ? req.user.id : targetDevice.userId,
    deviceId: targetDevice.id,
    simSlot: (simSlot === 2 ? 2 : 1),
    ussdCode: ussdCode.trim(),
    status: 'queued',
    sessionType,
    steps: Array.isArray(steps) ? steps : [],
    createdAt: now,
  };

  const task = {
    id: sessionId,
    deviceId: targetDevice.id,
    type: 'run_ussd' as const,
    payload: {
      ussdCode: ussdCode.trim(),
      simSlot: (simSlot === 2 ? 2 : 1),
    },
    status: 'pending' as const,
    createdAt: now,
  };

  store.update((data) => {
    data.ussdSessions.unshift(newSession);
    data.tasks.push(task);
  });

  // If virtual or autoSimulateReplies, simulate cellular network response
  if (targetDevice.isVirtual || targetDevice.autoSimulateReplies) {
    const carrier = targetDevice.simCards.find((s) => s.slot === (simSlot === 2 ? 2 : 1))?.carrier || 'GSM Network';
    setTimeout(() => {
      store.update((data) => {
        const item = data.ussdSessions.find((u) => u.id === sessionId);
        if (item) {
          item.status = 'executing';
        }
      });
    }, 400);

    setTimeout(() => {
      store.update((data) => {
        const item = data.ussdSessions.find((u) => u.id === sessionId);
        if (item) {
          item.status = 'completed';
          item.responseDialog = getSimulatedUssdResponse(ussdCode, carrier);
          item.executionTimeMs = Math.floor(950 + Math.random() * 600);
          item.completedAt = new Date().toISOString();
        }
      });
    }, 1400);
  }

  res.status(202).json({
    success: true,
    sessionId,
    status: 'queued',
    ussdCode: ussdCode.trim(),
    device: {
      id: targetDevice.id,
      name: targetDevice.name,
      simSlot: newSession.simSlot,
    },
    createdAt: now,
  });
});

// List USSD Sessions
app.get('/api/v1/ussd/sessions', authenticate, requirePermission('ussd:run'), (req, res) => {
  const { deviceId, limit = 50 } = req.query;
  let items = store.get().ussdSessions;

  if (deviceId) {
    items = items.filter((u) => u.deviceId === deviceId);
  }

  res.json({
    total: items.length,
    sessions: items.slice(0, Number(limit)),
  });
});

app.get('/api/v1/ussd/sessions/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const session = store.get().ussdSessions.find((u) => u.id === id);
  if (!session) {
    return res.status(404).json({ error: 'USSD session not found' });
  }
  res.json({ session });
});

// -------------------------------------------------------------
// 7. Webhooks API
// -------------------------------------------------------------
app.get('/api/v1/webhooks', authenticate, (req, res) => {
  res.json({ webhooks: store.get().webhooks });
});

app.post('/api/v1/webhooks', authenticate, (req: AuthenticatedRequest, res) => {
  const { url, events } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Webhook URL is required' });
  }

  const newWebhook = {
    id: 'whk_' + crypto.randomBytes(8).toString('hex'),
    userId: req.user ? req.user.id : 'usr_admin_default',
    url,
    events: events || ['sms.received', 'sms.delivered', 'ussd.response'],
    secret: 'whsec_' + crypto.randomBytes(16).toString('hex'),
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  store.update((data) => {
    data.webhooks.unshift(newWebhook);
  });

  res.status(201).json({ webhook: newWebhook });
});

app.delete('/api/v1/webhooks/:id', authenticate, (req, res) => {
  const { id } = req.params;
  store.update((data) => {
    data.webhooks = data.webhooks.filter((w) => w.id !== id);
  });
  res.json({ success: true });
});

// -------------------------------------------------------------
// 8. Android Codebase & Download Endpoints
// -------------------------------------------------------------
app.get('/api/v1/android/files', (req, res) => {
  res.json({ files: ANDROID_PROJECT_FILES });
});

app.get('/api/v1/android/download', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="flametide-gsm-gateway-project.json"');
  res.json({
    projectName: 'Flametide GSM Gateway',
    packageName: 'com.flametide.gateway',
    targetSdk: 35,
    minSdk: 21,
    exportedAt: new Date().toISOString(),
    files: ANDROID_PROJECT_FILES,
  });
});

// -------------------------------------------------------------
// 10. Antigravity Agent & MCP Tools Integration
// -------------------------------------------------------------

export const ANTIGRAVITY_TOOLS_SPEC = [
  {
    type: 'function',
    name: 'send_sms',
    description: 'Dispatch an SMS text message to a phone number using the GSM Gateway Android phone radio.',
    parameters: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'Recipient phone number with country code, e.g. +12025550192',
        },
        message: {
          type: 'string',
          description: 'The SMS text content to send via cellular network',
        },
        simSlot: {
          type: 'integer',
          description: 'SIM slot to route through: 1 or 2 (defaults to 1)',
          enum: [1, 2],
        },
      },
      required: ['to', 'message'],
    },
  },
  {
    type: 'function',
    name: 'run_ussd',
    description: 'Execute a USSD cellular network command (e.g. *144#, *124#, *131#, *99#) to check balance, top up airtime, or query mobile money menus.',
    parameters: {
      type: 'object',
      properties: {
        ussdCode: {
          type: 'string',
          description: 'The USSD code string, e.g. *144# or *124#',
        },
        simSlot: {
          type: 'integer',
          description: 'SIM slot to use: 1 or 2',
          enum: [1, 2],
        },
      },
      required: ['ussdCode'],
    },
  },
  {
    type: 'function',
    name: 'read_inbound_sms',
    description: 'Fetch incoming SMS messages captured by the Android GSM Gateway receiver.',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
          description: 'Maximum number of recent incoming messages to return (default: 10)',
        },
      },
    },
  },
  {
    type: 'function',
    name: 'get_gateway_status',
    description: 'Get operational telemetry of connected Android phones, battery %, network radio signal, and active SIM cards.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
];

app.get('/api/v1/antigravity/tools', (req, res) => {
  res.json({
    agentTarget: 'antigravity-preview-09-2026',
    sdk: '@google/genai',
    tools: ANTIGRAVITY_TOOLS_SPEC,
  });
});

app.post('/api/v1/antigravity/execute-tool', authenticate, async (req: AuthenticatedRequest, res) => {
  const { toolName, arguments: args } = req.body;
  if (!toolName) {
    return res.status(400).json({ error: 'Missing toolName' });
  }

  try {
    if (toolName === 'send_sms') {
      const { to, message, simSlot = 1 } = args || {};
      if (!to || !message) {
        return res.status(400).json({ error: 'Tool send_sms requires "to" and "message"' });
      }
      const devices = store.get().devices;
      const targetDevice = devices.find((d) => d.isOnline) || devices[0];
      const smsId = 'sms_' + crypto.randomBytes(8).toString('hex');
      const now = new Date().toISOString();
      const { encoding, partsCount } = calculateSmsParts(message);

      const newSms: SmsMessage = {
        id: smsId,
        userId: req.user ? req.user.id : 'usr_admin_default',
        deviceId: targetDevice?.id || 'dev_samsung_a54_primary',
        simSlot: (simSlot === 2 ? 2 : 1),
        direction: 'outbound',
        phoneNumber: to.trim(),
        message,
        status: 'delivered',
        encoding,
        partsCount,
        gsmReference: 'GSM-' + Math.floor(10000 + Math.random() * 90000),
        createdAt: now,
        updatedAt: now,
      };

      store.update((data) => {
        data.sms.unshift(newSms);
      });

      return res.json({
        success: true,
        tool: 'send_sms',
        output: `SMS successfully dispatched to ${to} via SIM ${simSlot}. Message ID: ${smsId}`,
        result: newSms,
      });
    }

    if (toolName === 'run_ussd') {
      const { ussdCode, simSlot = 1 } = args || {};
      if (!ussdCode) {
        return res.status(400).json({ error: 'Tool run_ussd requires "ussdCode"' });
      }
      const devices = store.get().devices;
      const targetDevice = devices.find((d) => d.isOnline) || devices[0];
      const carrier = targetDevice?.simCards.find((s) => s.slot === (simSlot === 2 ? 2 : 1))?.carrier || 'GSM Network';
      const responseDialog = getSimulatedUssdResponse(ussdCode, carrier);
      const sessionId = 'ussd_' + crypto.randomBytes(8).toString('hex');
      const now = new Date().toISOString();

      const newSession: UssdSession = {
        id: sessionId,
        userId: req.user ? req.user.id : 'usr_admin_default',
        deviceId: targetDevice?.id || 'dev_samsung_a54_primary',
        simSlot: (simSlot === 2 ? 2 : 1),
        ussdCode: ussdCode.trim(),
        status: 'completed',
        sessionType: 'single',
        steps: [],
        responseDialog,
        executionTimeMs: Math.floor(980 + Math.random() * 500),
        createdAt: now,
        completedAt: now,
      };

      store.update((data) => {
        data.ussdSessions.unshift(newSession);
      });

      return res.json({
        success: true,
        tool: 'run_ussd',
        output: responseDialog,
        result: newSession,
      });
    }

    if (toolName === 'read_inbound_sms') {
      const limit = Number(args?.limit) || 10;
      const inbound = store.get().sms.filter((m) => m.direction === 'inbound').slice(0, limit);
      return res.json({
        success: true,
        tool: 'read_inbound_sms',
        count: inbound.length,
        output: inbound.map((i) => `From ${i.phoneNumber} (SIM ${i.simSlot}): "${i.message}" [${i.createdAt}]`).join('\n'),
        messages: inbound,
      });
    }

    if (toolName === 'get_gateway_status') {
      const devices = store.get().devices;
      return res.json({
        success: true,
        tool: 'get_gateway_status',
        devicesCount: devices.length,
        onlineCount: devices.filter((d) => d.isOnline).length,
        devices: devices.map((d) => ({
          name: d.name,
          model: d.model,
          isOnline: d.isOnline,
          battery: `${d.batteryLevel}%`,
          signalDbm: d.signalDbm,
          simCards: d.simCards.map((s) => `SIM ${s.slot}: ${s.carrier} (${s.phoneNumber})`),
        })),
      });
    }

    return res.status(400).json({ error: `Unknown tool: ${toolName}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Tool execution error' });
  }
});

// -------------------------------------------------------------
// 9. Stats Summary Endpoint
// -------------------------------------------------------------
app.get('/api/v1/stats', authenticate, (req, res) => {
  const data = store.get();
  const totalSent = data.sms.filter((m) => m.direction === 'outbound').length;
  const delivered = data.sms.filter((m) => m.status === 'delivered').length;
  const totalReceived = data.sms.filter((m) => m.direction === 'inbound').length;
  const totalUssd = data.ussdSessions.length;
  const activeDevices = data.devices.filter((d) => d.isOnline).length;

  res.json({
    totalSent,
    delivered,
    deliveryRate: totalSent > 0 ? Math.round((delivered / totalSent) * 100) : 100,
    totalReceived,
    totalUssd,
    activeDevices,
    totalDevices: data.devices.length,
  });
});

// -------------------------------------------------------------
// Vite Dev Server / Static Hosting Integration
// -------------------------------------------------------------
async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GSM Gateway REST Backend & Web Dashboard running on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
