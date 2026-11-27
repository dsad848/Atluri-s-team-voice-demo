import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilitySettingsPanel } from './components/AccessibilitySettingsPanel';
import { ActiveWorkflowPanel, type ActiveWorkflowState } from './components/ActiveWorkflowPanel';
import { ConversationLog } from './components/ConversationLog';
import { HackathonDocsView } from './components/HackathonDocsView';
import { SecurityPinModal } from './components/SecurityPinModal';
import { ServicesDirectoryView } from './components/ServicesDirectoryView';
import { TopBar, type AppSection } from './components/TopBar';
import { VoiceConsole, type AssistantPhase } from './components/VoiceConsole';
import { BRAND_CONFIG } from './config/branding';
import { apiClient } from './services/apiClient';
import { speechService, type SpeechSupportInfo } from './services/speechService';
import type {
  AccessibilitySettings,
  ConversationTurn,
  LanguageCode,
} from './types/assistant';

function formatTimeNow(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function App() {
  const [activeSection, setActiveSection] = useState<AppSection>('assistant');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en-IN');
  const [phase, setPhase] = useState<AssistantPhase>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [workflow, setWorkflow] = useState<ActiveWorkflowState>({ type: 'none' });

  const [aiConfigured, setAiConfigured] = useState<boolean>(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  const [locationGranted, setLocationGranted] = useState<boolean>(false);
  const [pickupLocationLabel, setPickupLocationLabel] = useState<string>('Current Location (MG Road, Vijayawada)');

  // Ephemeral auth token kept strictly in React memory (never persisted to localStorage)
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [pinModalOpen, setPinModalOpen] = useState<boolean>(false);
  const [pinActionLabel, setPinActionLabel] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinVerifying, setPinVerifying] = useState<boolean>(false);
  const pendingSensitiveActionRef = useRef<((token: string | null) => Promise<void>) | null>(null);

  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    speechRate: 1.0,
    autoListenAfterReply: false,
    audioEarcons: true,
    securityPinRequired: true,
  });

  const [speechSupport, setSpeechSupport] = useState<SpeechSupportInfo>(() =>
    speechService.getSupportInfo('en-IN')
  );

  const toggleListeningRef = useRef<() => void>(() => {});

  // Sync high-contrast dark class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.highContrast);
  }, [settings.highContrast]);

  // Check backend AI availability on mount
  useEffect(() => {
    let mounted = true;
    apiClient
      .getHealth()
      .then((health) => {
        if (!mounted) return;
        setAiConfigured(health.aiConfigured);
        setAiNotice(health.aiConfigured ? null : health.notice ?? 'AI API key not configured. Demonstration mode is active.');
      })
      .catch(() => {
        if (!mounted) return;
        setAiConfigured(false);
        setAiNotice('Backend connection check failed. Ensure the server is running.');
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Refresh Web Speech voice support list when browser voices load
  useEffect(() => {
    const refreshVoices = () => {
      setSpeechSupport(speechService.getSupportInfo(selectedLanguage));
    };
    refreshVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', refreshVoices);
      };
    }
    return undefined;
  }, [selectedLanguage]);

  const appendTurn = useCallback(
    (turn: Omit<ConversationTurn, 'id' | 'timestamp'>) => {
      setTurns((prev) => [
        ...prev,
        {
          ...turn,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: formatTimeNow(),
        },
      ]);
    },
    []
  );

  const speakResponse = useCallback(
    (text: string, langOverride?: LanguageCode, followUpListen = false) => {
      const targetLang = langOverride ?? selectedLanguage;
      speechService.speak(text, targetLang, settings.speechRate, {
        onStart: () => setPhase('speaking'),
        onEnd: () => {
          setPhase('idle');
          if (followUpListen && settings.autoListenAfterReply) {
            setTimeout(() => toggleListeningRef.current(), 250);
          }
        },
      });
    },
    [selectedLanguage, settings.speechRate, settings.autoListenAfterReply]
  );

  const handleRepeatLast = useCallback(() => {
    const ok = speechService.repeatLast(settings.speechRate, {
      onStart: () => setPhase('speaking'),
      onEnd: () => setPhase('idle'),
    });
    if (!ok) {
      speakResponse('There is no previous assistant response to repeat yet.');
    }
  }, [settings.speechRate, speakResponse]);

  const handleStopSpeaking = useCallback(() => {
    speechService.stopListening();
    speechService.stopSpeaking();
    speechService.playEarcon('listen_stop', settings.audioEarcons);
    setInterimTranscript('');
    setPhase('idle');
  }, [settings.audioEarcons]);

  const requestSecurityAuthorization = useCallback(
    (description: string, action: (token: string | null) => Promise<void>) => {
      if (!settings.securityPinRequired) {
        void action(authToken);
        return;
      }
      if (authToken) {
        void action(authToken);
        return;
      }
      pendingSensitiveActionRef.current = action;
      setPinActionLabel(description);
      setPinError(null);
      setPinModalOpen(true);
      speakResponse('Security authorization is required. Please enter your 4-digit PIN or choose Demo Biometric.');
    },
    [authToken, settings.securityPinRequired, speakResponse]
  );

  const handleVerifyPin = useCallback(
    async (pin: string) => {
      setPinVerifying(true);
      setPinError(null);
      try {
        const res = await apiClient.verifySecurityPin(pin, 'pin');
        setAuthToken(res.token);
        setPinModalOpen(false);
        speechService.playEarcon('success', settings.audioEarcons);
        const pending = pendingSensitiveActionRef.current;
        pendingSensitiveActionRef.current = null;
        if (pending) {
          await pending(res.token);
        }
      } catch (err) {
        speechService.playEarcon('error', settings.audioEarcons);
        const msg = err instanceof Error ? err.message : 'PIN verification failed.';
        setPinError(msg);
        speakResponse(msg);
      } finally {
        setPinVerifying(false);
      }
    },
    [settings.audioEarcons, speakResponse]
  );

  const handleVerifyBiometricDemo = useCallback(async () => {
    setPinVerifying(true);
    setPinError(null);
    try {
      const res = await apiClient.verifySecurityPin('', 'biometric_demo');
      setAuthToken(res.token);
      setPinModalOpen(false);
      speechService.playEarcon('success', settings.audioEarcons);
      const pending = pendingSensitiveActionRef.current;
      pendingSensitiveActionRef.current = null;
      if (pending) {
        await pending(res.token);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Biometric authorization failed.';
      setPinError(msg);
      speakResponse(msg);
    } finally {
      setPinVerifying(false);
    }
  }, [settings.audioEarcons, speakResponse]);

  const loadCabEstimate = useCallback(
    async (pickup: string, destination: string, preferredCat: 'auto' | 'mini' | 'sedan' = 'mini') => {
      setPhase('processing');
      try {
        const estimate = await apiClient.estimateCab(pickup, destination);
        setWorkflow({ type: 'cab_estimate', estimate, selectedCategory: preferredCat });
        appendTurn({ role: 'assistant', text: estimate.spokenSummary, intent: 'cab_booking' });
        speakResponse(estimate.spokenSummary);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Could not load sample cab estimate.';
        appendTurn({ role: 'system', text: msg });
        speakResponse(msg);
        setPhase('idle');
      }
    },
    [appendTurn, speakResponse]
  );

  const handleGrantBrowserLocation = useCallback(() => {
    if (workflow.type !== 'cab_location_prompt') return;
    const { destination, preferredCategory } = workflow;

    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      const fallbackPickup = 'Sample Location (MG Road, Vijayawada)';
      setLocationGranted(true);
      setPickupLocationLabel(fallbackPickup);
      void loadCabEstimate(fallbackPickup, destination, preferredCategory);
      return;
    }

    setPhase('processing');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const label = `Device GPS (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`;
        setLocationGranted(true);
        setPickupLocationLabel(label);
        void loadCabEstimate(label, destination, preferredCategory);
      },
      () => {
        const fallbackPickup = 'Sample Pickup (MG Road, Vijayawada)';
        setLocationGranted(true);
        setPickupLocationLabel(fallbackPickup);
        appendTurn({
          role: 'system',
          text: 'Device GPS permission was unavailable or denied; using clearly labeled sample Vijayawada pickup.',
        });
        void loadCabEstimate(fallbackPickup, destination, preferredCategory);
      },
      { timeout: 6000 }
    );
  }, [appendTurn, loadCabEstimate, workflow]);

  const handleUseSampleLocation = useCallback(() => {
    if (workflow.type !== 'cab_location_prompt') return;
    const samplePickup = 'Sample Pickup (MG Road, Vijayawada)';
    setLocationGranted(true);
    setPickupLocationLabel(samplePickup);
    void loadCabEstimate(samplePickup, workflow.destination, workflow.preferredCategory);
  }, [loadCabEstimate, workflow]);

  const handleDeclineLocation = useCallback(() => {
    setWorkflow({ type: 'none' });
    const msg = 'Location permission declined. Cab fare estimation was cancelled.';
    appendTurn({ role: 'assistant', text: msg });
    speakResponse(msg);
  }, [appendTurn, speakResponse]);

  const executeCabBooking = useCallback(
    async (
      pickup: string,
      destination: string,
      categoryId: 'auto' | 'mini' | 'sedan',
      token: string | null
    ) => {
      setPhase('processing');
      try {
        const booking = await apiClient.bookCab(
          {
            pickup,
            destination,
            categoryId,
            explicitConfirmed: true,
            requirePin: settings.securityPinRequired,
          },
          token
        );
        setWorkflow({ type: 'cab_booked', booking });
        speechService.playEarcon('success', settings.audioEarcons);
        const reply = `Simulated cab booking confirmed with ${booking.driverName}. Vehicle ${booking.vehicleNumber} is estimated in ${booking.etaMinutes} minutes for ${booking.estimatedFareInr} rupees. Ask me to read your test OTP whenever you need it.`;
        appendTurn({ role: 'assistant', text: reply, intent: 'cab_booking' });
        speakResponse(reply);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Cab booking failed.';
        if (/401|authorization|pin/i.test(msg)) {
          setAuthToken(null);
        }
        appendTurn({ role: 'system', text: msg });
        speakResponse(msg);
        setPhase('idle');
      }
    },
    [appendTurn, settings.audioEarcons, settings.securityPinRequired, speakResponse]
  );

  const handleConfirmCabBooking = useCallback(() => {
    if (workflow.type !== 'cab_estimate') return;
    const { estimate, selectedCategory } = workflow;
    const chosen = estimate.categories.find((c) => c.id === selectedCategory) ?? estimate.categories[1];
    requestSecurityAuthorization(
      `Authorize simulated cab booking (${chosen.name}, estimated ₹${chosen.estimatedFareInr}) to ${estimate.destination}.`,
      (token) => executeCabBooking(estimate.pickup, estimate.destination, selectedCategory, token)
    );
  }, [executeCabBooking, requestSecurityAuthorization, workflow]);

  const executeReadCabOtp = useCallback(
    async (bookingId: string, token: string | null) => {
      setPhase('processing');
      try {
        const res = await apiClient.requestCabOtp(bookingId, settings.securityPinRequired, token);
        setWorkflow((prev) =>
          prev.type === 'cab_booked'
            ? { ...prev, booking: { ...prev.booking, revealedTestOtp: res.testOtp } }
            : prev
        );
        appendTurn({ role: 'assistant', text: res.spokenOtpMessage, intent: 'read_otp' });
        speakResponse(res.spokenOtpMessage);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unable to retrieve test OTP.';
        if (/authorization|pin/i.test(msg)) {
          setAuthToken(null);
        }
        appendTurn({ role: 'system', text: msg });
        speakResponse(msg);
        setPhase('idle');
      }
    },
    [appendTurn, settings.securityPinRequired, speakResponse]
  );

  const handleRequestCabOtp = useCallback(
    (bookingId: string) => {
      requestSecurityAuthorization(
        'Authorize reading your simulated ride test OTP aloud.',
        (token) => executeReadCabOtp(bookingId, token)
      );
    },
    [executeReadCabOtp, requestSecurityAuthorization]
  );

  const handleCancelCabBooking = useCallback(
    async (bookingId: string) => {
      await apiClient.cancelCabBooking(bookingId).catch(() => {});
      setWorkflow((prev) =>
        prev.type === 'cab_booked' ? { ...prev, booking: { ...prev.booking, status: 'cancelled' } } : prev
      );
      const msg = 'Your simulated cab booking has been cancelled.';
      appendTurn({ role: 'assistant', text: msg, intent: 'cancel_action' });
      speakResponse(msg);
    },
    [appendTurn, speakResponse]
  );

  const handleConfirmMedicineOrder = useCallback(
    (medicineId: string) => {
      requestSecurityAuthorization(
        'Authorize placing your simulated pharmacy medicine order.',
        async (token) => {
          setPhase('processing');
          try {
            const order = await apiClient.orderMedicine(
              { medicineId, quantity: 1, explicitConfirmed: true, requirePin: settings.securityPinRequired },
              token
            );
            setWorkflow({ type: 'medicine_ordered', order });
            speechService.playEarcon('success', settings.audioEarcons);
            const msg = `Simulated order ${order.orderId} placed for ${order.item.name} at ₹${order.totalInr}. Delivery estimate is ${order.item.deliveryEta}.`;
            appendTurn({ role: 'assistant', text: msg, intent: 'medicine_order' });
            speakResponse(msg);
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Medicine order failed.';
            appendTurn({ role: 'system', text: msg });
            speakResponse(msg);
            setPhase('idle');
          }
        }
      );
    },
    [appendTurn, requestSecurityAuthorization, settings.audioEarcons, settings.securityPinRequired, speakResponse]
  );

  const handleConfirmAppointment = useCallback(
    async (slotId: string) => {
      setPhase('processing');
      try {
        const appt = await apiClient.bookAppointment(slotId);
        setWorkflow({ type: 'appointment_booked', appointment: appt });
        speechService.playEarcon('success', settings.audioEarcons);
        const msg = `Simulated appointment confirmed with ${appt.slot.doctorName} for ${appt.slot.timeLabel} at ${appt.slot.clinic}.`;
        appendTurn({ role: 'assistant', text: msg, intent: 'doctor_appointment' });
        speakResponse(msg);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Could not book sample appointment.';
        appendTurn({ role: 'system', text: msg });
        speakResponse(msg);
        setPhase('idle');
      }
    },
    [appendTurn, settings.audioEarcons, speakResponse]
  );

  const handleConfirmPayBill = useCallback(() => {
    requestSecurityAuthorization(
      'Authorize simulated electricity bill payment of ₹1,240.',
      async (token) => {
        setPhase('processing');
        try {
          const updated = await apiClient.payElectricityBill(settings.securityPinRequired, token);
          setWorkflow({ type: 'electricity_bill', bill: updated });
          speechService.playEarcon('success', settings.audioEarcons);
          const msg = `Simulated electricity bill payment succeeded. Receipt number ${updated.receiptId}.`;
          appendTurn({ role: 'assistant', text: msg, intent: 'electricity_bill' });
          speakResponse(msg);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Simulated payment failed.';
          appendTurn({ role: 'system', text: msg });
          speakResponse(msg);
          setPhase('idle');
        }
      }
    );
  }, [appendTurn, requestSecurityAuthorization, settings.audioEarcons, settings.securityPinRequired, speakResponse]);

  const handleCommand = useCallback(
    async (utterance: string) => {
      const clean = utterance.trim();
      if (!clean) return;

      setActiveSection('assistant');
      appendTurn({ role: 'user', text: clean });
      setPhase('processing');

      try {
        const nlu = await apiClient.understandCommand({
          utterance: clean,
          language: selectedLanguage,
          locationGranted,
          hasActiveCabBooking: workflow.type === 'cab_booked' && workflow.booking.status !== 'cancelled',
          pendingWorkflow: workflow.type === 'none' ? null : workflow.type,
          recentTurns: turns
            .filter((t) => t.role === 'user' || t.role === 'assistant')
            .slice(-4)
            .map((t) => ({ role: t.role === 'user' ? 'user' : 'assistant', text: t.text })),
        });

        setAiConfigured(nlu.aiConfigured);
        if (nlu.aiNotice) {
          setAiNotice(nlu.aiNotice);
        }

        const primaryReply =
          selectedLanguage === 'te-IN' && nlu.spokenResponseTelugu
            ? nlu.spokenResponseTelugu
            : nlu.spokenResponse;

        if (nlu.intent === 'repeat_last') {
          handleRepeatLast();
          return;
        }

        if (nlu.intent === 'cancel_action') {
          setWorkflow({ type: 'none' });
          appendTurn({ role: 'assistant', text: primaryReply, intent: 'cancel_action', aiSource: nlu.aiSource });
          speakResponse(primaryReply, nlu.detectedLanguage);
          return;
        }

        if (nlu.needsClarification || nlu.intent === 'clarify') {
          const question = nlu.clarificationQuestion || primaryReply;
          setWorkflow({ type: 'clarification', question, originalUtterance: clean });
          appendTurn({
            role: 'assistant',
            text: question,
            teluguText: nlu.spokenResponseTelugu,
            intent: 'clarify',
            aiSource: nlu.aiSource,
          });
          speakResponse(question, nlu.detectedLanguage, true);
          return;
        }

        if (nlu.intent === 'confirm_action') {
          if (workflow.type === 'cab_estimate') {
            handleConfirmCabBooking();
            return;
          }
          if (workflow.type === 'medicine_catalog') {
            handleConfirmMedicineOrder(workflow.selectedId);
            return;
          }
          if (workflow.type === 'doctor_slots') {
            void handleConfirmAppointment(workflow.selectedSlotId);
            return;
          }
          if (workflow.type === 'electricity_bill' && workflow.bill.status === 'unpaid') {
            handleConfirmPayBill();
            return;
          }
        }

        if (nlu.intent === 'read_otp') {
          if (workflow.type === 'cab_booked' && workflow.booking.status !== 'cancelled') {
            handleRequestCabOtp(workflow.booking.bookingId);
          } else {
            appendTurn({ role: 'assistant', text: primaryReply, intent: 'read_otp', aiSource: nlu.aiSource });
            speakResponse(primaryReply, nlu.detectedLanguage);
          }
          return;
        }

        if (nlu.intent === 'cab_booking') {
          const destination = nlu.entities.destination || 'Vijayawada Railway Station';
          const preferredCat =
            nlu.entities.cabCategory === 'auto' || nlu.entities.cabCategory === 'sedan'
              ? nlu.entities.cabCategory
              : 'mini';

          if (!locationGranted) {
            setWorkflow({ type: 'cab_location_prompt', destination, preferredCategory: preferredCat });
            appendTurn({
              role: 'assistant',
              text: primaryReply,
              teluguText: nlu.spokenResponseTelugu,
              intent: 'cab_booking',
              aiSource: nlu.aiSource,
            });
            speakResponse(primaryReply, nlu.detectedLanguage);
          } else {
            await loadCabEstimate(pickupLocationLabel, destination, preferredCat);
          }
          return;
        }

        if (nlu.intent === 'medicine_order') {
          const catalogRes = await apiClient.getMedicineCatalog();
          const requestedName = (nlu.entities.medicineName || '').toLowerCase();
          const matched =
            catalogRes.items.find((item) => item.name.toLowerCase().includes(requestedName.split(' ')[0] || 'paracetamol')) ??
            catalogRes.items[0];
          setWorkflow({ type: 'medicine_catalog', items: catalogRes.items, selectedId: matched.id });
          const summary = `Found sample listing for ${matched.name} at ${matched.pharmacy} for ${matched.priceInr} rupees. Please review and confirm to place a simulated order.`;
          appendTurn({ role: 'assistant', text: summary, intent: 'medicine_order', aiSource: nlu.aiSource });
          speakResponse(summary, nlu.detectedLanguage);
          return;
        }

        if (nlu.intent === 'doctor_appointment') {
          const slotsRes = await apiClient.getDoctorSlots();
          const spec = (nlu.entities.specialty || '').toLowerCase();
          const matched =
            slotsRes.slots.find((s) => spec && s.specialty.toLowerCase().includes(spec.slice(0, 4))) ??
            slotsRes.slots[0];
          setWorkflow({ type: 'doctor_slots', slots: slotsRes.slots, selectedSlotId: matched.id });
          const summary = `Sample clinic slot available with ${matched.doctorName} (${matched.specialty}) on ${matched.timeLabel}, fee ${matched.feeInr} rupees. Confirm to book this simulated appointment.`;
          appendTurn({ role: 'assistant', text: summary, intent: 'doctor_appointment', aiSource: nlu.aiSource });
          speakResponse(summary, nlu.detectedLanguage);
          return;
        }

        if (nlu.intent === 'electricity_bill') {
          const bill = await apiClient.getElectricityBill();
          setWorkflow({ type: 'electricity_bill', bill });
          const summary = `Sample ${bill.provider} electricity bill for ${bill.billingMonth}: ${bill.unitsConsumed} units used, amount due is ${bill.amountDueInr} rupees, due on ${bill.dueDate}.`;
          appendTurn({ role: 'assistant', text: summary, intent: 'electricity_bill', aiSource: nlu.aiSource });
          speakResponse(summary, nlu.detectedLanguage);
          return;
        }

        if (nlu.intent === 'read_notifications') {
          const notifRes = await apiClient.getNotifications();
          setWorkflow({ type: 'notifications', items: notifRes.items });
          const spoken =
            selectedLanguage === 'te-IN'
              ? notifRes.items.map((n, i) => `సందేశం ${i + 1}: ${n.teluguSummary}`).join(' ')
              : notifRes.items.map((n, i) => `Notification ${i + 1}: ${n.title}. ${n.body}`).join(' ');
          appendTurn({ role: 'assistant', text: spoken, intent: 'read_notifications', aiSource: nlu.aiSource });
          speakResponse(spoken, nlu.detectedLanguage);
          return;
        }

        if (nlu.intent === 'open_app') {
          const appName = nlu.entities.appName || 'Phone';
          setWorkflow({ type: 'app_shortcut', appName });
          appendTurn({ role: 'assistant', text: primaryReply, intent: 'open_app', aiSource: nlu.aiSource });
          speakResponse(primaryReply, nlu.detectedLanguage);
          return;
        }

        if (nlu.intent === 'web_search') {
          const query = nlu.entities.searchQuery || clean;
          const searchRes = await apiClient.searchSimulated(query);
          setWorkflow({ type: 'search_results', query, results: searchRes.results });
          const summary = searchRes.results.map((r) => `${r.title}: ${r.summary}`).join(' ');
          appendTurn({ role: 'assistant', text: summary, intent: 'web_search', aiSource: nlu.aiSource });
          speakResponse(summary, nlu.detectedLanguage);
          return;
        }

        // Default / Help
        appendTurn({
          role: 'assistant',
          text: primaryReply,
          teluguText: nlu.spokenResponseTelugu,
          intent: nlu.intent,
          aiSource: nlu.aiSource,
        });
        speakResponse(primaryReply, nlu.detectedLanguage);
      } catch (err) {
        speechService.playEarcon('error', settings.audioEarcons);
        const msg = err instanceof Error ? err.message : 'Something went wrong while understanding your command.';
        appendTurn({ role: 'system', text: msg });
        speakResponse(msg);
        setPhase('idle');
      }
    },
    [
      appendTurn,
      handleConfirmAppointment,
      handleConfirmCabBooking,
      handleConfirmMedicineOrder,
      handleConfirmPayBill,
      handleRepeatLast,
      handleRequestCabOtp,
      loadCabEstimate,
      locationGranted,
      pickupLocationLabel,
      selectedLanguage,
      settings.audioEarcons,
      speakResponse,
      turns,
      workflow,
    ]
  );

  const handleToggleListening = useCallback(() => {
    if (phase === 'listening') {
      speechService.stopListening();
      speechService.playEarcon('listen_stop', settings.audioEarcons);
      setPhase('idle');
      return;
    }

    speechService.playEarcon('listen_start', settings.audioEarcons);
    setInterimTranscript('');
    setPhase('listening');

    const started = speechService.startListening({
      language: selectedLanguage,
      onInterim: (text) => setInterimTranscript(text),
      onFinal: (finalText) => {
        setInterimTranscript('');
        void handleCommand(finalText);
      },
      onError: (friendlyError) => {
        speechService.playEarcon('error', settings.audioEarcons);
        setInterimTranscript('');
        setPhase('idle');
        appendTurn({ role: 'system', text: friendlyError });
        speakResponse(friendlyError);
      },
      onEnd: () => {
        setPhase((prev) => (prev === 'listening' ? 'idle' : prev));
      },
    });

    if (!started) {
      setPhase('idle');
    }
  }, [appendTurn, handleCommand, phase, selectedLanguage, settings.audioEarcons, speakResponse]);

  useEffect(() => {
    toggleListeningRef.current = handleToggleListening;
  }, [handleToggleListening]);

  // Global keyboard shortcuts: Escape interrupts speech, Space starts/stops mic when not typing
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleStopSpeaking();
        return;
      }
      const target = e.target as HTMLElement | null;
      const isEditable =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (!isEditable && e.code === 'Space' && activeSection === 'assistant' && !pinModalOpen) {
        e.preventDefault();
        handleToggleListening();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeSection, handleStopSpeaking, handleToggleListening, pinModalOpen]);

  const hasLastMessage = useMemo(
    () => turns.some((t) => t.role === 'assistant'),
    [turns]
  );

  return (
    <div className={`min-h-screen flex flex-col ${settings.largeText ? 'large-text-mode' : ''}`}>
      <a href="#main-content" className="sr-only sr-only-focusable">
        Skip to main content
      </a>

      <TopBar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        onRepeatLast={handleRepeatLast}
        hasLastMessage={hasLastMessage}
      />

      <main id="main-content" className="flex-1 px-4 py-6 pb-24 sm:px-6 md:pb-10 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {activeSection === 'assistant' && (
            <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
              <div className="space-y-6 lg:col-span-7">
                <VoiceConsole
                  phase={phase}
                  interimTranscript={interimTranscript}
                  selectedLanguage={selectedLanguage}
                  onSelectLanguage={setSelectedLanguage}
                  onToggleListening={handleToggleListening}
                  onStopSpeaking={handleStopSpeaking}
                  onRepeatLast={handleRepeatLast}
                  onCancelOperation={() => {
                    setWorkflow({ type: 'none' });
                    speakResponse('Current task cancelled.');
                  }}
                  onSubmitTextCommand={(cmd) => void handleCommand(cmd)}
                  hasLastSpoken={hasLastMessage || Boolean(speechService.getLastSpokenText())}
                  hasPendingWorkflow={workflow.type !== 'none'}
                  aiNotice={aiNotice}
                  speechSupport={speechSupport}
                />
              </div>

              <div className="space-y-6 lg:col-span-5">
                <ActiveWorkflowPanel
                  workflow={workflow}
                  onGrantBrowserLocation={handleGrantBrowserLocation}
                  onUseSampleLocation={handleUseSampleLocation}
                  onDeclineLocation={handleDeclineLocation}
                  onSelectCabCategory={(cat) =>
                    setWorkflow((prev) => (prev.type === 'cab_estimate' ? { ...prev, selectedCategory: cat } : prev))
                  }
                  onConfirmCabBooking={handleConfirmCabBooking}
                  onRequestCabOtp={handleRequestCabOtp}
                  onCancelCabBooking={(id) => void handleCancelCabBooking(id)}
                  onSelectMedicine={(id) =>
                    setWorkflow((prev) => (prev.type === 'medicine_catalog' ? { ...prev, selectedId: id } : prev))
                  }
                  onConfirmMedicineOrder={handleConfirmMedicineOrder}
                  onSelectDoctorSlot={(slotId) =>
                    setWorkflow((prev) => (prev.type === 'doctor_slots' ? { ...prev, selectedSlotId: slotId } : prev))
                  }
                  onConfirmAppointment={(slotId) => void handleConfirmAppointment(slotId)}
                  onConfirmPayBill={handleConfirmPayBill}
                  onSpeakText={(txt) => speakResponse(txt)}
                  onChooseClarificationOption={(cmd) => void handleCommand(cmd)}
                />

                <ConversationLog
                  turns={turns}
                  onReplayText={(txt) => speakResponse(txt)}
                />
              </div>
            </div>
          )}

          {activeSection === 'services' && (
            <ServicesDirectoryView
              onLaunchCommand={(cmd) => {
                void handleCommand(cmd);
              }}
            />
          )}

          {activeSection === 'accessibility' && (
            <AccessibilitySettingsPanel
              settings={settings}
              onUpdateSettings={setSettings}
              selectedLanguage={selectedLanguage}
              onChangeLanguage={setSelectedLanguage}
              isAuthorizedSession={Boolean(authToken)}
              onLockSession={() => {
                setAuthToken(null);
                speakResponse('Security session locked.');
              }}
            />
          )}

          {activeSection === 'architecture' && (
            <HackathonDocsView aiConfigured={aiConfigured} speechSupport={speechSupport} />
          )}
        </div>
      </main>

      <footer className="hidden md:block border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
        {BRAND_CONFIG.appName} · {BRAND_CONFIG.shortTagline} · Service bookings, fares, and test OTPs are simulated demonstration workflows.
      </footer>

      <SecurityPinModal
        isOpen={pinModalOpen}
        actionDescription={pinActionLabel}
        onVerifyPin={handleVerifyPin}
        onVerifyBiometricDemo={handleVerifyBiometricDemo}
        onCancel={() => {
          setPinModalOpen(false);
          pendingSensitiveActionRef.current = null;
          speakResponse('Authorization cancelled. Sensitive action was not executed.');
        }}
        errorMessage={pinError}
        isVerifying={pinVerifying}
      />
    </div>
  );
}
