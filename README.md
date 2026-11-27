# Voice Access — Indian Language Voice Assistant Prototype

**Voice Access** is a voice-first, screen-reader-friendly assistant designed for blind and visually impaired users, individuals who cannot type comfortably, and people who prefer speaking in Indian languages over English.

Built as a functional hackathon prototype, Voice Access prioritizes **English (`en-IN`)** and **Telugu (`te-IN`)** (including mixed Telugu-English / Tenglish commands) with a modular architecture ready for additional Indian languages and partner integrations.

---

## Key Capabilities

### Voice Interaction & Accessibility
- **Large Primary Microphone Button**: Prominent touch target (`128px–144px`), keyboard shortcut (`Space` to toggle listening, `Escape` to interrupt/stop speaking), and clear `Listening`, `Thinking`, and `Speaking` states.
- **Bilingual Speech-to-Text & Text-to-Speech**: Uses Web Speech API (`en-IN` and `te-IN`) with automatic browser capability detection. When browser speech recognition is unavailable or denied, an accessible text input and one-tap phrase buttons keep all voice output and workflows working.
- **Screen-Reader-First UX**: Semantic landmarks, skip-to-content link, `aria-live` status regions, audio cue tones (earcons), adjustable speech speed (`0.75x–1.50x`), High-Contrast Dark Mode, and Large Text scaling.
- **Clarification & Control**: Asks short follow-up questions instead of guessing unclear requests, supports repeating the last spoken response, and lets users cancel or interrupt operations at any time.

### Security & Privacy Safeguards
- **Explicit Location Permission**: Requests permission before accessing browser GPS or falling back to a clearly labeled sample pickup point.
- **Voice-Spoofing Defense**: Sensitive actions (confirming a cab booking, placing a medicine order, paying a utility bill, or reading a test OTP) require server-verified PIN authorization (demo PIN: `1234`) or simulated biometric confirmation so a bystander speaking aloud cannot trigger sensitive actions.
- **On-Demand Test OTP**: Ride test OTPs are kept hidden on the server and are only disclosed and read aloud when explicitly requested by the user after authorization.
- **Server-Only Secrets**: `GEMINI_API_KEY` is read strictly on the Node/Express server (`process.env.GEMINI_API_KEY`) and is never exposed to browser code.

---

## Implemented vs. Simulated Features

| Feature | Status | Notes |
| --- | --- | --- |
| Voice Input (English / Telugu) | **Real (Browser Web Speech API)** | Depends on browser support (Chrome/Edge/Android WebView). Falls back to text input if unsupported. |
| Spoken Responses (TTS) | **Real (Browser SpeechSynthesis)** | Adjustable rate, interrupt, and repeat controls. Uses device `te-IN` / `en-IN` voices when installed. |
| Natural Language Understanding | **Real Gemini NLU + Offline Fallback** | Uses `@google/genai` (`gemini-4-hydrogen`) when `GEMINI_API_KEY` is set; switches to local bilingual rule parser (`server/nluFallback.ts`) when unconfigured. |
| Security PIN Verification | **Real Server Check (Demo PIN)** | Constant-time server verification issuing ephemeral in-memory Bearer tokens (`1234` default demo PIN). Biometric button is a simulated demo trigger. |
| Cab Booking & Test OTP | **Simulated Workflow** | Demonstrates location permission, sample Vijayawada fares (Auto/Mini/Sedan), confirmation, booking status, and on-demand test OTP readout. |
| Medicine, Doctor, Electricity Bill, Alerts | **Simulated Workflows** | Complete interactive multi-step demonstrations using clearly labeled sample catalogs, clinic slots, APSPDCL bill figures, and notifications. |
| Native Android App Launching | **Simulated Web Bridge** | Explains browser sandbox limits; future production version connects via Android Accessibility Service / App Links. |

---

## Modular Codebase Guide

If you are reviewing or extending this project:

- `src/config/branding.ts`: Centralized application name (`Voice Access`) and supported language definitions.
- `src/types/assistant.ts`: Shared TypeScript contracts for NLU intents, workflows, accessibility settings, and API payloads.
- `server.ts`: Express server hosting `/api/*` routes, Gemini NLU integration, PIN token checks, and Vite/static frontend serving.
- `server/nluFallback.ts`: Bilingual English, Telugu, and Tenglish intent and entity parser for key-free Demonstration Mode.
- `server/simulatedServices.ts`: In-memory simulated service adapters (cabs, hidden test OTP store, pharmacy catalog, doctor slots, electricity bill, alerts).
- `src/services/speechService.ts`: Browser STT/TTS wrapper, voice capability diagnostics, and Web Audio earcon generator.
- `src/services/apiClient.ts`: Typed frontend HTTP client with request timeouts and Bearer authorization headers.
- `src/components/`:
  - `VoiceConsole.tsx`: Microphone anchor, audio waveform, interrupt/repeat/cancel controls, and fallback input.
  - `ActiveWorkflowPanel.tsx`: Step-by-step interactive cards for cab booking, OTP readout, medicine, appointments, bills, and alerts.
  - `SecurityPinModal.tsx`: Accessible authorization dialog protecting sensitive actions.
  - `AccessibilitySettingsPanel.tsx`: High contrast, text scaling, speech speed, earcons, and language preferences.
  - `ConversationLog.tsx`: Replayable conversation transcript.
  - `ServicesDirectoryView.tsx` & `HackathonDocsView.tsx`: Workflow catalog and live architecture diagnostics.

---

## Running Locally (Without Any API Key)

Voice Access starts and runs in **Demonstration Mode** even if `GEMINI_API_KEY` is not set.

### Prerequisites
- Node.js `>= 20` (tested on Node 22) and `npm`

### Steps
```bash
# 1. Install dependencies
npm install

# 2. (Optional) Copy environment template and add your Gemini key
cp .env.example .env

# 3. Start development server on http://localhost:3000
npm run dev
```

Open `http://localhost:3000` in Google Chrome or Microsoft Edge for full Web Speech API support.

### Production Build
```bash
npm run build
NODE_ENV=production npm start
```

---

## Running with Docker Compose

Start the entire application with a single command (no `.env` file or API key required):

```bash
docker compose up --build
```

To enable live Gemini NLU inside Docker, export `GEMINI_API_KEY` in your shell before starting:

```bash
GEMINI_API_KEY=your_key_here docker compose up --build
```

Then visit `http://localhost:3000`.

---

## Verification Checklist

1. Start without `GEMINI_API_KEY` -> Confirm `"AI API key not configured"` notice appears and Demonstration Mode works.
2. Run `"Book a cab to Vijayawada railway station"` (or `"విజయవాడ రైల్వే స్టేషన్‌కు క్యాబ్ బుక్ చేయి"`).
3. Grant or select sample location -> Verify sample Auto/Mini/Sedan fares are displayed and read aloud.
4. Confirm booking -> Verify Security PIN (`1234`) is required before booking completes.
5. Verify test OTP stays hidden until you tap **"Read Test OTP Aloud"** or say `"Read my cab OTP"` + authorize PIN.
6. Test unclear input (e.g. `"hello"` or `"booking"`) -> Confirm assistant asks a clarifying question instead of guessing.
7. Test High-Contrast Dark Mode, Large Text, Repeat Last, and Stop/Interrupt controls.

---

## Hackathon Deliverables

See [`docs/PITCH_AND_DEMO_PLAN.md`](docs/PITCH_AND_DEMO_PLAN.md) for the 3-minute demonstration video storyboard and complete pitch deck content.

## License

Licensed under the Apache License, Version 2.0.
