import { Bell, CalendarCheck, Car, Pill, Search, Smartphone, Zap } from 'lucide-react';

interface ServicesDirectoryViewProps {
  onLaunchCommand: (command: string) => void;
}

const SUPPORTED_WORKFLOWS = [
  {
    id: 'cab',
    title: 'Cab Booking & On-Demand OTP',
    teluguTitle: 'క్యాబ్ బుకింగ్',
    description:
      'Requests location permission, reads sample Auto/Mini/Sedan fares aloud, enforces PIN authorization before confirming, and reads a test OTP only on explicit request.',
    sampleCommand: 'Book a cab to Vijayawada railway station',
    status: 'Complete Simulated Workflow',
    icon: Car,
  },
  {
    id: 'medicine',
    title: 'Medicine Ordering',
    teluguTitle: 'మందుల ఆర్డర్',
    description:
      'Matches medicine requests against a sample pharmacy catalog, reads price and delivery ETA aloud, and requires PIN confirmation.',
    sampleCommand: 'Order Paracetamol 650mg medicine',
    status: 'Complete Simulated Workflow',
    icon: Pill,
  },
  {
    id: 'doctor',
    title: 'Doctor Appointment Booking',
    teluguTitle: 'డాక్టర్ అపాయింట్‌మెంట్',
    description:
      'Finds sample regional clinic slots across General Medicine, Ophthalmology, and Cardiology and confirms your selected slot by voice.',
    sampleCommand: 'Book an eye doctor appointment',
    status: 'Complete Simulated Workflow',
    icon: CalendarCheck,
  },
  {
    id: 'electricity',
    title: 'Electricity Bill Inquiry & Payment',
    teluguTitle: 'కరెంట్ బిల్లు సమాచారం',
    description:
      'Retrieves sample APSPDCL account units, amount due, and due date, reads them aloud, and gates simulated payment behind your PIN.',
    sampleCommand: 'Check my electricity bill',
    status: 'Complete Simulated Workflow',
    icon: Zap,
  },
  {
    id: 'notifications',
    title: 'Important Notifications Reader',
    teluguTitle: 'నోటిఫికేషన్ల రీడర్',
    description:
      'Reads urgent utility, health, and transit alerts aloud in English or Telugu without requiring visual screen scanning.',
    sampleCommand: 'Read my notifications',
    status: 'Complete Simulated Workflow',
    icon: Bell,
  },
  {
    id: 'search',
    title: 'Accessible Summary Search',
    teluguTitle: 'సమాచార శోధన',
    description:
      'Summarizes local transit, weather, and general queries into concise spoken answers without cluttered web links.',
    sampleCommand: 'Search Vijayawada train accessibility',
    status: 'Simulated / Gemini Powered',
    icon: Search,
  },
  {
    id: 'apps',
    title: 'Phone & App Action Bridge',
    teluguTitle: 'యాప్ షార్ట్‌కట్‌లు',
    description:
      'Demonstrates intent routing for Phone, Maps, and Messages while honestly explaining browser sandbox limits vs. an Android companion.',
    sampleCommand: 'Open Maps',
    status: 'Simulated Web Bridge',
    icon: Smartphone,
  },
];

export function ServicesDirectoryView({ onLaunchCommand }: ServicesDirectoryViewProps) {
  return (
    <section aria-label="Supported voice service workflows" className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="font-display text-2xl font-bold text-slate-950 dark:text-white">
          Modular Service Workflows
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Every workflow listed below is fully interactive and connected to the Voice Access command pipeline.
          External provider APIs (cab aggregators, pharmacies, utility boards, and native OS launchers) are simulated
          with clearly labeled sample data for reliable demonstration.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SUPPORTED_WORKFLOWS.map((wf) => {
            const Icon = wf.icon;
            return (
              <article
                key={wf.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-yellow-300">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{wf.status}</span>
                  </div>
                  <h2 className="mt-4 font-display text-lg font-bold text-slate-950 dark:text-white">
                    {wf.title}
                  </h2>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400" lang="te">
                    {wf.teluguTitle}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {wf.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => onLaunchCommand(wf.sampleCommand)}
                    className="min-h-[48px] w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    Try: &ldquo;{wf.sampleCommand}&rdquo;
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
