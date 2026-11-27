export type LanguageCode = 'en-IN' | 'te-IN' | 'mixed';

export type AssistantIntent =
  | 'cab_booking'
  | 'read_otp'
  | 'medicine_order'
  | 'doctor_appointment'
  | 'electricity_bill'
  | 'read_notifications'
  | 'web_search'
  | 'open_app'
  | 'confirm_action'
  | 'cancel_action'
  | 'repeat_last'
  | 'help'
  | 'clarify';

export interface ExtractedEntities {
  destination?: string;
  pickup?: string;
  cabCategory?: 'auto' | 'mini' | 'sedan';
  medicineName?: string;
  quantity?: string;
  specialty?: string;
  preferredTime?: string;
  consumerNumber?: string;
  searchQuery?: string;
  appName?: string;
}

export interface NluRequest {
  utterance: string;
  language: LanguageCode;
  locationGranted: boolean;
  hasActiveCabBooking: boolean;
  pendingWorkflow?: string | null;
  recentTurns?: Array<{ role: 'user' | 'assistant'; text: string }>;
}

export interface NluResponse {
  intent: AssistantIntent;
  confidence: number;
  detectedLanguage: LanguageCode;
  needsClarification: boolean;
  clarificationQuestion?: string;
  requiresLocationPermission: boolean;
  requiresUserConfirmation: boolean;
  requiresSecurityPin: boolean;
  entities: ExtractedEntities;
  spokenResponse: string;
  spokenResponseTelugu?: string;
  aiSource: 'gemini' | 'demo_fallback';
  aiConfigured: boolean;
  aiNotice?: string;
}

export interface CabCategoryOption {
  id: 'auto' | 'mini' | 'sedan';
  name: string;
  teluguName: string;
  etaMinutes: number;
  estimatedFareInr: number;
  capacity: string;
  simulatedLabel: string;
}

export interface CabEstimateResponse {
  simulated: true;
  pickup: string;
  destination: string;
  distanceKm: number;
  categories: CabCategoryOption[];
  spokenSummary: string;
}

export interface CabBookingState {
  simulated: true;
  bookingId: string;
  status: 'confirmed_simulated' | 'cancelled';
  categoryName: string;
  pickup: string;
  destination: string;
  estimatedFareInr: number;
  driverName: string;
  vehicleNumber: string;
  etaMinutes: number;
  createdAt: string;
  otpAvailableOnRequest: boolean;
  revealedTestOtp?: string;
}

export interface MedicineCatalogItem {
  id: string;
  name: string;
  dosage: string;
  pharmacy: string;
  priceInr: number;
  deliveryEta: string;
  requiresPrescriptionCheck: boolean;
}

export interface MedicineOrderState {
  simulated: true;
  orderId: string;
  item: MedicineCatalogItem;
  quantity: number;
  totalInr: number;
  status: 'order_placed_simulated';
  placedAt: string;
}

export interface DoctorSlot {
  id: string;
  doctorName: string;
  specialty: string;
  clinic: string;
  timeLabel: string;
  feeInr: number;
}

export interface AppointmentState {
  simulated: true;
  appointmentId: string;
  slot: DoctorSlot;
  status: 'booked_simulated';
  bookedAt: string;
}

export interface ElectricityBillInfo {
  simulated: true;
  provider: string;
  consumerNumber: string;
  consumerName: string;
  billingMonth: string;
  unitsConsumed: number;
  amountDueInr: number;
  dueDate: string;
  status: 'unpaid' | 'paid_simulated';
  receiptId?: string;
}

export interface NotificationItem {
  id: string;
  simulated: true;
  source: string;
  priority: 'high' | 'normal';
  title: string;
  body: string;
  teluguSummary: string;
  timestamp: string;
}

export interface SearchResultItem {
  title: string;
  summary: string;
  source: string;
}

export interface AppShortcutResult {
  simulated: true;
  appName: string;
  actionDescription: string;
  supportedActions: string[];
}

export interface ConversationTurn {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  teluguText?: string;
  timestamp: string;
  intent?: AssistantIntent;
  aiSource?: 'gemini' | 'demo_fallback';
}

export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  speechRate: number;
  autoListenAfterReply: boolean;
  audioEarcons: boolean;
  securityPinRequired: boolean;
}
