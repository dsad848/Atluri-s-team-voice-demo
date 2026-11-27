import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Request, type Response } from 'express';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { runFallbackNlu } from './server/nluFallback.js';
import {
  cancelSimulatedCabBooking,
  createSimulatedAppointment,
  createSimulatedCabBooking,
  createSimulatedMedicineOrder,
  DOCTOR_SLOTS,
  getSimulatedCabEstimate,
  getSimulatedElectricityBill,
  getSimulatedNotifications,
  MEDICINE_CATALOG,
  paySimulatedElectricityBill,
  revealSimulatedCabOtp,
  runSimulatedSearch,
} from './server/simulatedServices.js';
import type { NluRequest, NluResponse } from './src/types/assistant.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);

// Ephemeral in-memory authorization tokens (short-lived, never persisted)
const activeAuthTokens = new Map<string, number>();

function cleanExpiredTokens(): void {
  const now = Date.now();
  for (const [token, expiresAt] of activeAuthTokens.entries()) {
    if (expiresAt <= now) {
      activeAuthTokens.delete(token);
    }
  }
}

function issueAuthToken(): { token: string; expiresAt: number } {
  cleanExpiredTokens();
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = Date.now() + 15 * 60 * 1000;
  activeAuthTokens.set(token, expiresAt);
  return { token, expiresAt };
}

function hasValidAuthToken(req: Request): boolean {
  cleanExpiredTokens();
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  const expiresAt = activeAuthTokens.get(token);
  return typeof expiresAt === 'number' && expiresAt > Date.now();
}

function verifyPinConstantTime(candidatePin: string): boolean {
  const expectedPin = (process.env.DEMO_SECURITY_PIN || '1234').trim();
  const candidateHash = crypto.createHash('sha256').update(candidatePin).digest();
  const expectedHash = crypto.createHash('sha256').update(expectedPin).digest();
  return crypto.timingSafeEqual(candidateHash, expectedHash);
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function understandWithGemini(ai: GoogleGenAI, payload: NluRequest): Promise<NluResponse> {
  const systemInstruction = `You are "Voice Access", an accessible, voice-first AI assistant for blind, visually impaired, and non-English-comfortable users in India.
Prioritize English (en-IN), Telugu (te-IN), and mixed Telugu-English (mixed) conversations.
Never fabricate real bookings, payments, or external actions. All service integrations in this prototype are simulated.
If the user's request is ambiguous or missing critical details (like destination for a cab or which medicine), set needsClarification=true and ask one short, polite clarifying question instead of guessing.
If the user asks for an OTP, set intent="read_otp" and requiresSecurityPin=true. Never invent an OTP value.
Keep spokenResponse concise, clear, screen-reader-friendly, and free of markdown or bullet symbols.`;

  const prompt = JSON.stringify({
    utterance: payload.utterance,
    selectedLanguage: payload.language,
    locationGranted: payload.locationGranted,
    hasActiveCabBooking: payload.hasActiveCabBooking,
    pendingWorkflow: payload.pendingWorkflow ?? null,
    recentTurns: (payload.recentTurns ?? []).slice(-4),
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Gemini API request timed out')), 10000);
  });

  const apiPromise = ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Analyze this voice command context and return structured NLU JSON:\n${prompt}`,
    config: {
      systemInstruction,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          intent: {
            type: Type.STRING,
            description:
              'One of: cab_booking, read_otp, medicine_order, doctor_appointment, electricity_bill, read_notifications, web_search, open_app, confirm_action, cancel_action, repeat_last, help, clarify',
          },
          confidence: { type: Type.NUMBER },
          detectedLanguage: { type: Type.STRING, description: 'en-IN, te-IN, or mixed' },
          needsClarification: { type: Type.BOOLEAN },
          clarificationQuestion: { type: Type.STRING },
          requiresLocationPermission: { type: Type.BOOLEAN },
          requiresUserConfirmation: { type: Type.BOOLEAN },
          requiresSecurityPin: { type: Type.BOOLEAN },
          entities: {
            type: Type.OBJECT,
            properties: {
              destination: { type: Type.STRING },
              pickup: { type: Type.STRING },
              cabCategory: { type: Type.STRING },
              medicineName: { type: Type.STRING },
              quantity: { type: Type.STRING },
              specialty: { type: Type.STRING },
              preferredTime: { type: Type.STRING },
              consumerNumber: { type: Type.STRING },
              searchQuery: { type: Type.STRING },
              appName: { type: Type.STRING },
            },
          },
          spokenResponse: { type: Type.STRING },
          spokenResponseTelugu: { type: Type.STRING },
        },
        required: [
          'intent',
          'confidence',
          'detectedLanguage',
          'needsClarification',
          'requiresLocationPermission',
          'requiresUserConfirmation',
          'requiresSecurityPin',
          'spokenResponse',
        ],
      },
    },
  });

  const response = await Promise.race([apiPromise, timeoutPromise]);
  const rawJson = (response.text ?? '').trim();
  if (!rawJson) {
    throw new Error('Empty response from Gemini API');
  }
  const parsed = JSON.parse(rawJson) as Partial<NluResponse>;
  const validLang =
    parsed.detectedLanguage === 'te-IN' || parsed.detectedLanguage === 'mixed' ? parsed.detectedLanguage : 'en-IN';

  return {
    intent: (parsed.intent as NluResponse['intent']) || 'clarify',
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
    detectedLanguage: validLang,
    needsClarification: Boolean(parsed.needsClarification),
    clarificationQuestion: parsed.clarificationQuestion,
    requiresLocationPermission: Boolean(parsed.requiresLocationPermission),
    requiresUserConfirmation: Boolean(parsed.requiresUserConfirmation),
    requiresSecurityPin: Boolean(parsed.requiresSecurityPin),
    entities: parsed.entities ?? {},
    spokenResponse: parsed.spokenResponse || 'Ready to assist.',
    spokenResponseTelugu: parsed.spokenResponseTelugu,
    aiSource: 'gemini',
    aiConfigured: true,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    const aiConfigured = Boolean(getGeminiClient());
    res.json({
      ok: true,
      service: 'voice-access-api',
      aiConfigured,
      mode: aiConfigured ? 'gemini' : 'demo_fallback',
      notice: aiConfigured ? undefined : 'AI API key not configured. Demonstration mode is active.',
    });
  });

  app.post('/api/security/verify-pin', (req: Request, res: Response) => {
    const pin = typeof req.body?.pin === 'string' ? req.body.pin.trim() : '';
    const method = req.body?.method === 'biometric_demo' ? 'biometric_demo' : 'pin';

    if (method === 'biometric_demo') {
      // Simulated biometric confirmation requires explicit client trigger
      const { token, expiresAt } = issueAuthToken();
      res.json({
        verified: true,
        simulatedBiometric: true,
        token,
        expiresAt,
      });
      return;
    }

    if (!/^\d{4,6}$/.test(pin)) {
      res.status(400).json({ verified: false, error: 'PIN must be 4 to 6 digits.' });
      return;
    }

    if (!verifyPinConstantTime(pin)) {
      res.status(401).json({
        verified: false,
        error: 'Incorrect security PIN. For this demo, enter 1234.',
      });
      return;
    }

    const { token, expiresAt } = issueAuthToken();
    res.json({ verified: true, token, expiresAt });
  });

  app.post('/api/assistant/understand', async (req: Request, res: Response) => {
    const body = req.body as Partial<NluRequest>;
    if (!body || typeof body.utterance !== 'string') {
      res.status(400).json({ error: 'Invalid request: utterance string is required.' });
      return;
    }

    const sanitizedRequest: NluRequest = {
      utterance: body.utterance.slice(0, 500),
      language: body.language === 'te-IN' || body.language === 'mixed' ? body.language : 'en-IN',
      locationGranted: Boolean(body.locationGranted),
      hasActiveCabBooking: Boolean(body.hasActiveCabBooking),
      pendingWorkflow: typeof body.pendingWorkflow === 'string' ? body.pendingWorkflow : null,
      recentTurns: Array.isArray(body.recentTurns) ? body.recentTurns.slice(-6) : [],
    };

    const ai = getGeminiClient();
    if (!ai) {
      const fallback = runFallbackNlu(
        sanitizedRequest,
        false,
        'AI API key not configured. Running in offline demonstration mode.'
      );
      res.json(fallback);
      return;
    }

    try {
      const geminiResult = await understandWithGemini(ai, sanitizedRequest);
      res.json(geminiResult);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI service temporarily unavailable';
      const fallback = runFallbackNlu(
        sanitizedRequest,
        true,
        `Gemini API request fell back to demonstration mode (${message}).`
      );
      res.json(fallback);
    }
  });

  // Cab Booking Workflow (Simulated)
  app.post('/api/services/cab/estimate', (req: Request, res: Response) => {
    const destination =
      typeof req.body?.destination === 'string' && req.body.destination.trim().length >= 2
        ? req.body.destination.trim().slice(0, 120)
        : 'Vijayawada Railway Station';
    const pickup =
      typeof req.body?.pickup === 'string' && req.body.pickup.trim().length >= 2
        ? req.body.pickup.trim().slice(0, 120)
        : 'Current Location (MG Road, Vijayawada)';

    res.json(getSimulatedCabEstimate(pickup, destination));
  });

  app.post('/api/services/cab/book', (req: Request, res: Response) => {
    const explicitConfirmed = req.body?.explicitConfirmed === true;
    const requirePin = req.body?.requirePin !== false;
    if (!explicitConfirmed) {
      res.status(400).json({ error: 'Explicit user confirmation is required before booking a cab.' });
      return;
    }
    if (requirePin && !hasValidAuthToken(req)) {
      res.status(401).json({ error: 'Security PIN or biometric authorization is required before booking.' });
      return;
    }

    const pickup =
      typeof req.body?.pickup === 'string' && req.body.pickup.trim()
        ? req.body.pickup.trim().slice(0, 120)
        : 'Current Location (MG Road, Vijayawada)';
    const destination =
      typeof req.body?.destination === 'string' && req.body.destination.trim()
        ? req.body.destination.trim().slice(0, 120)
        : 'Vijayawada Railway Station';
    const categoryId =
      req.body?.categoryId === 'auto' || req.body?.categoryId === 'sedan' ? req.body.categoryId : 'mini';

    const booking = createSimulatedCabBooking(pickup, destination, categoryId);
    res.json(booking);
  });

  app.post('/api/services/cab/otp', (req: Request, res: Response) => {
    const bookingId = typeof req.body?.bookingId === 'string' ? req.body.bookingId.trim() : '';
    const explicitOtpRequest = req.body?.explicitOtpRequest === true;
    const requirePin = req.body?.requirePin !== false;

    if (!explicitOtpRequest) {
      res.status(400).json({ error: 'Test OTP can only be accessed when explicitly requested by the user.' });
      return;
    }
    if (requirePin && !hasValidAuthToken(req)) {
      res.status(401).json({ error: 'Verify security PIN before reading the test OTP aloud.' });
      return;
    }

    const otpResult = revealSimulatedCabOtp(bookingId);
    if (!otpResult) {
      res.status(404).json({ error: 'Active simulated cab booking not found.' });
      return;
    }

    res.json({
      simulated: true,
      bookingId: otpResult.bookingId,
      testOtp: otpResult.testOtp,
      spokenOtpMessage: `Your simulated test ride OTP is ${otpResult.testOtp.split('').join(' ')}. This is a sample demonstration code, not a real ride OTP.`,
    });
  });

  app.post('/api/services/cab/cancel', (req: Request, res: Response) => {
    const bookingId = typeof req.body?.bookingId === 'string' ? req.body.bookingId.trim() : '';
    const cancelled = cancelSimulatedCabBooking(bookingId);
    res.json({ cancelled });
  });

  // Medicine Ordering Workflow (Simulated)
  app.get('/api/services/medicine/catalog', (_req: Request, res: Response) => {
    res.json({ simulated: true, items: MEDICINE_CATALOG });
  });

  app.post('/api/services/medicine/order', (req: Request, res: Response) => {
    const explicitConfirmed = req.body?.explicitConfirmed === true;
    const requirePin = req.body?.requirePin !== false;
    if (!explicitConfirmed) {
      res.status(400).json({ error: 'Explicit user confirmation is required before placing a medicine order.' });
      return;
    }
    if (requirePin && !hasValidAuthToken(req)) {
      res.status(401).json({ error: 'Security authorization is required before placing an order.' });
      return;
    }
    const medicineId = typeof req.body?.medicineId === 'string' ? req.body.medicineId : 'med-paracetamol';
    const quantity = typeof req.body?.quantity === 'number' ? req.body.quantity : 1;
    const order = createSimulatedMedicineOrder(medicineId, quantity);
    if (!order) {
      res.status(404).json({ error: 'Medicine item not found.' });
      return;
    }
    res.json(order);
  });

  // Doctor Appointment Workflow (Simulated)
  app.get('/api/services/appointments/slots', (_req: Request, res: Response) => {
    res.json({ simulated: true, slots: DOCTOR_SLOTS });
  });

  app.post('/api/services/appointments/book', (req: Request, res: Response) => {
    const explicitConfirmed = req.body?.explicitConfirmed === true;
    if (!explicitConfirmed) {
      res.status(400).json({ error: 'Explicit confirmation required before booking an appointment.' });
      return;
    }
    const slotId = typeof req.body?.slotId === 'string' ? req.body.slotId : 'slot-1';
    res.json(createSimulatedAppointment(slotId));
  });

  // Electricity Bill Workflow (Simulated)
  app.get('/api/services/electricity/bill', (_req: Request, res: Response) => {
    res.json(getSimulatedElectricityBill());
  });

  app.post('/api/services/electricity/pay', (req: Request, res: Response) => {
    const explicitConfirmed = req.body?.explicitConfirmed === true;
    const requirePin = req.body?.requirePin !== false;
    if (!explicitConfirmed) {
      res.status(400).json({ error: 'Explicit confirmation required before simulated bill payment.' });
      return;
    }
    if (requirePin && !hasValidAuthToken(req)) {
      res.status(401).json({ error: 'Security PIN or biometric authorization is required for payment.' });
      return;
    }
    res.json(paySimulatedElectricityBill());
  });

  // Notifications & Search (Simulated)
  app.get('/api/services/notifications', (_req: Request, res: Response) => {
    res.json({ simulated: true, items: getSimulatedNotifications() });
  });

  app.post('/api/services/search', (req: Request, res: Response) => {
    const query = typeof req.body?.query === 'string' ? req.body.query.trim().slice(0, 200) : '';
    if (!query) {
      res.status(400).json({ error: 'Search query is required.' });
      return;
    }
    res.json({ simulated: true, query, results: runSimulatedSearch(query) });
  });

  // Frontend serving (Vite dev middleware or static dist/)
  const distDir = path.resolve(__dirname, 'dist');
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    if (fs.existsSync(path.join(distDir, 'index.html'))) {
      app.use(express.static(distDir));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    } else {
      app.get('*', (_req: Request, res: Response) => {
        res.status(503).send('Build directory missing. Run npm run build first.');
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    const mode = getGeminiClient() ? 'Gemini NLU + Demo Fallback' : 'Offline Demonstration Mode (No API Key)';
    console.log(`Voice Access server listening on http://0.0.0.0:${PORT} [${mode}]`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Voice Access server:', err);
  process.exit(1);
});
