import { useEffect, useRef, useState } from 'react';
import { Fingerprint, Lock, ShieldCheck, X } from 'lucide-react';
import { BRAND_CONFIG } from '../config/branding';

interface SecurityPinModalProps {
  isOpen: boolean;
  actionDescription: string;
  onVerifyPin: (pin: string) => Promise<void>;
  onVerifyBiometricDemo: () => Promise<void>;
  onCancel: () => void;
  errorMessage: string | null;
  isVerifying: boolean;
}

export function SecurityPinModal({
  isOpen,
  actionDescription,
  onVerifyPin,
  onVerifyBiometricDemo,
  onCancel,
  errorMessage,
  isVerifying,
}: SecurityPinModalProps) {
  const [pin, setPin] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim().length >= 4) {
      void onVerifyPin(pin.trim());
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="security-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Lock className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="security-modal-title" className="font-display text-lg font-bold text-slate-950 dark:text-white">
                Security Authorization Required
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Simulated voice-spoofing safeguard
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close security authorization dialog"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          {actionDescription}
        </p>

        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
          <strong>Protection rule:</strong> Voice commands alone cannot authorize payments, bookings, or OTP reading.
          Enter the demo PIN (<span className="font-mono-tabular font-bold">{BRAND_CONFIG.demoSecurityPinHint}</span>) or
          use simulated biometric verification.
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="security-pin-input" className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
              4-Digit Demo Security PIN
            </label>
            <input
              ref={inputRef}
              id="security-pin-input"
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4,6}"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 1234"
              className="font-mono-tabular mt-1.5 min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-4 text-lg tracking-widest text-slate-950 focus:border-blue-700 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              autoComplete="off"
            />
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-red-300 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-900 dark:border-red-800 dark:bg-red-950/60 dark:text-red-200"
            >
              {errorMessage}
            </div>
          )}

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <button
              type="submit"
              disabled={isVerifying || pin.length < 4}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{isVerifying ? 'Verifying...' : 'Authorize with PIN'}</span>
            </button>

            <button
              type="button"
              disabled={isVerifying}
              onClick={() => void onVerifyBiometricDemo()}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
            >
              <Fingerprint className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Demo Biometric</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
