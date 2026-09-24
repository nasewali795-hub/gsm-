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
  token: string;
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
  steps: string[];
  responseDialog?: string;
  executionTimeMs?: number;
  createdAt: string;
  completedAt?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  keyMasked: string;
  keyFull: string;
  permissions: Array<'sms:send' | 'sms:read' | 'ussd:run' | 'device:manage'>;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
}

export interface WebhookConfig {
  id: string;
  url: string;
  events: Array<'sms.received' | 'sms.delivered' | 'sms.failed' | 'ussd.response' | 'device.offline'>;
  secret: string;
  isActive: boolean;
  createdAt: string;
}

export interface AndroidFile {
  path: string;
  filename: string;
  language: string;
  category: 'manifest' | 'gradle' | 'service' | 'telephony' | 'ui' | 'network';
  description: string;
  content: string;
}

export interface SystemStats {
  totalSent: number;
  delivered: number;
  deliveryRate: number;
  totalReceived: number;
  totalUssd: number;
  activeDevices: number;
  totalDevices: number;
}
