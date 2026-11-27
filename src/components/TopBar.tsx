import { Accessibility, Compass, Layers, Mic, Volume2 } from 'lucide-react';
import { BRAND_CONFIG } from '../config/branding';

export type AppSection = 'assistant' | 'services' | 'accessibility' | 'architecture';

interface TopBarProps {
  activeSection: AppSection;
  onSelectSection: (section: AppSection) => void;
  onRepeatLast: () => void;
  hasLastMessage: boolean;
}

const NAV_ITEMS: Array<{ id: AppSection; label: string; icon: typeof Mic }> = [
  { id: 'assistant', label: 'Assistant', icon: Mic },
  { id: 'services', label: 'Services', icon: Compass },
  { id: 'accessibility', label: 'Accessibility', icon: Accessibility },
  { id: 'architecture', label: 'Architecture', icon: Layers },
];

export function TopBar({ activeSection, onSelectSection, onRepeatLast, hasLastMessage }: TopBarProps) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => onSelectSection('assistant')}
            className="font-display text-left text-xl font-bold tracking-tight text-slate-950 whitespace-nowrap shrink-0 dark:text-white"
          >
            {BRAND_CONFIG.appName}
          </button>

          {/* Zone 2: 4 single-line text navigation links */}
          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-6">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectSection(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`min-h-[44px] px-1 text-sm font-semibold whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                    isActive
                      ? 'border-blue-700 text-blue-700 dark:border-yellow-400 dark:text-yellow-300'
                      : 'border-transparent text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single primary utility action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onRepeatLast}
              disabled={!hasLastMessage}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              <Volume2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Repeat Last</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Navigation (keeps sticky footprint compact) */}
      <nav
        aria-label="Mobile bottom navigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md md:hidden dark:border-slate-800 dark:bg-slate-950/95"
      >
        <div className="grid h-14 grid-cols-4 items-center">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex h-full min-h-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors ${
                  isActive
                    ? 'text-blue-700 dark:text-yellow-300'
                    : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
