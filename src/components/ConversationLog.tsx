import { Volume2 } from 'lucide-react';
import type { ConversationTurn } from '../types/assistant';

interface ConversationLogProps {
  turns: ConversationTurn[];
  onReplayText: (text: string) => void;
}

export function ConversationLog({ turns, onReplayText }: ConversationLogProps) {
  return (
    <section
      aria-label="Conversation history"
      className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
            Conversation History
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Every assistant message can be replayed aloud at any time.
          </p>
        </div>
        <span className="font-mono-tabular text-xs font-semibold text-slate-500 dark:text-slate-400">
          {turns.length} turns
        </span>
      </div>

      {turns.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-600 dark:text-slate-400">
          Tap the large microphone button or select a sample command to begin speaking with Voice Access.
        </div>
      ) : (
        <ol className="mt-4 space-y-4 max-h-[420px] overflow-y-auto pr-1" aria-live="polite">
          {turns.map((turn) => {
            const isUser = turn.role === 'user';
            const isSystem = turn.role === 'system';
            return (
              <li
                key={turn.id}
                className={`rounded-xl border p-4 ${
                  isUser
                    ? 'border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/35'
                    : isSystem
                      ? 'border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/30'
                      : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span className="text-slate-950 dark:text-white">
                      {isUser ? 'You' : isSystem ? 'System Notice' : 'Voice Access'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">{turn.timestamp}</span>
                    {turn.aiSource && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{turn.aiSource === 'gemini' ? 'Gemini NLU' : 'Demo Mode'}</span>
                      </>
                    )}
                  </div>

                  {!isUser && (
                    <button
                      type="button"
                      onClick={() => onReplayText(turn.teluguText || turn.text)}
                      aria-label={`Read aloud: ${turn.text}`}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                    >
                      <Volume2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>Speak</span>
                    </button>
                  )}
                </div>

                <p className="mt-2 text-base leading-relaxed text-slate-900 dark:text-slate-100">
                  {turn.text}
                </p>
                {turn.teluguText && turn.teluguText !== turn.text && (
                  <p className="mt-1.5 text-base leading-relaxed text-slate-700 dark:text-slate-300" lang="te">
                    {turn.teluguText}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
