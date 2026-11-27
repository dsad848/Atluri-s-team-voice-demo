# Voice Access — 3-Minute Demo Video Plan & Pitch Deck Content

---

## Part 1: 3-Minute Demonstration Video Storyboard

**Target Runtime:** 3:00 (180 seconds)
**Goal:** Demonstrate working accessibility, bilingual Telugu/English voice control, clarification handling, security PIN gating, and end-to-end cab booking without needing to look at the screen.

### 0:00 – 0:25 | Hook & Problem Statement
- **Visual:** Show a smartphone screen in High-Contrast Dark Mode alongside a real-world scenario (e.g., trying to book a cab on a cluttered ride-hailing app while eyes-free).
- **Narration:** "Over 270 million smartphone users in India struggle with English-first interfaces, tiny touch targets, or visual impairments. Existing chatbots answer text questions—they don't safely operate everyday services by voice in regional languages. Meet **Voice Access**."

### 0:25 – 0:55 | Voice-First Interface & Accessibility Controls
- **Visual:** Desktop & mobile responsive view of `Voice Access`. Toggle High-Contrast Dark Mode, Large Text, and demonstrate pressing `Space` to start listening and `Escape` to interrupt speech. Show the audio earcons and Speech Speed slider.
- **Narration:** "Voice Access is built screen-reader-first: keyboard shortcuts, audio earcons, adjustable speech rate, and zero visual clutter. Notice the banner clearly states when no API key is configured—the entire app runs reliably in Demonstration Mode as well as with live Gemini NLU."

### 0:55 – 1:45 | End-to-End Cab Booking in Telugu & English
- **Visual:** Tap the large Microphone button. Speak (or trigger): *"Book a cab to Vijayawada railway station"* (and show the Telugu equivalent *"విజయవాడ రైల్వే స్టేషన్‌కు క్యాబ్ బుక్ చేయి"*).
- **Flow shown on screen & heard aloud:**
  1. Assistant asks for **Location Permission** first.
  2. Sample pickup (`MG Road, Vijayawada`) and destination (`Vijayawada Railway Station`) load with Auto, Comfort Mini, and Prime Sedan **sample fares read aloud**.
  3. User confirms -> **Security PIN modal** pops up (`1234` demo PIN), blocking unauthorized voice spoofing.
  4. Booking confirms with clearly labeled simulated driver/vehicle details.
  5. **Test OTP remains hidden** until user explicitly taps/asks *"Read my cab OTP aloud"*, then speaks the 4-digit test OTP aloud.

### 1:45 – 2:25 | Clarification & Additional Everyday Workflows
- **Visual:**
  1. Send an ambiguous command (*"Help with booking"*) -> Assistant asks a short clarifying question instead of guessing.
  2. Run *"Check my electricity bill"* -> Sample APSPDCL units and ₹1,240 due are read aloud.
  3. Run *"నోటిఫికేషన్లు చదువు"* (Read notifications in Telugu) -> Reads urgent alerts aloud.

### 2:25 – 3:00 | Modular Architecture & Closing Vision
- **Visual:** Switch briefly to the **Architecture** tab showing `server/nluFallback.ts`, `server/simulatedServices.ts`, `src/services/speechService.ts`, and `docker-compose.yml`.
- **Narration:** "Every service adapter and language module is cleanly separated so ONDC mobility, BBPS utility payments, and an Android Accessibility companion service can plug straight into this exact voice-and-security pipeline. Thank you."

---

## Part 2: Pitch Deck Content

### Slide 1: Title
- **Voice Access**
- *Voice-First Digital Independence in Indian Languages*
- Built for accessibility, regional language inclusion, and safe voice-driven task execution.

### Slide 2: Problem & Solution
- **The Problem:**
  - Smartphone apps for transport, healthcare, and bills assume English literacy, fine motor control, and visual screen navigation.
  - Blind and low-vision users, elderly citizens, and non-English speakers face high friction, accidental taps, and OTP/payment anxiety.
  - Generic voice chatbots only converse; they lack permission flows, clarification loops, and voice-spoofing protection.
- **Our Solution (Voice Access):**
  - Bilingual English + Telugu (and Tenglish) voice-first assistant with a modular multi-language architecture.
  - Plans and walks users through structured workflows (cabs, medicines, doctor slots, electricity bills, alerts) entirely via spoken feedback.
  - Protects sensitive actions (confirmations, payments, OTP readout) behind explicit user confirmation and PIN/biometric verification.

### Slide 3: Target Users & Estimated Potential Reach
- **Primary Users:**
  1. Blind and visually impaired smartphone users in India (~4.9M+ blind & ~70M+ visually impaired individuals nationwide, per NPCB/WHO estimates).
  2. Elderly & motor-impaired users who struggle with small touch keyboards.
  3. Regional-language-first citizens across Andhra Pradesh & Telangana (~80M+ Telugu speakers) as the initial launch cohort, expanding to Hindi, Tamil, Kannada, and Malayalam.
- **Addressable Reach:** Over 300M+ non-English-comfortable Indian mobile internet users seeking assisted digital access to mobility, healthcare, and utility payments.

### Slide 4: Technology Dependencies & Cost Risks
- **Current Prototype Stack:**
  - Frontend: React 19, TypeScript, Tailwind CSS, Web Speech API (browser-native STT/TTS at ₹0 API cost).
  - Backend: Node.js + Express, `@google/genai` (`gemini-4-hydrogen` with low-latency thinking), plus local offline fallback NLU (`server/nluFallback.ts`).
- **Key Cost & Technical Risks + Mitigations:**
  1. *LLM API Cost at Scale:* Mitigated by routing high-frequency simple intents (repeat, cancel, OTP read, bill check) through local deterministic NLU first, reserving Gemini for ambiguous or multi-turn mixed-language utterances.
  2. *Browser STT Variance:* Browser Web Speech API varies across mobile browsers; production Android companion will pair on-device Android SpeechRecognizer / Whisper or Indic ASR models with server fallback.
  3. *Partner API Fragmentation:* Mitigated by modular service adapters aligned with open Indian Digital Public Infrastructure (ONDC for mobility/pharmacy, BBPS for utility bills, ABDM/eSanjeevani for health).

### Slide 5: Launch Plan & Growth Strategy
- **Phase 1 (Months 1–2): Accessibility Pilot**
  - Partner with blind welfare associations and senior citizen centers in Vijayawada & Hyderabad to test Telugu/English voice accuracy and earcon ergonomics.
- **Phase 2 (Months 3–5): Android Companion & ONDC/BBPS Integration**
  - Package the web core inside an Android Accessibility Service wrapper for hands-free app switching and integrate sandbox ONDC mobility + BBPS bill fetch APIs.
- **Phase 3 (Months 6–12): Pan-India Indic Expansion**
  - Add Hindi, Tamil, and Kannada language packs and offer a B2B2C accessibility SDK for regional banks, hospitals, and municipal portals.
