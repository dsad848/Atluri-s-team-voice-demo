import { Eye, Lock, Mic, Volume2 } from 'lucide-react';
import { BRAND_CONFIG } from '../config/branding';
import type { AccessibilitySettings, LanguageCode } from '../types/assistant';

interface AccessibilitySettingsPanelProps {
  settings: AccessibilitySettings;
  onUpdateSettings: (next: AccessibilitySettings) => void;
  selectedLanguage: LanguageCode;
  onChangeLanguage: (lang: LanguageCode) => void;
  isAuthorizedSession: boolean;
  onLockSession: () => void;
}

export function AccessibilitySettingsPanel({
  settings,
  onUpdateSettings,
  selectedLanguage,
  onChangeLanguage,
  isAuthorizedSession,
  onLockSession,
}: AccessibilitySettingsPanelProps) {
  const toggleSetting = (key: keyof AccessibilitySettings) => {
    const current = settings[key];
    if (typeof current === 'boolean') {
      onUpdateSettings({ ...settings, [key]: !current });
    }
  };

  return (
    <section
      aria-label="Accessibility and security settings"
      className="mx-auto max-w-4xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
        <h1 className="font-display text-2xl font-bold text-slate-950 dark:text-white">
          Accessibility, Voice & Security Preferences
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Tailor contrast, typography scale, spoken feedback speed, language defaults, and sensitive-action PIN protection.
        </p>
      </div>

      {/* Visual & Reading Accessibility */}
      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
          <Eye className="h-5 w-5 text-blue-700 dark:text-yellow-300" aria-hidden="true" />
          <span>Visual & Screen Reader Comfort</span>
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            role="switch"
            aria-checked={settings.highContrast}
            onClick={() => toggleSetting('highContrast')}
            className="flex min-h-[64px] items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800"
          >
            <div>
              <div className="text-sm font-bold text-slate-950 dark:text-white">High-Contrast Dark Mode</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Dark slate canvas with high-visibility yellow focus outlines
              </div>
            </div>
            <span className="font-mono-tabular text-xs font-bold text-blue-700 dark:text-yellow-300">
              {settings.highContrast ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            type="button"
            role="switch"
            aria-checked={settings.largeText}
            onClick={() => toggleSetting('largeText')}
            className="flex min-h-[64px] items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800"
          >
            <div>
              <div className="text-sm font-bold text-slate-950 dark:text-white">Large Readable Text</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Increases interface font scaling for low-vision comfort
              </div>
            </div>
            <span className="font-mono-tabular text-xs font-bold text-blue-700 dark:text-yellow-300">
              {settings.largeText ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Speech & Audio Controls */}
      <div className="space-y-4 border-t border-slate-200 pt-5 dark:border-slate-800">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
          <Volume2 className="h-5 w-5 text-blue-700 dark:text-yellow-300" aria-hidden="true" />
          <span>Voice Output & Earcons</span>
        </h2>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="speech-rate-slider" className="text-sm font-bold text-slate-950 dark:text-white">
              Spoken Response Speed
            </label>
            <span className="font-mono-tabular text-sm font-bold text-blue-700 dark:text-yellow-300">
              {settings.speechRate.toFixed(2)}x
            </span>
          </div>
          <input
            id="speech-rate-slider"
            type="range"
            min="0.75"
            max="1.5"
            step="0.05"
            value={settings.speechRate}
            onChange={(e) => onUpdateSettings({ ...settings, speechRate: Number(e.target.value) })}
            className="mt-3 h-3 w-full cursor-pointer accent-blue-700 dark:accent-yellow-400"
          />
          <div className="mt-1.5 flex justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>0.75x (Slower)</span>
            <span>1.00x (Standard)</span>
            <span>1.50x (Faster)</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            role="switch"
            aria-checked={settings.audioEarcons}
            onClick={() => toggleSetting('audioEarcons')}
            className="flex min-h-[64px] items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800"
          >
            <div>
              <div className="text-sm font-bold text-slate-950 dark:text-white">Audio Cue Tones (Earcons)</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Gentle chime when microphone opens, closes, or succeeds
              </div>
            </div>
            <span className="font-mono-tabular text-xs font-bold text-blue-700 dark:text-yellow-300">
              {settings.audioEarcons ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            type="button"
            role="switch"
            aria-checked={settings.autoListenAfterReply}
            onClick={() => toggleSetting('autoListenAfterReply')}
            className="flex min-h-[64px] items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800"
          >
            <div>
              <div className="text-sm font-bold text-slate-950 dark:text-white">Hands-Free Follow-Up Listening</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Re-opens microphone automatically when assistant asks a question
              </div>
            </div>
            <span className="font-mono-tabular text-xs font-bold text-blue-700 dark:text-yellow-300">
              {settings.autoListenAfterReply ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Language Selection */}
      <div className="space-y-3 border-t border-slate-200 pt-5 dark:border-slate-800">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
          <Mic className="h-5 w-5 text-blue-700 dark:text-yellow-300" aria-hidden="true" />
          <span>Active Voice & Response Language</span>
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {BRAND_CONFIG.supportedLanguages.map((lang) => {
            const active = selectedLanguage === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => onChangeLanguage(lang.code)}
                aria-pressed={active}
                className={`min-h-[56px] rounded-xl border p-3.5 text-left transition-colors ${
                  active
                    ? 'border-blue-700 bg-blue-50 text-blue-950 dark:border-yellow-400 dark:bg-slate-800 dark:text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'
                }`}
              >
                <div className="text-sm font-bold">{lang.label}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">{lang.nativeLabel}</div>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Modular language adapters ready for: {BRAND_CONFIG.extensibleLanguages.join(', ')}.
        </p>
      </div>

      {/* Security Safeguards */}
      <div className="space-y-3 border-t border-slate-200 pt-5 dark:border-slate-800">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
          <Lock className="h-5 w-5 text-blue-700 dark:text-yellow-300" aria-hidden="true" />
          <span>Voice Security & Privacy Safeguards</span>
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
          <div>
            <div className="text-sm font-bold text-slate-950 dark:text-white">
              Require PIN / Biometric Authorization for Sensitive Actions
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Prevents bystanders from confirming bookings, bill payments, or reading OTPs via voice alone. Demo PIN: 1234.
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              role="switch"
              aria-checked={settings.securityPinRequired}
              onClick={() => toggleSetting('securityPinRequired')}
              className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {settings.securityPinRequired ? 'PIN Lock: ON' : 'PIN Lock: OFF'}
            </button>
            {isAuthorizedSession && (
              <button
                type="button"
                onClick={onLockSession}
                className="min-h-[44px] rounded-xl bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 dark:bg-blue-600"
              >
                Lock Session Now
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
