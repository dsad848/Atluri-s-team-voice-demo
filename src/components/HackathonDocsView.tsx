import type { SpeechSupportInfo } from '../services/speechService';

interface HackathonDocsViewProps {
  aiConfigured: boolean;
  speechSupport: SpeechSupportInfo;
}

const MODULES = [
  {
    file: 'server.ts',
    purpose:
      'Express backend serving Gemini NLU (/api/assistant/understand), PIN verification (/api/security/verify-pin), and simulated service endpoints.',
  },
  {
    file: 'server/nluFallback.ts',
    purpose:
      'Bilingual English, Telugu, and Tenglish intent parser that powers Demonstration Mode when GEMINI_API_KEY is absent or offline.',
  },
  {
    file: 'server/simulatedServices.ts',
    purpose:
      'Modular in-memory service adapters for cabs (with hidden test OTP until requested), medicines, clinics, electricity bills, and alerts.',
  },
  {
    file: 'src/services/speechService.ts',
    purpose:
      'Web Speech API STT (en-IN / te-IN), SpeechSynthesis TTS with rate & repeat/interrupt controls, and Web Audio API earcon cues.',
  },
  {
    file: 'src/components/VoiceConsole.tsx',
    purpose:
      'Accessible focal microphone button, live state feedback, language switcher, and text fallback input.',
  },
  {
    file: 'src/components/ActiveWorkflowPanel.tsx',
    purpose:
      'Step-by-step confirmation views for cab location permission, fare selection, PIN-gated booking, and on-demand test OTP readout.',
  },
];

export function HackathonDocsView({ aiConfigured, speechSupport }: HackathonDocsViewProps) {
  return (
    <section aria-label="Architecture and environment capabilities" className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="font-display text-2xl font-bold text-slate-950 dark:text-white">
          Modular Architecture & Real vs. Simulated Capabilities
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Voice Access separates speech I/O, natural language understanding, security gating, and service adapters into
          clean TypeScript modules so individual Indian languages or real partner APIs can be plugged in incrementally.
        </p>

        {/* Live Environment Diagnostic Summary */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">NLU Engine Status</div>
            <div className="mt-1 text-base font-bold text-slate-950 dark:text-white">
              {aiConfigured ? 'Gemini API + Demo Fallback' : 'Offline Demonstration Mode'}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Browser Speech Input (STT)</div>
            <div className="mt-1 text-base font-bold text-slate-950 dark:text-white">
              {speechSupport.sttSupported ? 'Web Speech API Available' : 'Unavailable (Text Fallback Active)'}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Telugu TTS Voice</div>
            <div className="mt-1 text-base font-bold text-slate-950 dark:text-white">
              {speechSupport.teluguVoiceAvailable ? 'Native te-IN Voice Found' : 'Device Fallback Voice'}
            </div>
          </div>
        </div>

        {/* Codebase Module Map */}
        <div className="mt-8">
          <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
            Core Source Modules
          </h2>
          <div className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {MODULES.map((m) => (
              <div key={m.file} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-baseline sm:gap-6">
                <code className="font-mono-tabular text-sm font-bold text-blue-700 shrink-0 sm:w-64 dark:text-yellow-300">
                  {m.file}
                </code>
                <p className="text-sm text-slate-700 dark:text-slate-300">{m.purpose}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Real vs Simulated Matrix */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
            <h2 className="font-display text-base font-bold text-slate-950 dark:text-white">
              Implemented & Working
            </h2>
            <ul className="mt-2.5 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li>Real browser Speech-to-Text & Text-to-Speech (en-IN / te-IN)</li>
              <li>Server-side Gemini NLU with automatic offline fallback</li>
              <li>Keyboard shortcuts, screen-reader landmarks, high contrast, earcons</li>
              <li>Server-side PIN verification & ephemeral Bearer token gating</li>
              <li>Interactive multi-step cab, medicine, doctor, bill & alert flows</li>
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
            <h2 className="font-display text-base font-bold text-slate-950 dark:text-white">
              Simulated for Prototype Safety
            </h2>
            <ul className="mt-2.5 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li>Cab fleet dispatch, sample fares, driver info, and test OTPs</li>
              <li>Pharmacy inventory, clinic slots, and APSPDCL bill balances</li>
              <li>Biometric touch confirmation & Android native app-launch bridge</li>
              <li>Future integrations: ONDC Mobility, ABDM/eSanjeevani, BBPS UPI, Android Accessibility Service</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
