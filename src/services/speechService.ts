import type { LanguageCode } from '../types/assistant';

export interface SpeechSupportInfo {
  sttSupported: boolean;
  ttsSupported: boolean;
  teluguVoiceAvailable: boolean;
  englishVoiceAvailable: boolean;
  limitationMessage?: string;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstanceLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstanceLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export class VoiceSpeechService {
  private recognition: SpeechRecognitionInstanceLike | null = null;
  private lastSpokenText = '';
  private lastSpokenLang: LanguageCode = 'en-IN';
  private audioCtx: AudioContext | null = null;

  public getSupportInfo(selectedLanguage: LanguageCode): SpeechSupportInfo {
    const sttSupported = getSpeechRecognitionCtor() !== null;
    const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    const voices = ttsSupported ? window.speechSynthesis.getVoices() : [];
    const teluguVoiceAvailable = voices.some((v) => v.lang.toLowerCase().startsWith('te'));
    const englishVoiceAvailable = voices.some((v) => v.lang.toLowerCase().startsWith('en'));

    let limitationMessage: string | undefined;
    if (!sttSupported) {
      limitationMessage =
        'Browser speech recognition is unavailable in this browser. Use the accessible text input or quick voice-phrase buttons below — responses will still be read aloud.';
    } else if (selectedLanguage === 'te-IN' && voices.length > 0 && !teluguVoiceAvailable) {
      limitationMessage =
        'Telugu speech recognition is enabled via Web Speech API, though this device does not have a native Telugu TTS voice installed. Spoken replies will fall back to your device default voice if Telugu audio is unavailable.';
    }

    return {
      sttSupported,
      ttsSupported,
      teluguVoiceAvailable,
      englishVoiceAvailable,
      limitationMessage,
    };
  }

  public playEarcon(type: 'listen_start' | 'listen_stop' | 'success' | 'error', enabled: boolean): void {
    if (!enabled || typeof window === 'undefined') return;
    try {
      const AudioContextCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContextCtor();
      }
      if (this.audioCtx.state === 'suspended') {
        void this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (type === 'listen_start') {
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(760, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.17);
      } else if (type === 'listen_stop') {
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.12);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.23);
      } else {
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.setValueAtTime(220, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.26);
      }
    } catch {
      // Ignore Web Audio restriction errors silently
    }
  }

  public startListening(options: {
    language: LanguageCode;
    onInterim: (transcript: string) => void;
    onFinal: (transcript: string) => void;
    onError: (friendlyMessage: string) => void;
    onEnd: () => void;
  }): boolean {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      options.onError(
        'Voice input is not supported in this browser. Please type your request or choose a quick command below.'
      );
      return false;
    }

    this.stopListening();
    this.stopSpeaking();

    try {
      const recognition = new Ctor();
      this.recognition = recognition;
      recognition.lang = options.language === 'te-IN' ? 'te-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let settled = false;

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let interim = '';
        let finalText = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          const text = result[0]?.transcript ?? '';
          if (result.isFinal) {
            finalText += text;
          } else {
            interim += text;
          }
        }
        if (interim.trim()) {
          options.onInterim(interim.trim());
        }
        if (finalText.trim() && !settled) {
          settled = true;
          options.onFinal(finalText.trim());
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        if (settled) return;
        settled = true;
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          options.onError(
            'Microphone permission was denied. Please allow microphone access in browser settings or use the text input box.'
          );
        } else if (event.error === 'no-speech') {
          options.onError('No speech detected. Tap the microphone button again and speak clearly.');
        } else if (event.error === 'language-not-supported') {
          options.onError(
            `Speech recognition for ${options.language} is not supported on this device. Switching to text input or English voice input is available.`
          );
        } else if (event.error !== 'aborted') {
          options.onError(`Voice recognition stopped (${event.error}). You can try again or type your command.`);
        }
      };

      recognition.onend = () => {
        this.recognition = null;
        options.onEnd();
      };

      recognition.start();
      return true;
    } catch {
      options.onError('Could not start microphone listening. Please use the text input below.');
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // Ignore abort errors
      }
      this.recognition = null;
    }
  }

  public speak(
    text: string,
    language: LanguageCode,
    rate = 1.0,
    callbacks?: { onStart?: () => void; onEnd?: () => void }
  ): void {
    const cleanText = text.trim();
    if (!cleanText) {
      callbacks?.onEnd?.();
      return;
    }

    this.lastSpokenText = cleanText;
    this.lastSpokenLang = language;

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      callbacks?.onEnd?.();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const hasTeluguChars = /[\u0C00-\u0C7F]/.test(cleanText);
    const targetLang = hasTeluguChars || language === 'te-IN' ? 'te-IN' : 'en-IN';
    utterance.lang = targetLang;
    utterance.rate = Math.min(1.6, Math.max(0.7, rate));

    const voices = window.speechSynthesis.getVoices();
    const matchedVoice =
      voices.find((v) => v.lang.toLowerCase() === targetLang.toLowerCase()) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(targetLang.slice(0, 2))) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('en'));

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => callbacks?.onStart?.();
    utterance.onend = () => callbacks?.onEnd?.();
    utterance.onerror = () => callbacks?.onEnd?.();

    window.speechSynthesis.speak(utterance);
  }

  public repeatLast(rate = 1.0, callbacks?: { onStart?: () => void; onEnd?: () => void }): boolean {
    if (!this.lastSpokenText) return false;
    this.speak(this.lastSpokenText, this.lastSpokenLang, rate, callbacks);
    return true;
  }

  public stopSpeaking(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public getLastSpokenText(): string {
    return this.lastSpokenText;
  }
}

export const speechService = new VoiceSpeechService();
