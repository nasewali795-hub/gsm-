import { Device, SmsMessage, UssdSession, ApiKey, WebhookConfig, AndroidFile, SystemStats } from '../types/gateway.ts';

const TOKEN_KEY = 'gsm_auth_token';
const DEFAULT_KEY = 'gsm_live_8f3a9b1c7e6d5a4209bf184e9d2c1';

export function getAuthToken(): string {
  return localStorage.getItem(TOKEN_KEY) || DEFAULT_KEY;
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMsg = `Request failed: ${res.statusText}`;
    try {
      const data = await res.json();
      errMsg = data.message || data.error || errMsg;
    } catch (_) {}
    throw new Error(errMsg);
  }

  return res.json();
}

export const api = {
  // Stats
  getStats: () => request<SystemStats>('/api/v1/stats'),

  // Devices
  getDevices: () => request<{ devices: Device[] }>('/api/v1/devices'),
  createDevice: (data: Partial<Device> & { sim1Carrier?: string; sim1Number?: string; sim2Carrier?: string; sim2Number?: string }) =>
    request<{ device: Device }>('/api/v1/devices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateDevice: (id: string, data: { name?: string; autoSimulateReplies?: boolean; isOnline?: boolean }) =>
    request<{ device: Device }>(`/api/v1/devices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteDevice: (id: string) =>
    request<{ success: boolean }>(`/api/v1/devices/${id}`, {
      method: 'DELETE',
    }),
  getDeviceQr: (id: string) =>
    request<{ qrDataUrl: string; payload: any }>(`/api/v1/devices/${id}/qr`),

  // SMS
  sendSms: (payload: { to: string; message: string; deviceId?: string; simSlot?: 1 | 2; webhookUrl?: string }) =>
    request<{ success: boolean; messageId: string; status: string; partsCount: number; encoding: string }>(
      '/api/v1/sms/send',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),
  getOutboundSms: (deviceId?: string) =>
    request<{ total: number; messages: SmsMessage[] }>(
      deviceId ? `/api/v1/sms/outbound?deviceId=${deviceId}` : '/api/v1/sms/outbound'
    ),
  getInboundSms: (deviceId?: string) =>
    request<{ total: number; messages: SmsMessage[] }>(
      deviceId ? `/api/v1/sms/inbound?deviceId=${deviceId}` : '/api/v1/sms/inbound'
    ),
  simulateInboundSms: (payload: { from: string; message: string; simSlot?: 1 | 2; deviceId?: string }) =>
    request<{ success: boolean; messageId: string }>('/api/v1/sms/inbound', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteSms: (id: string) =>
    request<{ success: boolean }>(`/api/v1/sms/${id}`, {
      method: 'DELETE',
    }),

  // USSD
  runUssd: (payload: { ussdCode: string; deviceId?: string; simSlot?: 1 | 2; sessionType?: string; steps?: string[] }) =>
    request<{ success: boolean; sessionId: string; status: string; ussdCode: string }>('/api/v1/ussd/run', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getUssdSessions: (deviceId?: string) =>
    request<{ total: number; sessions: UssdSession[] }>(
      deviceId ? `/api/v1/ussd/sessions?deviceId=${deviceId}` : '/api/v1/ussd/sessions'
    ),
  getUssdSessionById: (id: string) => request<{ session: UssdSession }>(`/api/v1/ussd/sessions/${id}`),

  // API Keys
  getKeys: () => request<{ keys: ApiKey[] }>('/api/v1/keys'),
  createKey: (data: { name: string; permissions: string[]; expiresDays?: number }) =>
    request<{ key: ApiKey }>('/api/v1/keys', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteKey: (id: string) =>
    request<{ success: boolean }>(`/api/v1/keys/${id}`, {
      method: 'DELETE',
    }),

  // Webhooks
  getWebhooks: () => request<{ webhooks: WebhookConfig[] }>('/api/v1/webhooks'),
  createWebhook: (data: { url: string; events?: string[] }) =>
    request<{ webhook: WebhookConfig }>('/api/v1/webhooks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteWebhook: (id: string) =>
    request<{ success: boolean }>(`/api/v1/webhooks/${id}`, {
      method: 'DELETE',
    }),

  // Android Codebase
  getAndroidFiles: () => request<{ files: AndroidFile[] }>('/api/v1/android/files'),
};
