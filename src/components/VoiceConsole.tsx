import { useState } from 'react';
import { AlertCircle, Mic, MicOff, RotateCcw, Send, Square, Volume2, XCircle } from 'lucide-react';
import { BRAND_CONFIG } from '../config/branding';
import type { SpeechSupportInfo } from '../services/speechService';
import type { LanguageCode } from '../types/assistant';

export type AssistantPhase = 'idle' | 'listening' | 'processing' | 'speaking';

interface VoiceConsoleProps {
  phase: AssistantPhase;
  interimTranscript: string;
  selectedLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onToggleListening: () => void;
  onStopSpeaking: () => void;
  onRepeatLast: () => void;
  onCancelOperation: () => void;
  onSubmitTextCommand: (text: string) => void;
  hasLastSpoken: boolean;
  hasPendingWorkflow: boolean;
  aiNotice: string | null;
  speechSupport: SpeechSupportInfo;
}

const SAMPLE_PROMPTS: Array<{ label: string; command: string; langTag: string }> = [
  {
    label: 'Cab to Vijayawada Station',
    command: 'Book a cab to Vijayawada railway station',
    langTag: 'English',
  },
  {
    label: 'విజయవాడ రైల్వే స్టేషన్ క్యాబ్',
    command: 'విజయవాడ రైల్వే స్టేషన్‌కు క్యాబ్ బుక్ చేయి',
    langTag: 'తెలుగు',
  },
  {
    label: 'Read Ride Test OTP',
    command: 'Read my cab OTP aloud',
    langTag: 'English',
  },
  {
    label: 'Check Electricity Bill',
    command: 'Check my electricity bill',
    langTag: 'English',
  },
  {
    label: 'Order Medicine',
    command: 'Order Paracetamol 650mg medicine',
    langTag: 'English',
  },
  {
    label: 'నోటిఫికేషన్లు చదువు',
    command: 'నా నోటిఫికేషన్లు చదువు',
    langTag: 'తెలుగు',
  },
];

export function VoiceConsole({
  phase,
  interimTranscript,
  selectedLanguage,
  onSelectLanguage,
  onToggleListening,
  onStopSpeaking,
  onRepeatLast,
  onCancelOperation,
  onSubmitTextCommand,
  hasLastSpoken,
  hasPendingWorkflow,
  aiNotice,
  speechSupport,
}: VoiceConsoleProps) {
  const [textInput, setTextInput] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = textInput.trim();
    if (!trimmed) return;
    onSubmitTextCommand(trimmed);
    setTextInput('');
  };

  const phaseLabel =
    phase === 'listening'
      ? 'Listening — speak your command clearly'
      : phase === 'processing'
        ? 'Processing your request'
        : phase === 'speaking'
          ? 'Speaking response aloud'
          : 'Ready — tap the microphone or press Space to speak';

  return (
    <section
      aria-label="Voice assistant primary control"
      className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Top Language Selector & Explicit AI Mode Notice */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white">
            Speak in English or Telugu
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Hands-free voice control for cabs, medicines, appointments, utility bills, and alerts.
          </p>
        </div>

        <div
          role="group"
          aria-label="Voice language selector"
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 self-start dark:border-slate-700 dark:bg-slate-950"
        >
          {BRAND_CONFIG.supportedLanguages.map((lang) => {
            const active = selectedLanguage === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => onSelectLanguage(lang.code)}
                aria-pressed={active}
                className={`min-h-[40px] rounded-lg px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-white text-slate-950 shadow-sm dark:bg-blue-600 dark:text-white'
                    : 'text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                {lang.nativeLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Explicit AI Key / Browser Speech Limitation Notices */}
      {(aiNotice || speechSupport.limitationMessage) && (
        <div className="mt-4 space-y-2.5" role="status" aria-live="polite">
          {aiNotice && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
              <span>{aiNotice}</span>
            </div>
          )}
          {speechSupport.limitationMessage && (
            <div className="flex items-start gap-3 rounded-xl border border-slate-300 bg-slate-50 p-3.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-600 dark:text-slate-400" aria-hidden="true" />
              <span>{speechSupport.limitationMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Dominant Microphone Focal Anchor */}
      <div className="mt-8 flex flex-col items-center text-center">
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={onToggleListening}
            aria-pressed={phase === 'listening'}
            aria-label={
              phase === 'listening'
                ? 'Stop listening'
                : 'Start voice command microphone'
            }
            className={`relative flex h-32 w-32 sm:h-36 sm:w-36 flex-col items-center justify-center gap-2 rounded-full border-4 font-display text-sm font-bold transition-transform active:scale-95 ${
              phase === 'listening'
                ? 'border-red-300 bg-red-700 text-white shadow-xl shadow-red-700/25 dark:border-red-400'
                : phase === 'processing'
                  ? 'border-amber-300 bg-amber-600 text-white shadow-lg'
                  : phase === 'speaking'
                    ? 'border-emerald-300 bg-emerald-700 text-white shadow-lg'
                    : 'border-blue-200 bg-blue-700 text-white shadow-xl shadow-blue-700/20 hover:bg-blue-800 dark:border-yellow-400 dark:bg-blue-600 dark:hover:bg-blue-500'
            }`}
          >
            {phase === 'listening' ? (
              <MicOff className="h-11 w-11 shrink-0" aria-hidden="true" />
            ) : phase === 'speaking' ? (
              <Volume2 className="h-11 w-11 shrink-0" aria-hidden="true" />
            ) : (
              <Mic className="h-11 w-11 shrink-0" aria-hidden="true" />
            )}
            <span>
              {phase === 'listening'
                ? 'Listening'
                : phase === 'processing'
                  ? 'Thinking'
                  : phase === 'speaking'
                    ? 'Speaking'
                    : 'Tap to Speak'}
            </span>
          </button>
        </div>

        {/* Live Audio Waveform Indicator (only shown during active listening/speaking) */}
        {(phase === 'listening' || phase === 'speaking') && (
          <div className="mt-4 flex h-7 items-end gap-1.5" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5, 6].map((bar) => (
              <span
                key={bar}
                className={`w-1.5 rounded-full transition-all duration-150 ${
                  phase === 'listening' ? 'bg-red-600 dark:bg-red-400' : 'bg-emerald-600 dark:bg-emerald-400'
                }`}
                style={{
                  height: `${12 + ((bar * 7) % 18)}px`,
                }}
              />
            ))}
          </div>
        )}

        <p
          role="status"
          aria-live="assertive"
          className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100"
        >
          {phaseLabel}
        </p>

        {interimTranscript && (
          <p className="mt-2 max-w-xl rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
            Hearing: &ldquo;{interimTranscript}&rdquo;
          </p>
        )}

        {/* Primary Voice Utility Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onStopSpeaking}
            disabled={phase !== 'speaking' && phase !== 'listening'}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
          >
            <Square className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Stop / Interrupt</span>
          </button>

          <button
            type="button"
            onClick={onRepeatLast}
            disabled={!hasLastSpoken}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
          >
            <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Repeat Response</span>
          </button>

          <button
            type="button"
            onClick={onCancelOperation}
            disabled={!hasPendingWorkflow}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-900 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-45 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200 dark:hover:bg-red-900/60"
          >
            <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Cancel Task</span>
          </button>
        </div>
      </div>

      {/* Fallback Accessible Text Command Input */}
      <form onSubmit={handleFormSubmit} className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
        <label htmlFor="voice-text-fallback" className="block text-sm font-bold text-slate-900 dark:text-slate-100">
          Type or test a voice command (English, Telugu, or Tenglish)
        </label>
        <div className="mt-2 flex flex-col gap-2.5 sm:flex-row">
          <input
            id="voice-text-fallback"
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="e.g. Book a cab to Vijayawada railway station or నా కరెంట్ బిల్లు ఎంత"
            className="min-h-[48px] flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 text-base text-slate-950 placeholder:text-slate-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || phase === 'processing'}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-45 whitespace-nowrap shrink-0 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Send Command</span>
          </button>
        </div>
      </form>

      {/* One-Tap Quick Voice Demo Commands */}
      <div className="mt-5">
        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
          Quick demonstration phrases (tap to run and hear spoken output):
        </p>
        <div className="mt-2.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_PROMPTS.map((item) => (
            <button
              key={item.command}
              type="button"
              onClick={() => onSubmitTextCommand(item.command)}
              className="flex min-h-[48px] flex-col items-start justify-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-left transition-colors hover:border-blue-400 hover:bg-blue-50/60 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-yellow-400 dark:hover:bg-slate-800"
            >
              <span className="text-sm font-semibold text-slate-950 dark:text-white">{item.label}</span>
              <span className="text-xs text-slate-600 dark:text-slate-400">{item.langTag}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
