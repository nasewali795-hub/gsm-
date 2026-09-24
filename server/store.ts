import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'admin' | 'developer' | 'operator';
  createdAt: string;
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  key: string; // gsm_live_...
  permissions: Array<'sms:send' | 'sms:read' | 'ussd:run' | 'device:manage'>;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
}

export interface SimCard {
  slot: 1 | 2;
  carrier: string;
  phoneNumber: string;
  iccid: string;
  signalPercent: number;
  status: 'ready' | 'absent' | 'locked' | 'no_service';
}

export interface Device {
  id: string;
  userId: string;
  name: string;
  model: string;
  androidVersion: string;
  batteryLevel: number;
  isCharging: boolean;
  networkType: '4G LTE' | '5G' | '3G' | 'Wi-Fi' | 'Offline';
  signalDbm: number;
  token: string; // gsm_dev_...
  simCards: SimCard[];
  isOnline: boolean;
  isVirtual: boolean;
  autoSimulateReplies: boolean;
  lastHeartbeat: string;
  createdAt: string;
}

export interface SmsMessage {
  id: string;
  userId: string;
  deviceId: string;
  simSlot: 1 | 2;
  direction: 'outbound' | 'inbound';
  phoneNumber: string;
  message: string;
  status: 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'received';
  encoding: 'GSM-7' | 'UCS-2';
  partsCount: number;
  gsmReference?: string;
  errorMessage?: string;
  webhookUrl?: string;
  webhookStatus?: 'pending' | 'delivered' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface UssdSession {
  id: string;
  userId: string;
  deviceId: string;
  simSlot: 1 | 2;
  ussdCode: string;
  status: 'queued' | 'executing' | 'completed' | 'timeout' | 'failed';
  sessionType: 'single' | 'interactive';
  steps: string[]; // sequence of replies if interactive
  responseDialog?: string;
  executionTimeMs?: number;
  createdAt: string;
  completedAt?: string;
}

export interface WebhookConfig {
  id: string;
  userId: string;
  url: string;
  events: Array<'sms.received' | 'sms.delivered' | 'sms.failed' | 'ussd.response' | 'device.offline'>;
  secret: string;
  isActive: boolean;
  createdAt: string;
}

export interface GatewayTask {
  id: string;
  deviceId: string;
  type: 'send_sms' | 'run_ussd';
  payload: any;
  status: 'pending' | 'dispatched' | 'completed' | 'failed';
  createdAt: string;
}

export interface StoreData {
  users: User[];
  apiKeys: ApiKey[];
  devices: Device[];
  sms: SmsMessage[];
  ussdSessions: UssdSession[];
  webhooks: WebhookConfig[];
  tasks: GatewayTask[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'gateway-store.json');

// Helper to hash passwords using HMAC-SHA256
export function hashPassword(password: string): string {
  return crypto.createHmac('sha256', 'gsm-gateway-secret-salt-2026').update(password).digest('hex');
}

// Generate secure API keys
export function generateApiKey(prefix = 'gsm_live_'): string {
  return prefix + crypto.randomBytes(18).toString('hex');
}

export function generateDeviceToken(): string {
  return 'gsm_dev_' + crypto.randomBytes(16).toString('hex');
}

// Initialize seed data
function getInitialSeedData(): StoreData {
  const adminId = 'usr_admin_default';
  const defaultDevId = 'dev_samsung_a54_primary';
  const defaultDevToken = 'gsm_dev_9a4f2c7e1b5d8a92';
  const now = new Date().toISOString();

  return {
    users: [
      {
        id: adminId,
        email: 'admin@gsmgateway.local',
        name: 'GSM Gateway Admin',
        passwordHash: hashPassword('admin12345'),
        role: 'admin',
        createdAt: now,
      },
    ],
    apiKeys: [
      {
        id: 'key_primary_live',
        userId: adminId,
        name: 'Production Server REST Key',
        key: 'gsm_live_8f3a9b1c7e6d5a4209bf184e9d2c1',
        permissions: ['sms:send', 'sms:read', 'ussd:run', 'device:manage'],
        createdAt: now,
        lastUsedAt: now,
        expiresAt: null,
        isActive: true,
      },
      {
        id: 'key_dispatch_service',
        userId: adminId,
        name: 'OTP & Notification Microservice',
        key: 'gsm_live_44b09c81ef40d8923a105c31',
        permissions: ['sms:send', 'sms:read'],
        createdAt: now,
        lastUsedAt: null,
        expiresAt: null,
        isActive: true,
      },
    ],
    devices: [
      {
        id: defaultDevId,
        userId: adminId,
        name: 'Samsung Galaxy A54 (Gateway #1)',
        model: 'SM-A546B / Exynos 1380',
        androidVersion: 'Android 14 (One UI 6.1)',
        batteryLevel: 94,
        isCharging: true,
        networkType: '4G LTE',
        signalDbm: -76,
        token: defaultDevToken,
        isOnline: true,
        isVirtual: false,
        autoSimulateReplies: true,
        lastHeartbeat: now,
        createdAt: now,
        simCards: [
          {
            slot: 1,
            carrier: 'Vodafone GSM',
            phoneNumber: '+1 202-555-0143',
            iccid: '89014103211118510720',
            signalPercent: 92,
            status: 'ready',
          },
          {
            slot: 2,
            carrier: 'T-Mobile International',
            phoneNumber: '+1 202-555-0189',
            iccid: '89014103211118510831',
            signalPercent: 84,
            status: 'ready',
          },
        ],
      },
      {
        id: 'dev_pixel_7a_backup',
        userId: adminId,
        name: 'Google Pixel 7a (Gateway #2)',
        model: 'Pixel 7a / Tensor G2',
        androidVersion: 'Android 15',
        batteryLevel: 82,
        isCharging: false,
        networkType: '5G',
        signalDbm: -82,
        token: 'gsm_dev_f710e423d9b1c678a',
        isOnline: true,
        isVirtual: true,
        autoSimulateReplies: true,
        lastHeartbeat: now,
        createdAt: now,
        simCards: [
          {
            slot: 1,
            carrier: 'Airtel Wireless',
            phoneNumber: '+44 7700 900341',
            iccid: '89441103211118590111',
            signalPercent: 88,
            status: 'ready',
          },
        ],
      },
    ],
    sms: [
      {
        id: 'sms_out_001',
        userId: adminId,
        deviceId: defaultDevId,
        simSlot: 1,
        direction: 'outbound',
        phoneNumber: '+1 415-555-2671',
        message: 'Your one-time security login code is 839210. Valid for 10 minutes.',
        status: 'delivered',
        encoding: 'GSM-7',
        partsCount: 1,
        gsmReference: 'REF-78921',
        createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 17).toISOString(),
      },
      {
        id: 'sms_in_001',
        userId: adminId,
        deviceId: defaultDevId,
        simSlot: 1,
        direction: 'inbound',
        phoneNumber: '+1 415-555-2671',
        message: 'CONFIRM 839210',
        status: 'received',
        encoding: 'GSM-7',
        partsCount: 1,
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
      {
        id: 'sms_out_002',
        userId: adminId,
        deviceId: defaultDevId,
        simSlot: 2,
        direction: 'outbound',
        phoneNumber: '+1 312-555-0198',
        message: 'Order #48102 shipped via DHL Express. Tracking link: https://track.example.com/DHL481',
        status: 'sent',
        encoding: 'GSM-7',
        partsCount: 1,
        gsmReference: 'REF-78922',
        createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
      },
      {
        id: 'sms_in_002',
        userId: adminId,
        deviceId: defaultDevId,
        simSlot: 2,
        direction: 'inbound',
        phoneNumber: '+1 312-555-0198',
        message: 'Thanks for the quick dispatch!',
        status: 'received',
        encoding: 'GSM-7',
        partsCount: 1,
        createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
      },
    ],
    ussdSessions: [
      {
        id: 'ussd_001',
        userId: adminId,
        deviceId: defaultDevId,
        simSlot: 1,
        ussdCode: '*144#',
        status: 'completed',
        sessionType: 'single',
        steps: [],
        responseDialog: 'Vodafone GSM: Your airtime balance is $38.40. Main data plan: 5.4 GB remaining, valid until 15-Nov-2026. Dial *144*1# to buy more.',
        executionTimeMs: 1420,
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        completedAt: new Date(Date.now() - 1000 * 60 * 44).toISOString(),
      },
      {
        id: 'ussd_002',
        userId: adminId,
        deviceId: defaultDevId,
        simSlot: 2,
        ussdCode: '*124#',
        status: 'completed',
        sessionType: 'single',
        steps: [],
        responseDialog: 'T-Mobile Prepaid Balance: $14.20. Unlimited nationwide minutes active. Next refill due 01-Nov-2026.',
        executionTimeMs: 1180,
        createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        completedAt: new Date(Date.now() - 1000 * 60 * 24).toISOString(),
      },
    ],
    webhooks: [
      {
        id: 'whk_main_crm',
        userId: adminId,
        url: 'https://webhook.site/gsm-demo-inbox',
        events: ['sms.received', 'sms.delivered', 'ussd.response'],
        secret: 'whsec_99a8b7c6d5e4f3a2b1',
        isActive: true,
        createdAt: now,
      },
    ],
    tasks: [],
  };
}

class Store {
  private data: StoreData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): StoreData {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to load store from disk, initializing seed:', err);
    }
    const seed = getInitialSeedData();
    this.saveData(seed);
    return seed;
  }

  private saveData(data: StoreData) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist store:', err);
    }
  }

  public get(): StoreData {
    return this.data;
  }

  public update(fn: (data: StoreData) => void) {
    fn(this.data);
    this.saveData(this.data);
  }
}

export const store = new Store();
