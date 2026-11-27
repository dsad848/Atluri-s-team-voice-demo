import type {
  AppointmentState,
  CabBookingState,
  CabEstimateResponse,
  DoctorSlot,
  ElectricityBillInfo,
  MedicineCatalogItem,
  MedicineOrderState,
  NluRequest,
  NluResponse,
  NotificationItem,
  SearchResultItem,
} from '../types/assistant';

async function fetchWithTimeout<T>(url: string, options: RequestInit = {}, timeoutMs = 12000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMessage = typeof data?.error === 'string' ? data.error : `Request failed (${response.status})`;
      throw new Error(errorMessage);
    }
    return data as T;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Network request timed out. Please try again.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const apiClient = {
  getHealth: () =>
    fetchWithTimeout<{ ok: boolean; aiConfigured: boolean; mode: string; notice?: string }>('/api/health'),

  understandCommand: (payload: NluRequest) =>
    fetchWithTimeout<NluResponse>('/api/assistant/understand', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifySecurityPin: (pin: string, method: 'pin' | 'biometric_demo' = 'pin') =>
    fetchWithTimeout<{ verified: boolean; token: string; expiresAt: number; simulatedBiometric?: boolean }>(
      '/api/security/verify-pin',
      {
        method: 'POST',
        body: JSON.stringify({ pin, method }),
      }
    ),

  estimateCab: (pickup: string, destination: string) =>
    fetchWithTimeout<CabEstimateResponse>('/api/services/cab/estimate', {
      method: 'POST',
      body: JSON.stringify({ pickup, destination }),
    }),

  bookCab: (
    params: {
      pickup: string;
      destination: string;
      categoryId: 'auto' | 'mini' | 'sedan';
      explicitConfirmed: boolean;
      requirePin: boolean;
    },
    authToken: string | null
  ) =>
    fetchWithTimeout<CabBookingState>('/api/services/cab/book', {
      method: 'POST',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      body: JSON.stringify(params),
    }),

  requestCabOtp: (bookingId: string, requirePin: boolean, authToken: string | null) =>
    fetchWithTimeout<{ simulated: true; bookingId: string; testOtp: string; spokenOtpMessage: string }>(
      '/api/services/cab/otp',
      {
        method: 'POST',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        body: JSON.stringify({ bookingId, explicitOtpRequest: true, requirePin }),
      }
    ),

  cancelCabBooking: (bookingId: string) =>
    fetchWithTimeout<{ cancelled: boolean }>('/api/services/cab/cancel', {
      method: 'POST',
      body: JSON.stringify({ bookingId }),
    }),

  getMedicineCatalog: () =>
    fetchWithTimeout<{ simulated: true; items: MedicineCatalogItem[] }>('/api/services/medicine/catalog'),

  orderMedicine: (
    params: { medicineId: string; quantity: number; explicitConfirmed: boolean; requirePin: boolean },
    authToken: string | null
  ) =>
    fetchWithTimeout<MedicineOrderState>('/api/services/medicine/order', {
      method: 'POST',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      body: JSON.stringify(params),
    }),

  getDoctorSlots: () =>
    fetchWithTimeout<{ simulated: true; slots: DoctorSlot[] }>('/api/services/appointments/slots'),

  bookAppointment: (slotId: string) =>
    fetchWithTimeout<AppointmentState>('/api/services/appointments/book', {
      method: 'POST',
      body: JSON.stringify({ slotId, explicitConfirmed: true }),
    }),

  getElectricityBill: () => fetchWithTimeout<ElectricityBillInfo>('/api/services/electricity/bill'),

  payElectricityBill: (requirePin: boolean, authToken: string | null) =>
    fetchWithTimeout<ElectricityBillInfo>('/api/services/electricity/pay', {
      method: 'POST',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      body: JSON.stringify({ explicitConfirmed: true, requirePin }),
    }),

  getNotifications: () =>
    fetchWithTimeout<{ simulated: true; items: NotificationItem[] }>('/api/services/notifications'),

  searchSimulated: (query: string) =>
    fetchWithTimeout<{ simulated: true; query: string; results: SearchResultItem[] }>('/api/services/search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),
};
