import crypto from 'node:crypto';
import type {
  AppointmentState,
  CabBookingState,
  CabCategoryOption,
  CabEstimateResponse,
  DoctorSlot,
  ElectricityBillInfo,
  MedicineCatalogItem,
  MedicineOrderState,
  NotificationItem,
  SearchResultItem,
} from '../src/types/assistant.js';

// In-memory demo session state (no database required for initial prototype)
const cabBookingStore = new Map<string, CabBookingState & { internalTestOtp: string }>();
const medicineOrderStore = new Map<string, MedicineOrderState>();
const appointmentStore = new Map<string, AppointmentState>();

let sampleElectricityBill: ElectricityBillInfo = {
  simulated: true,
  provider: 'APSPDCL (Sample Utility)',
  consumerNumber: 'AP-8842-1093',
  consumerName: 'Demo Household Account',
  billingMonth: 'November 2026',
  unitsConsumed: 184,
  amountDueInr: 1240,
  dueDate: '5 December 2026',
  status: 'unpaid',
};

export function getSimulatedCabEstimate(pickup: string, destination: string): CabEstimateResponse {
  const isAirport = /airport|gannavaram/i.test(destination);
  const isSecunderabad = /secunderabad/i.test(destination);
  const distanceKm = isSecunderabad ? 18.4 : isAirport ? 21.2 : 6.4;

  const categories: CabCategoryOption[] = [
    {
      id: 'auto',
      name: 'Voice Auto (Sample)',
      teluguName: 'ఆటో రిక్షా (నమూనా)',
      etaMinutes: 3,
      estimatedFareInr: Math.round(45 + distanceKm * 15),
      capacity: 'Up to 3 passengers',
      simulatedLabel: 'Simulated sample fare',
    },
    {
      id: 'mini',
      name: 'Comfort Mini (Sample)',
      teluguName: 'కంఫర్ట్ మినీ (నమూనా)',
      etaMinutes: 5,
      estimatedFareInr: Math.round(70 + distanceKm * 21),
      capacity: 'AC Hatchback · 4 seats',
      simulatedLabel: 'Simulated sample fare',
    },
    {
      id: 'sedan',
      name: 'Prime Sedan (Sample)',
      teluguName: 'ప్రైమ్ సెడాన్ (నమూనా)',
      etaMinutes: 7,
      estimatedFareInr: Math.round(95 + distanceKm * 25),
      capacity: 'AC Sedan · Extra legroom',
      simulatedLabel: 'Simulated sample fare',
    },
  ];

  const mini = categories[1];
  return {
    simulated: true,
    pickup,
    destination,
    distanceKm,
    categories,
    spokenSummary: `Sample cab estimates from ${pickup} to ${destination} (${distanceKm} km): Auto is around ${categories[0].estimatedFareInr} rupees, Comfort Mini is ${mini.estimatedFareInr} rupees arriving in ${mini.etaMinutes} minutes, and Prime Sedan is ${categories[2].estimatedFareInr} rupees. Please confirm which category you want to book.`,
  };
}

export function createSimulatedCabBooking(
  pickup: string,
  destination: string,
  categoryId: 'auto' | 'mini' | 'sedan'
): CabBookingState {
  const estimate = getSimulatedCabEstimate(pickup, destination);
  const chosen = estimate.categories.find((c) => c.id === categoryId) ?? estimate.categories[1];
  const bookingId = `SIM-CAB-${crypto.randomInt(10000, 99999)}`;
  const testOtp = String(crypto.randomInt(1000, 9999));

  const bookingRecord: CabBookingState & { internalTestOtp: string } = {
    simulated: true,
    bookingId,
    status: 'confirmed_simulated',
    categoryName: chosen.name,
    pickup,
    destination,
    estimatedFareInr: chosen.estimatedFareInr,
    driverName: 'Ramesh Babu (Sample Driver)',
    vehicleNumber: 'AP 16 TZ 0000 (Demo)',
    etaMinutes: chosen.etaMinutes,
    createdAt: new Date().toISOString(),
    otpAvailableOnRequest: true,
    internalTestOtp: testOtp,
  };

  cabBookingStore.set(bookingId, bookingRecord);

  // Return without exposing internalTestOtp until explicitly requested!
  const { internalTestOtp: _hidden, ...publicBooking } = bookingRecord;
  return publicBooking;
}

export function revealSimulatedCabOtp(bookingId: string): { bookingId: string; testOtp: string } | null {
  const record = cabBookingStore.get(bookingId);
  if (!record || record.status === 'cancelled') {
    return null;
  }
  return {
    bookingId: record.bookingId,
    testOtp: record.internalTestOtp,
  };
}

export function cancelSimulatedCabBooking(bookingId: string): boolean {
  const record = cabBookingStore.get(bookingId);
  if (!record) return false;
  record.status = 'cancelled';
  return true;
}

export const MEDICINE_CATALOG: MedicineCatalogItem[] = [
  {
    id: 'med-paracetamol',
    name: 'Paracetamol 650mg (15 Tablets)',
    dosage: 'Fever & mild pain relief',
    pharmacy: 'Jan Aushadhi Sample Pharmacy',
    priceInr: 34,
    deliveryEta: '35 mins (Sample ETA)',
    requiresPrescriptionCheck: false,
  },
  {
    id: 'med-metformin',
    name: 'Metformin 500mg (10 Tablets)',
    dosage: 'Regular prescription refill',
    pharmacy: 'Apollo Sample Care Pharmacy',
    priceInr: 48,
    deliveryEta: '45 mins (Sample ETA)',
    requiresPrescriptionCheck: true,
  },
  {
    id: 'med-cetirizine',
    name: 'Cetirizine 10mg (10 Tablets)',
    dosage: 'Allergy & cold relief',
    pharmacy: 'Jan Aushadhi Sample Pharmacy',
    priceInr: 22,
    deliveryEta: '35 mins (Sample ETA)',
    requiresPrescriptionCheck: false,
  },
];

export function createSimulatedMedicineOrder(medicineId: string, quantity = 1): MedicineOrderState | null {
  const item = MEDICINE_CATALOG.find((m) => m.id === medicineId) ?? MEDICINE_CATALOG[0];
  if (!item) return null;
  const safeQty = Math.max(1, Math.min(5, Math.floor(quantity)));
  const order: MedicineOrderState = {
    simulated: true,
    orderId: `SIM-MED-${crypto.randomInt(1000, 9999)}`,
    item,
    quantity: safeQty,
    totalInr: item.priceInr * safeQty,
    status: 'order_placed_simulated',
    placedAt: new Date().toISOString(),
  };
  medicineOrderStore.set(order.orderId, order);
  return order;
}

export const DOCTOR_SLOTS: DoctorSlot[] = [
  {
    id: 'slot-1',
    doctorName: 'Dr. Lakshmi Narayana (Sample)',
    specialty: 'General Medicine',
    clinic: 'Vijayawada Community Health Clinic (Demo)',
    timeLabel: 'Today · 5:30 PM',
    feeInr: 300,
  },
  {
    id: 'slot-2',
    doctorName: 'Dr. Kavitha Devi (Sample)',
    specialty: 'Ophthalmology (Eye Care)',
    clinic: 'L V Prasad Outreach Center (Demo)',
    timeLabel: 'Tomorrow · 10:15 AM',
    feeInr: 400,
  },
  {
    id: 'slot-3',
    doctorName: 'Dr. Srinivas Rao (Sample)',
    specialty: 'Cardiology',
    clinic: 'Ramesh Sample Heart Clinic',
    timeLabel: 'Tomorrow · 4:00 PM',
    feeInr: 600,
  },
];

export function createSimulatedAppointment(slotId: string): AppointmentState {
  const slot = DOCTOR_SLOTS.find((s) => s.id === slotId) ?? DOCTOR_SLOTS[0];
  const appt: AppointmentState = {
    simulated: true,
    appointmentId: `SIM-APT-${crypto.randomInt(1000, 9999)}`,
    slot,
    status: 'booked_simulated',
    bookedAt: new Date().toISOString(),
  };
  appointmentStore.set(appt.appointmentId, appt);
  return appt;
}

export function getSimulatedElectricityBill(): ElectricityBillInfo {
  return sampleElectricityBill;
}

export function paySimulatedElectricityBill(): ElectricityBillInfo {
  sampleElectricityBill = {
    ...sampleElectricityBill,
    status: 'paid_simulated',
    receiptId: `SIM-BILL-${crypto.randomInt(10000, 99999)}`,
  };
  return sampleElectricityBill;
}

export function getSimulatedNotifications(): NotificationItem[] {
  return [
    {
      id: 'notif-1',
      simulated: true,
      source: 'Electricity Utility (Sample)',
      priority: 'high',
      title: 'Electricity bill due on 5 December',
      body: 'Consumer AP-8842-1093 has an unpaid sample bill of 1,240 rupees.',
      teluguSummary: 'డిసెంబర్ 5న కరెంట్ బిల్లు 1,240 రూపాయలు చెల్లించాల్సి ఉంది.',
      timestamp: 'Today · 9:15 AM',
    },
    {
      id: 'notif-2',
      simulated: true,
      source: 'Health Reminder (Sample)',
      priority: 'normal',
      title: 'Evening medication reminder',
      body: 'Sample reminder to take evening blood-pressure tablet after dinner at 8:30 PM.',
      teluguSummary: 'రాత్రి 8:30కి భోజనం తర్వాత మందు వేసుకోవాలని గుర్తుచేస్తున్నాము.',
      timestamp: 'Today · 8:00 AM',
    },
    {
      id: 'notif-3',
      simulated: true,
      source: 'Railway Alert (Sample)',
      priority: 'normal',
      title: 'Train 12727 Godavari Express on time',
      body: 'Expected arrival at Vijayawada Junction Platform 4 at 6:40 PM (sample schedule).',
      teluguSummary: 'గోదావరి ఎక్స్‌ప్రెస్ సమయానికే విజయవాడ జంక్షన్‌కు చేరుకుంటుంది.',
      timestamp: 'Yesterday · 6:20 PM',
    },
  ];
}

export function runSimulatedSearch(query: string): SearchResultItem[] {
  const lower = query.toLowerCase();
  if (/train|vijayawada|railway/i.test(lower)) {
    return [
      {
        title: 'Vijayawada Junction (BZA) Accessibility Desk',
        summary: 'Sample info: Battery-operated wheelchairs and tactile pathways are available near Platform 1 East Entrance.',
        source: 'Sample Accessibility Directory',
      },
      {
        title: 'Sample Train Schedule Lookup',
        summary: 'Godavari Express (12727) & Pinakini Express (12711) depart daily. Always verify live IRCTC/NTES status before travel.',
        source: 'Simulated Transit Feed',
      },
    ];
  }
  if (/weather|rain|temperature/i.test(lower)) {
    return [
      {
        title: 'Vijayawada Local Weather (Sample)',
        summary: '30 degrees Celsius, light breeze, low chance of rain this evening.',
        source: 'Sample Weather Card',
      },
    ];
  }
  return [
    {
      title: `Accessible Summary: ${query}`,
      summary: `Simulated offline search summary for "${query}". When connected to live Gemini AI, general knowledge questions are answered conversationally and read aloud.`,
      source: 'Voice Access Demonstration Index',
    },
  ];
}
