import {
  Bell,
  CalendarCheck,
  Car,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  MapPin,
  Pill,
  Search,
  ShieldAlert,
  Volume2,
  Zap,
} from 'lucide-react';
import type {
  AppointmentState,
  CabBookingState,
  CabEstimateResponse,
  DoctorSlot,
  ElectricityBillInfo,
  MedicineCatalogItem,
  MedicineOrderState,
  NotificationItem,
  SearchResultItem,
} from '../types/assistant';

export type ActiveWorkflowState =
  | { type: 'none' }
  | { type: 'clarification'; question: string; originalUtterance: string }
  | { type: 'cab_location_prompt'; destination: string; preferredCategory: 'auto' | 'mini' | 'sedan' }
  | { type: 'cab_estimate'; estimate: CabEstimateResponse; selectedCategory: 'auto' | 'mini' | 'sedan' }
  | { type: 'cab_booked'; booking: CabBookingState }
  | { type: 'medicine_catalog'; items: MedicineCatalogItem[]; selectedId: string }
  | { type: 'medicine_ordered'; order: MedicineOrderState }
  | { type: 'doctor_slots'; slots: DoctorSlot[]; selectedSlotId: string }
  | { type: 'appointment_booked'; appointment: AppointmentState }
  | { type: 'electricity_bill'; bill: ElectricityBillInfo }
  | { type: 'notifications'; items: NotificationItem[] }
  | { type: 'search_results'; query: string; results: SearchResultItem[] }
  | { type: 'app_shortcut'; appName: string };

interface ActiveWorkflowPanelProps {
  workflow: ActiveWorkflowState;
  onGrantBrowserLocation: () => void;
  onUseSampleLocation: () => void;
  onDeclineLocation: () => void;
  onSelectCabCategory: (category: 'auto' | 'mini' | 'sedan') => void;
  onConfirmCabBooking: () => void;
  onRequestCabOtp: (bookingId: string) => void;
  onCancelCabBooking: (bookingId: string) => void;
  onSelectMedicine: (medicineId: string) => void;
  onConfirmMedicineOrder: (medicineId: string) => void;
  onSelectDoctorSlot: (slotId: string) => void;
  onConfirmAppointment: (slotId: string) => void;
  onConfirmPayBill: () => void;
  onSpeakText: (text: string) => void;
  onChooseClarificationOption: (utterance: string) => void;
}

export function ActiveWorkflowPanel({
  workflow,
  onGrantBrowserLocation,
  onUseSampleLocation,
  onDeclineLocation,
  onSelectCabCategory,
  onConfirmCabBooking,
  onRequestCabOtp,
  onCancelCabBooking,
  onSelectMedicine,
  onConfirmMedicineOrder,
  onSelectDoctorSlot,
  onConfirmAppointment,
  onConfirmPayBill,
  onSpeakText,
  onChooseClarificationOption,
}: ActiveWorkflowPanelProps) {
  if (workflow.type === 'none') {
    return (
      <section
        aria-label="Active task workspace"
        className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
          Active Task Workspace
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          When you request a cab, medicine order, doctor appointment, electricity bill, or notification readout,
          step-by-step confirmation details appear here and are simultaneously read aloud.
        </p>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 text-xs text-slate-600 dark:text-slate-400">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
            <strong className="block text-slate-900 dark:text-slate-100">Simulated Services Notice</strong>
            Bookings, fares, OTPs, and utility payments are clearly marked sample workflows for demonstration.
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
            <strong className="block text-slate-900 dark:text-slate-100">Permission & PIN Protection</strong>
            Location access and sensitive actions always require your explicit confirmation first.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Active task details"
      aria-live="polite"
      className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Clarification Prompt */}
      {workflow.type === 'clarification' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-300">
            <ShieldAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold">Clarification Needed</h2>
          </div>
          <p className="text-base leading-relaxed text-slate-900 dark:text-slate-100">{workflow.question}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Original input: &ldquo;{workflow.originalUtterance}&rdquo;
          </p>
          <div className="grid gap-2 sm:grid-cols-2 pt-2">
            {[
              { label: 'Book a cab to Vijayawada Railway Station', cmd: 'Book a cab to Vijayawada railway station' },
              { label: 'Check Electricity Bill', cmd: 'Check my electricity bill' },
              { label: 'Order Paracetamol Medicine', cmd: 'Order Paracetamol 650mg' },
              { label: 'Read My Notifications', cmd: 'Read my notifications' },
            ].map((opt) => (
              <button
                key={opt.cmd}
                type="button"
                onClick={() => onChooseClarificationOption(opt.cmd)}
                className="min-h-[48px] rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-left text-sm font-semibold text-slate-900 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cab Step 1: Location Permission */}
      {workflow.type === 'cab_location_prompt' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 text-blue-700 dark:text-yellow-300">
            <MapPin className="h-5 w-5 shrink-0" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold">Location Permission Required</h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            To estimate a sample cab fare to <strong>{workflow.destination}</strong>, Voice Access needs permission
            to determine your pickup point.
          </p>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={onGrantBrowserLocation}
              className="min-h-[48px] flex-1 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800"
            >
              Allow Device GPS Location
            </button>
            <button
              type="button"
              onClick={onUseSampleLocation}
              className="min-h-[48px] flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              Use Sample Pickup (MG Road)
            </button>
            <button
              type="button"
              onClick={onDeclineLocation}
              className="min-h-[48px] rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-900 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Cab Step 2: Estimate & Category Selection */}
      {workflow.type === 'cab_estimate' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Car className="h-5 w-5 text-blue-700 dark:text-yellow-300" aria-hidden="true" />
              <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                Cab Estimate (Simulated Data)
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onSpeakText(workflow.estimate.spokenSummary)}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-xs font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100"
            >
              <Volume2 className="h-4 w-4" aria-hidden="true" />
              <span>Read Fares Aloud</span>
            </button>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sample Pickup</span>
              <p className="font-semibold text-slate-950 dark:text-white">{workflow.estimate.pickup}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Destination</span>
              <p className="font-semibold text-slate-950 dark:text-white">{workflow.estimate.destination}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Estimated Distance</span>
              <p className="font-mono-tabular font-semibold text-slate-950 dark:text-white">
                {workflow.estimate.distanceKm} km
              </p>
            </div>
          </div>

          <div className="space-y-2.5" role="radiogroup" aria-label="Select simulated cab category">
            {workflow.estimate.categories.map((cat) => {
              const selected = workflow.selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onSelectCabCategory(cat.id)}
                  className={`flex min-h-[64px] w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition-colors ${
                    selected
                      ? 'border-blue-700 bg-blue-50 dark:border-yellow-400 dark:bg-slate-800'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950'
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold text-slate-950 dark:text-white">{cat.name}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      {cat.teluguName} · {cat.capacity} · ETA {cat.etaMinutes} mins
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono-tabular text-lg font-bold text-slate-950 dark:text-white">
                      ₹{cat.estimatedFareInr}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{cat.simulatedLabel}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onConfirmCabBooking}
              className="min-h-[52px] w-full rounded-xl bg-blue-700 px-5 py-3 text-base font-bold text-white transition-colors hover:bg-blue-800"
            >
              Confirm Simulated Cab Booking (Requires PIN Authorization)
            </button>
          </div>
        </div>
      )}

      {/* Cab Step 3: Confirmed Simulated Booking + On-Demand Test OTP */}
      {workflow.type === 'cab_booked' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              <h2 className="font-display text-lg font-bold">
                {workflow.booking.status === 'cancelled'
                  ? 'Simulated Booking Cancelled'
                  : 'Simulated Cab Booking Confirmed'}
              </h2>
            </div>
            <span className="font-mono-tabular text-xs font-bold text-slate-600 dark:text-slate-300">
              {workflow.booking.bookingId}
            </span>
          </div>

          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-medium text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
            Demonstration Notice: This is a simulated prototype booking. No real vehicle has been dispatched.
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Category & Estimated Fare</dt>
              <dd className="font-mono-tabular font-bold text-slate-950 dark:text-white">
                {workflow.booking.categoryName} · ₹{workflow.booking.estimatedFareInr}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Sample Driver & Vehicle</dt>
              <dd className="font-semibold text-slate-950 dark:text-white">
                {workflow.booking.driverName} · {workflow.booking.vehicleNumber}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Route</dt>
              <dd className="font-medium text-slate-900 dark:text-slate-200">
                {workflow.booking.pickup} → {workflow.booking.destination}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Arrival Estimate</dt>
              <dd className="font-mono-tabular font-bold text-slate-950 dark:text-white">
                {workflow.booking.etaMinutes} minutes
              </dd>
            </div>
          </dl>

          {/* Test OTP Section: strictly hidden until explicitly requested */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-950 dark:text-white">
                  <KeyRound className="h-4 w-4 text-blue-700 dark:text-yellow-300" aria-hidden="true" />
                  <span>Ride Test OTP Protection</span>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  For privacy, test OTPs are never exposed or spoken automatically unless you explicitly request them.
                </p>
              </div>
              {workflow.booking.status !== 'cancelled' && (
                <button
                  type="button"
                  onClick={() => onRequestCabOtp(workflow.booking.bookingId)}
                  className="min-h-[48px] rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 whitespace-nowrap shrink-0 dark:bg-blue-600"
                >
                  Read Test OTP Aloud
                </button>
              )}
            </div>

            {workflow.booking.revealedTestOtp && (
              <div className="mt-3 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 dark:border-blue-800 dark:bg-blue-950/50">
                <span className="text-xs font-bold text-blue-950 dark:text-blue-200">
                  Simulated Test OTP (Demo Only):
                </span>
                <span className="font-mono-tabular text-xl font-extrabold tracking-widest text-blue-900 dark:text-yellow-300">
                  {workflow.booking.revealedTestOtp}
                </span>
              </div>
            )}
          </div>

          {workflow.booking.status !== 'cancelled' && (
            <button
              type="button"
              onClick={() => onCancelCabBooking(workflow.booking.bookingId)}
              className="min-h-[44px] rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-bold text-red-900 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
            >
              Cancel Simulated Ride
            </button>
          )}
        </div>
      )}

      {/* Medicine Ordering Workflow */}
      {workflow.type === 'medicine_catalog' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3 dark:border-slate-800">
            <Pill className="h-5 w-5 text-blue-700 dark:text-yellow-300" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
              Medicine Order (Simulated Pharmacy)
            </h2>
          </div>
          <div className="space-y-2.5">
            {workflow.items.map((item) => {
              const selected = workflow.selectedId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectMedicine(item.id)}
                  className={`flex min-h-[64px] w-full items-center justify-between gap-4 rounded-xl border p-4 text-left ${
                    selected
                      ? 'border-blue-700 bg-blue-50 dark:border-yellow-400 dark:bg-slate-800'
                      : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950'
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold text-slate-950 dark:text-white">{item.name}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      {item.pharmacy} · {item.dosage} · {item.deliveryEta}
                    </div>
                  </div>
                  <div className="font-mono-tabular text-base font-bold text-slate-950 dark:text-white shrink-0">
                    ₹{item.priceInr}
                  </div>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => onConfirmMedicineOrder(workflow.selectedId)}
            className="min-h-[52px] w-full rounded-xl bg-blue-700 px-5 py-3 text-base font-bold text-white hover:bg-blue-800"
          >
            Confirm Simulated Medicine Order (Requires PIN)
          </button>
        </div>
      )}

      {workflow.type === 'medicine_ordered' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold">Simulated Medicine Order Placed</h2>
          </div>
          <p className="text-sm text-slate-800 dark:text-slate-200">
            Order <span className="font-mono-tabular font-bold">{workflow.order.orderId}</span> for{' '}
            <strong>{workflow.order.item.name}</strong> (Total ₹{workflow.order.totalInr}) from{' '}
            {workflow.order.item.pharmacy}. Sample ETA: {workflow.order.item.deliveryEta}.
          </p>
        </div>
      )}

      {/* Doctor Appointment Workflow */}
      {workflow.type === 'doctor_slots' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3 dark:border-slate-800">
            <CalendarCheck className="h-5 w-5 text-blue-700 dark:text-yellow-300" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
              Doctor Appointments (Simulated Clinics)
            </h2>
          </div>
          <div className="space-y-2.5">
            {workflow.slots.map((slot) => {
              const selected = workflow.selectedSlotId === slot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => onSelectDoctorSlot(slot.id)}
                  className={`flex min-h-[64px] w-full items-center justify-between gap-4 rounded-xl border p-4 text-left ${
                    selected
                      ? 'border-blue-700 bg-blue-50 dark:border-yellow-400 dark:bg-slate-800'
                      : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950'
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold text-slate-950 dark:text-white">
                      {slot.doctorName} · {slot.specialty}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      {slot.clinic} · {slot.timeLabel}
                    </div>
                  </div>
                  <div className="font-mono-tabular text-base font-bold text-slate-950 dark:text-white shrink-0">
                    ₹{slot.feeInr}
                  </div>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => onConfirmAppointment(workflow.selectedSlotId)}
            className="min-h-[52px] w-full rounded-xl bg-blue-700 px-5 py-3 text-base font-bold text-white hover:bg-blue-800"
          >
            Confirm Simulated Appointment
          </button>
        </div>
      )}

      {workflow.type === 'appointment_booked' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold">Simulated Appointment Confirmed</h2>
          </div>
          <p className="text-sm text-slate-800 dark:text-slate-200">
            Booking ID <span className="font-mono-tabular font-bold">{workflow.appointment.appointmentId}</span> with{' '}
            <strong>{workflow.appointment.slot.doctorName}</strong> ({workflow.appointment.slot.timeLabel}).
          </p>
        </div>
      )}

      {/* Electricity Bill Workflow */}
      {workflow.type === 'electricity_bill' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Zap className="h-5 w-5 text-blue-700 dark:text-yellow-300" aria-hidden="true" />
              <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                Electricity Bill (Simulated Utility)
              </h2>
            </div>
            <span className="font-mono-tabular text-xs font-bold text-slate-600 dark:text-slate-400">
              {workflow.bill.consumerNumber}
            </span>
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Utility Provider</dt>
              <dd className="font-semibold text-slate-950 dark:text-white">{workflow.bill.provider}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Billing Cycle & Units</dt>
              <dd className="font-mono-tabular font-semibold text-slate-950 dark:text-white">
                {workflow.bill.billingMonth} · {workflow.bill.unitsConsumed} kWh
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Amount Due</dt>
              <dd className="font-mono-tabular text-xl font-extrabold text-slate-950 dark:text-white">
                ₹{workflow.bill.amountDueInr}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Status & Due Date</dt>
              <dd className="font-semibold text-slate-950 dark:text-white">
                {workflow.bill.status === 'paid_simulated'
                  ? `Paid (Simulated Receipt ${workflow.bill.receiptId})`
                  : `Unpaid · Due ${workflow.bill.dueDate}`}
              </dd>
            </div>
          </dl>

          {workflow.bill.status === 'unpaid' && (
            <button
              type="button"
              onClick={onConfirmPayBill}
              className="min-h-[52px] w-full rounded-xl bg-blue-700 px-5 py-3 text-base font-bold text-white hover:bg-blue-800"
            >
              Simulate Bill Payment (Requires PIN Authorization)
            </button>
          )}
        </div>
      )}

      {/* Notifications Workflow */}
      {workflow.type === 'notifications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Bell className="h-5 w-5 text-blue-700 dark:text-yellow-300" aria-hidden="true" />
              <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                Important Notifications (Sample)
              </h2>
            </div>
            <button
              type="button"
              onClick={() =>
                onSpeakText(
                  workflow.items.map((n, idx) => `Alert ${idx + 1}: ${n.title}. ${n.body}`).join(' ')
                )
              }
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-xs font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100"
            >
              <Volume2 className="h-4 w-4" aria-hidden="true" />
              <span>Read All Aloud</span>
            </button>
          </div>
          <ul className="space-y-3">
            {workflow.items.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {item.source} · {item.timestamp}
                </div>
                <div className="mt-1 text-sm font-bold text-slate-950 dark:text-white">{item.title}</div>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{item.body}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400" lang="te">
                  {item.teluguSummary}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Search Results */}
      {workflow.type === 'search_results' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3 dark:border-slate-800">
            <Search className="h-5 w-5 text-blue-700 dark:text-yellow-300" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
              Accessible Search Summary: &ldquo;{workflow.query}&rdquo;
            </h2>
          </div>
          <div className="space-y-3">
            {workflow.results.map((res, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{res.source}</div>
                <div className="mt-1 text-sm font-bold text-slate-950 dark:text-white">{res.title}</div>
                <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{res.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* App Shortcut Simulation */}
      {workflow.type === 'app_shortcut' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 text-blue-700 dark:text-yellow-300">
            <ExternalLink className="h-5 w-5 shrink-0" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold">
              {workflow.appName} Integration (Simulated Web Bridge)
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            Web browsers run in a security sandbox and cannot directly launch native Android packages without an
            Android Accessibility Service companion app. In a full Android build, Voice Access routes{' '}
            <strong>{workflow.appName}</strong> intents via Android App Links and Accessibility Actions.
          </p>
        </div>
      )}
    </section>
  );
}
