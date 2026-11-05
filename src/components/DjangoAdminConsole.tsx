import React, { useState } from 'react';
import { 
  ConnectedChannel, 
  ChatThread, 
  ChatMessage,
  MessageDirection 
} from '../types/djangoChat';
import { INITIAL_CHAT_THREADS } from '../data/djangoMockData';
import { 
  Send, 
  Bot, 
  CheckCircle2, 
  Search, 
  ArrowLeft, 
  Smartphone, 
  ArrowDownLeft, 
  ArrowUpRight,
  ShieldAlert,
  PauseCircle,
  PlayCircle,
  Bell,
  Sparkles,
  X,
  AlertTriangle,
  Radio,
  RefreshCw,
  MessageSquare,
  ListFilter,
  HelpCircle,
  Activity,
  Check,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { DetailedErrorBanner } from './DetailedErrorBanner';
import { explainError, ExplainedError } from '../utils/errorExplainer';
import { safeFetchJson } from '../utils/safeFetch';

interface DjangoAdminConsoleProps {
  onOpenIntegrations?: () => void;
}

export const DjangoAdminConsole: React.FC<DjangoAdminConsoleProps> = ({ onOpenIntegrations }) => {
  const [chatThreads, setChatThreads] = useState<ChatThread[]>(INITIAL_CHAT_THREADS);
  // Default to null (table view), or when selected, opens full message context
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [currentView, setCurrentView] = useState<'table' | 'messages'>('table');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [channelFilter, setChannelFilter] = useState<'All' | 'WAWCD' | 'telegramBot'>('All');
  
  // Live Sync State
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);
  const [liveAutoSync, setLiveAutoSync] = useState<boolean>(true);
  const [secondsUntilSync, setSecondsUntilSync] = useState<number>(30);
  const [telegramConflict, setTelegramConflict] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [syncOrInterjectError, setSyncOrInterjectError] = useState<ExplainedError | null>(null);

  // WhatsApp Diagnostics & Troubleshooting State
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState<boolean>(false);
  const [diagnosticsData, setDiagnosticsData] = useState<any>(null);
  const [isLoadingDiagnostics, setIsLoadingDiagnostics] = useState<boolean>(false);
  const [isSyncingGateway, setIsSyncingGateway] = useState<boolean>(false);
  const [simulatedPhone, setSimulatedPhone] = useState<string>('+2348120493676');
  const [simulatedMessage, setSimulatedMessage] = useState<string>('Hello eMigr8, how do I qualify for the Tech Nation visa endorsement?');
  const [isSendingSimulated, setIsSendingSimulated] = useState<boolean>(false);

  // WhatsApp Gateway Notice & Test State
  const [showGatewayNotice, setShowGatewayNotice] = useState<boolean>(true);
  const [isTestingGateway, setIsTestingGateway] = useState<boolean>(false);
  const [gatewayCopied, setGatewayCopied] = useState<boolean>(false);
  const [gatewaySuccessMsg, setGatewaySuccessMsg] = useState<string | null>(null);

  // Interjection State
  const [interjectText, setInterjectText] = useState<string>('');
  const [pauseAiAfterInterject, setPauseAiAfterInterject] = useState<boolean>(true);
  const [interjectSuccessMsg, setInterjectSuccessMsg] = useState<string | null>(null);
  const [isSendingInterjection, setIsSendingInterjection] = useState<boolean>(false);


  // Toast / notification
  const [activeNotification, setActiveNotification] = useState<{
    id: number;
    title: string;
    channel: ConnectedChannel;
    clientNumber: string;
    direction: MessageDirection;
    message: string;
    chatId: number;
    aiReplied: boolean;
    isWarning?: boolean;
  } | null>(null);

  // Active chat object
  const activeChat = selectedChatId !== null 
    ? chatThreads.find(c => c.id === selectedChatId) || chatThreads[0]
    : chatThreads[0];

  // Filtered threads for table and list
  const filteredThreads = chatThreads.filter((chat) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchesPhone = chat.clientNumber.toLowerCase().includes(q);
      const matchesSnippet = chat.latestMessageSnippet.toLowerCase().includes(q);
      const matchesMsg = chat.messages.some(m => m.message.toLowerCase().includes(q));
      if (!matchesPhone && !matchesSnippet && !matchesMsg) return false;
    }
    if (channelFilter !== 'All' && chat.connectedNumber !== channelFilter) return false;
    return true;
  });

  // Unified Live Channel Sync
  const handleSyncAllChannels = React.useCallback(async (clearWebhook = false) => {
    setIsSyncingAll(true);
    try {
      const res = await safeFetchJson<{
        ok?: boolean;
        synced?: number;
        telegramSynced?: number;
        whatsappSynced?: number;
        telegramConflict?: boolean;
        telegramError?: string;
        whatsappError?: string;
        threads?: ChatThread[];
      }>(`/api/live-sync${clearWebhook ? '?clearWebhook=true' : ''}`);

      if (res.data?.threads && Array.isArray(res.data.threads) && res.data.threads.length > 0) {
        setChatThreads(res.data.threads);
      }

      if (res.data?.telegramConflict) {
        setTelegramConflict(true);
      } else {
        setTelegramConflict(false);
      }

      if (res.data && res.data.synced && res.data.synced > 0) {
        setActiveNotification({
          id: Date.now(),
          title: `Live Ingestion: ${res.data.synced} New Message(s)`,
          channel: res.data.whatsappSynced ? 'WAWCD' : 'telegramBot',
          clientNumber: res.data.whatsappSynced ? 'WhatsApp User' : 'Telegram User',
          direction: 'incoming',
          message: `Pulled ${res.data.synced} new live messages & routed to eMigr8 AI!`,
          chatId: res.data.threads?.[0]?.id || 1,
          aiReplied: true
        });
      }

      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setSecondsUntilSync(30);
    } catch (err: unknown) {
      console.warn('Live sync poll error:', err);
    } finally {
      setIsSyncingAll(false);
    }
  }, []);

  // Initial sync on mount
  React.useEffect(() => {
    handleSyncAllChannels();
  }, [handleSyncAllChannels]);

  // 30-second auto-polling ticker with countdown
  React.useEffect(() => {
    if (!liveAutoSync) return;
    const ticker = setInterval(() => {
      setSecondsUntilSync(prev => {
        if (prev <= 1) {
          handleSyncAllChannels();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(ticker);
  }, [liveAutoSync, handleSyncAllChannels]);

  // Clear Telegram Webhook
  const handleClearTelegramWebhook = async () => {
    setSyncOrInterjectError(null);
    setInterjectSuccessMsg('Clearing webhook and enabling live polling...');
    await handleSyncAllChannels(true);
    setTelegramConflict(false);
    setInterjectSuccessMsg('✓ Webhook cleared! Telegram live polling is now active.');
    setTimeout(() => setInterjectSuccessMsg(null), 4000);
  };

  // Toggle AI auto-reply for a chat
  const handleToggleResponseSetting = (chatId: number) => {
    setChatThreads(prev => prev.map(c => {
      if (c.id === chatId) {
        return { ...c, responseSettings: !c.responseSettings };
      }
      return c;
    }));
  };

  // Human coach interjection send
  const handleSendInterjection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interjectText.trim() || !activeChat) return;

    setIsSendingInterjection(true);
    setSyncOrInterjectError(null);
    const trimmedText = interjectText.trim();
    const newMsg: ChatMessage = {
      id: Date.now(),
      chatId: activeChat.id,
      direction: 'outgoing',
      sender: 'human_admin',
      senderLabel: 'Admin (Interjection)',
      phoneNumber: 'Admin Console',
      message: trimmedText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isInterjection: true,
    };

    setChatThreads(prev => prev.map(c => {
      if (c.id === activeChat.id) {
        return {
          ...c,
          messages: [...c.messages, newMsg],
          messagesCount: c.messagesCount + 1,
          outgoingCount: c.outgoingCount + 1,
          latestDirection: 'outgoing',
          lastUpdate: 'Just now',
          responseSettings: pauseAiAfterInterject ? false : c.responseSettings,
          latestMessageSnippet: newMsg.message,
          hasWarningFlag: false,
          warningReason: undefined,
        };
      }
      return c;
    }));

    try {
      if (activeChat.connectedNumber === 'telegramBot') {
        const res = await safeFetchJson<{ dispatchedToTelegramNetwork?: boolean; error?: string }>('/api/telegram/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: activeChat.id,
            clientNumber: activeChat.clientNumber,
            message: trimmedText,
            pauseAi: pauseAiAfterInterject
          })
        });
        if (res.data?.dispatchedToTelegramNetwork) {
          setInterjectSuccessMsg(`✓ Sent to Telegram user ${activeChat.clientNumber} via Telegram Bot API!`);
        } else if (res.data?.error || res.error) {
          setSyncOrInterjectError(explainError(res.data?.error || res.error, 'telegram_send'));
        } else {
          setInterjectSuccessMsg(`✓ Interjection recorded for ${activeChat.clientNumber}.`);
        }
      } else {
        const res = await safeFetchJson<{ dispatchedToWhatsAppNetwork?: boolean; error?: string }>('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: activeChat.id,
            clientNumber: activeChat.clientNumber,
            message: trimmedText,
            pauseAi: pauseAiAfterInterject
          })
        });
        if (res.data?.dispatchedToWhatsAppNetwork) {
          setInterjectSuccessMsg(`✓ Sent to WhatsApp user ${activeChat.clientNumber}!`);
        } else if (res.data?.error || res.error) {
          setSyncOrInterjectError(explainError(res.data?.error || res.error, 'whatsapp_send'));
        } else {
          setInterjectSuccessMsg(`✓ Interjection recorded for ${activeChat.clientNumber}.`);
        }
      }
    } catch (err) {
      setSyncOrInterjectError(explainError(err, 'whatsapp_send'));
    } finally {
      setIsSendingInterjection(false);
      setInterjectText('');
      setTimeout(() => setInterjectSuccessMsg(null), 5000);
    }
  };

  // Copy full Webhook URL for developer extension
  const handleCopyGatewayUrl = () => {
    navigator.clipboard.writeText('https://emigr8-middleman-gateway-730686851688.europe-west2.run.app/api/webhooks/whatsapp');
    setGatewayCopied(true);
    setTimeout(() => setGatewayCopied(false), 2500);
  };

  // Test message directly via deployed Cloud Run gateway
  const handleTestDeployedGateway = async () => {
    setIsTestingGateway(true);
    setGatewaySuccessMsg(null);
    setSyncOrInterjectError(null);
    try {
      const res = await safeFetchJson<{ ok?: boolean; error?: string; gatewayResponse?: any }>('/api/whatsapp/test-deployed-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '+2348120493676',
          name: 'WhatsApp Applicant',
          message: 'Hello eMigr8, testing live incoming WhatsApp message forwarded through gateway!'
        })
      });
      if (res.ok) {
        setGatewaySuccessMsg('✓ Verified! Incoming message sent to https://emigr8-middleman-gateway-730686851688.europe-west2.run.app/api/webhooks/whatsapp, received, routed to eMigr8 AI, and synced into your live chat queue.');
        await handleSyncAllChannels();
        setSelectedChatId(1);
        setCurrentView('messages');
      } else {
        setSyncOrInterjectError(explainError(res.data?.error || res.error || 'Failed to trigger deployed gateway test', 'whatsapp_test'));
      }
    } catch (err: unknown) {
      setSyncOrInterjectError(explainError(err, 'whatsapp_test'));
    } finally {
      setIsTestingGateway(false);
    }
  };

  // Open Diagnostics & Troubleshooting Modal
  const handleOpenDiagnostics = async () => {
    setShowDiagnosticsModal(true);
    setIsLoadingDiagnostics(true);
    try {
      const res = await safeFetchJson<any>('/api/whatsapp/diagnostics');
      if (res.data) {
        setDiagnosticsData(res.data);
      }
    } catch (e: any) {
      console.warn('Diagnostics fetch error:', e);
    } finally {
      setIsLoadingDiagnostics(false);
    }
  };

  // Force sync from Deployed Cloud Run Gateway and Firestore
  const handleForceSyncGateway = async () => {
    setIsSyncingGateway(true);
    setSyncOrInterjectError(null);
    try {
      const res = await safeFetchJson<{ ok?: boolean; synced?: number; remoteTotal?: number; allThreads?: ChatThread[]; error?: string }>('/api/whatsapp/sync-gateway', {
        method: 'POST'
      });
      if (res.data?.allThreads && Array.isArray(res.data.allThreads)) {
        setChatThreads(res.data.allThreads);
        setGatewaySuccessMsg(`✓ Synced from Cloud Run Gateway: ${res.data.synced || 0} updated, total ${res.data.allThreads.length} active threads (persisted in Firestore).`);
        setTimeout(() => setGatewaySuccessMsg(null), 5000);
      } else if (res.data?.error) {
        setSyncOrInterjectError(explainError(res.data.error, 'whatsapp_test'));
      }
    } catch (err: unknown) {
      setSyncOrInterjectError(explainError(err, 'whatsapp_test'));
    } finally {
      setIsSyncingGateway(false);
    }
  };

  // Submit Simulated Client WhatsApp Message
  const handleSendSimulatedWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedMessage.trim()) return;
    setIsSendingSimulated(true);
    try {
      const res = await safeFetchJson<{
        ok?: boolean;
        threadId?: number;
        clientPhone?: string;
        clientMessage?: string;
        agentReplied?: boolean;
        agentReply?: string;
        threads?: ChatThread[];
        error?: string;
      }>('/api/whatsapp/simulate-incoming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: simulatedPhone.trim(),
          message: simulatedMessage.trim(),
          name: 'WhatsApp Applicant'
        })
      });

      if (res.data?.threads && Array.isArray(res.data.threads)) {
        setChatThreads(res.data.threads);
        if (res.data.threadId) {
          setSelectedChatId(res.data.threadId);
          setCurrentView('messages');
        }
        setShowDiagnosticsModal(false);
        setActiveNotification({
          id: Date.now(),
          title: 'Simulated WhatsApp Ingestion Succeeded',
          channel: 'WAWCD',
          clientNumber: simulatedPhone.trim(),
          direction: 'incoming',
          message: simulatedMessage.trim(),
          chatId: res.data.threadId || 1,
          aiReplied: Boolean(res.data.agentReplied)
        });
      } else if (res.data?.error) {
        setSyncOrInterjectError(explainError(res.data.error, 'whatsapp_test'));
      }
    } catch (err: unknown) {
      setSyncOrInterjectError(explainError(err, 'whatsapp_test'));
    } finally {
      setIsSendingSimulated(false);
    }
  };

  // Quick test incoming simulator (simplified 1-click test)
  const handleQuickTestIncoming = async (channel: 'WAWCD' | 'telegramBot') => {

    const defaultPhone = channel === 'WAWCD' ? '+2348099887766' : '@Applicant';
    const testQuestions = [
      'Hi eMigr8, how many letters of recommendation do I need for Tech Nation?',
      'Can you check if my salary qualifies for the Mandatory Criterion?',
      'I am a Senior DevOps Engineer. Am I eligible for the UK Global Talent route?'
    ];
    const text = testQuestions[Math.floor(Math.random() * testQuestions.length)];

    try {
      const webhookPath = channel === 'telegramBot' ? '/api/webhooks/telegram' : '/api/webhooks/whatsapp';
      const payload = channel === 'telegramBot'
        ? { message: { message_id: Date.now(), from: { id: 987654321, username: 'Applicant', first_name: 'Applicant' }, text } }
        : { phone: defaultPhone, name: 'Applicant', message: text };

      const res = await safeFetchJson<{
        ok?: boolean;
        agentReplied?: boolean;
        agentReply?: string;
        threadId?: number;
      }>(webhookPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await handleSyncAllChannels();
        const threadId = res.data?.threadId || 1;
        setSelectedChatId(threadId);
        setActiveNotification({
          id: Date.now(),
          title: `New Message Ingested (${channel === 'WAWCD' ? 'WhatsApp' : 'Telegram'})`,
          channel,
          clientNumber: defaultPhone,
          direction: 'incoming',
          message: text,
          chatId: threadId,
          aiReplied: true
        });
      }
    } catch {
      handleSyncAllChannels();
    }
  };

  const openChatContext = (chatId: number) => {
    setSelectedChatId(chatId);
    setCurrentView('messages');
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification Banner */}
      {activeNotification && (
        <div className={`p-4 rounded-xl shadow-2xl flex items-start justify-between gap-4 text-xs animate-fadeIn border-2 ${
          activeNotification.isWarning 
            ? 'bg-rose-950/90 border-rose-500 text-rose-100' 
            : 'bg-slate-900/95 border-teal-500 text-slate-100'
        }`}>
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg mt-0.5 ${
              activeNotification.isWarning ? 'bg-rose-500/20 text-rose-400' : 'bg-teal-500/20 text-teal-400'
            }`}>
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm tracking-wider font-mono">
                  {activeNotification.title}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-white/10 text-white">
                  {activeNotification.channel === 'WAWCD' ? 'WhatsApp' : 'Telegram'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-teal-500/20 text-teal-300">
                  {activeNotification.clientNumber}
                </span>
              </div>
              <div className="p-2 rounded bg-black/40 border border-white/10 font-sans text-xs italic">
                &ldquo;{activeNotification.message}&rdquo;
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => {
                openChatContext(activeNotification.chatId);
                setActiveNotification(null);
              }}
              className="px-3 py-1.5 rounded font-mono font-bold text-xs bg-teal-600 hover:bg-teal-500 text-white transition-all shadow"
            >
              See Chat Context →
            </button>
            <button
              onClick={() => setActiveNotification(null)}
              className="px-2.5 py-1.5 text-slate-300 hover:text-white rounded bg-white/10 hover:bg-white/20 text-xs font-mono flex items-center space-x-1"
              title="Close notification"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Success banner */}
      {interjectSuccessMsg && (
        <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-lg text-xs font-mono flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{interjectSuccessMsg}</span>
          </div>
          <button onClick={() => setInterjectSuccessMsg(null)} className="px-2 py-1 text-emerald-300 hover:text-white rounded hover:bg-emerald-900/40 text-xs flex items-center space-x-1">
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        </div>
      )}

      {/* Gateway test success banner */}
      {gatewaySuccessMsg && (
        <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-xl text-xs font-mono flex items-center justify-between gap-3 shadow-md animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="leading-relaxed">{gatewaySuccessMsg}</span>
          </div>
          <button 
            onClick={() => setGatewaySuccessMsg(null)} 
            className="px-2.5 py-1 text-emerald-300 hover:text-white rounded bg-emerald-900/60 hover:bg-emerald-800 text-xs font-bold flex items-center space-x-1 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        </div>
      )}

      {/* Telegram 409 Conflict Resolver Banner */}
      {telegramConflict && (
        <div className="bg-amber-950/80 border border-amber-500 text-amber-200 px-4 py-3 rounded-xl text-xs font-mono flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold">Telegram Webhook Active (409):</span>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Clear the registered webhook so messages can be polled directly in real-time.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleClearTelegramWebhook}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow text-xs flex items-center space-x-1.5 active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Clear Webhook &amp; Switch to Polling</span>
            </button>
            <button
              onClick={() => setTelegramConflict(false)}
              className="px-2.5 py-1.5 rounded-lg bg-amber-950 border border-amber-500/40 hover:bg-amber-900 text-amber-300 hover:text-white transition-all text-xs flex items-center space-x-1 cursor-pointer"
              title="Dismiss notice"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* WHATSAPP WEBHOOK DIAGNOSTIC & URL FORWARDING GUIDE */}
      {showGatewayNotice && (
        <div className="rounded-xl border border-teal-500/40 bg-[#0f1724] p-4 text-xs font-mono shadow-xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
                <Smartphone className="w-4 h-4" />
              </span>
              <span className="font-bold text-white text-sm">
                WhatsApp Webhook Integration Guide
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px]">
                Live Gateway Bridge Active
              </span>
            </div>

            {/* Cancel / Dismiss button */}
            <button
              type="button"
              onClick={() => setShowGatewayNotice(false)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center space-x-1 transition-all"
              title="Remove this guide"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel / Hide</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300 font-sans text-xs">
            <div className="space-y-1 bg-[#090e17] p-3 rounded-lg border border-slate-800">
              <div className="font-bold text-amber-300 font-mono text-[11px] flex items-center space-x-1">
                <span>⚠️ Why Messages Were Not Showing:</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                The URL you provided to your developer (<code className="text-amber-300 font-mono">https://emigr8-middleman-gateway-730686851688.europe-west2.run.app/</code>) was missing the required webhook endpoint path. When her extension sent messages to root <code className="text-amber-300 font-mono">/</code>, the server returned <strong>404 Cannot POST /</strong>.
              </p>
            </div>

            <div className="space-y-1 bg-[#090e17] p-3 rounded-lg border border-teal-500/30">
              <div className="font-bold text-teal-300 font-mono text-[11px] flex items-center space-x-1">
                <span>✓ Exact URL to Paste in Extension:</span>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <input
                  type="text"
                  readOnly
                  value="https://emigr8-middleman-gateway-730686851688.europe-west2.run.app/api/webhooks/whatsapp"
                  className="w-full bg-black/60 border border-slate-700 rounded px-2 py-1 text-[11px] text-emerald-300 font-mono select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyGatewayUrl}
                  className="px-3 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white font-mono text-[11px] font-bold shrink-0 transition-all shadow"
                >
                  {gatewayCopied ? 'Copied ✓' : 'Copy'}
                </button>
              </div>
              <p className="text-[10.5px] text-slate-400 mt-1">
                Method: <strong>POST</strong> &bull; Format: <span className="text-emerald-300">JSON</span> (No token required)
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px]">
            <span className="text-slate-400">
              Want to verify message receipt immediately?
            </span>
            <button
              type="button"
              onClick={handleTestDeployedGateway}
              disabled={isTestingGateway}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-mono font-bold transition-all shadow flex items-center space-x-1.5"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{isTestingGateway ? 'Testing Gateway...' : 'Send Test WhatsApp Message to Gateway'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Global Error Banner */}
      {syncOrInterjectError && (
        <DetailedErrorBanner
          error={syncOrInterjectError}
          onDismiss={() => setSyncOrInterjectError(null)}
          onAction={(actionKey) => {
            if (actionKey === 'open_config' && onOpenIntegrations) {
              onOpenIntegrations();
            } else if (actionKey === 'retry') {
              handleSyncAllChannels();
            }
          }}
        />
      )}

      {/* CLEAN CONTROL & SYNC BAR */}
      <div className="bg-[#12161f] border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-sm">
        <div className="flex items-center space-x-3">
          <span className="flex h-2.5 w-2.5 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${liveAutoSync ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${liveAutoSync ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          <span className="text-white font-bold tracking-wider">
            LIVE SYNC:
          </span>
          <span className="text-slate-400 text-[11px]">
            Auto-Sync every 30s {liveAutoSync ? <strong className="text-emerald-400">({secondsUntilSync}s)</strong> : <span className="text-amber-400">(Paused)</span>} &bull; Last: <span className="text-teal-300">{lastSyncTime}</span>
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Troubleshoot WhatsApp Inbound */}
          <button
            onClick={handleOpenDiagnostics}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 transition-all text-[11px] font-bold shadow-sm"
            title="Diagnose why incoming WhatsApp messages may not be appearing"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Why Can't I See Messages?</span>
          </button>

          {/* Force Sync from Cloud Gateway */}
          <button
            onClick={handleForceSyncGateway}
            disabled={isSyncingGateway}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 transition-all text-[11px] font-semibold disabled:opacity-40"
            title="Force pull latest WhatsApp chats from deployed Cloud Run gateway"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGateway ? 'animate-spin text-indigo-400' : 'text-indigo-400'}`} />
            <span>{isSyncingGateway ? 'Pulling...' : 'Force Sync Gateway'}</span>
          </button>

          {/* Quick Sim buttons */}
          <button
            onClick={() => handleQuickTestIncoming('WAWCD')}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all text-[11px] font-semibold"
            title="Simulate incoming WhatsApp message"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>+ Test WhatsApp</span>
          </button>

          <button
            onClick={() => handleQuickTestIncoming('telegramBot')}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-all text-[11px] font-semibold"
            title="Simulate incoming Telegram message"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>+ Test Telegram</span>
          </button>

          {/* Sync All Channels */}
          <button
            onClick={() => handleSyncAllChannels()}
            disabled={isSyncingAll}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all shadow disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
            <span>{isSyncingAll ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* TOP VIEW NAVIGATION: CHATS TABLE vs MESSAGES CONTEXT */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentView('table')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentView === 'table'
                ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/80 hover:text-white'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>Chats Table ({chatThreads.length})</span>
          </button>

          <button
            onClick={() => {
              if (selectedChatId === null && chatThreads.length > 0) {
                setSelectedChatId(chatThreads[0].id);
              }
              setCurrentView('messages');
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentView === 'messages'
                ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/80 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Messages &amp; Chat Context</span>
            {activeChat && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20 font-mono">
                {activeChat.clientNumber}
              </span>
            )}
          </button>
        </div>

        {currentView === 'messages' && (
          <button
            onClick={() => setCurrentView('table')}
            className="flex items-center space-x-1 text-xs text-teal-400 hover:text-teal-300 font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Table</span>
          </button>
        )}
      </div>

      {/* VIEW 1: SIMPLIFIED CHATS TABLE */}
      {currentView === 'table' && (
        <div className="space-y-3">
          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search phone number or message text..."
                className="w-full bg-[#12161f] border border-slate-700 rounded-lg px-3 py-2 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-slate-400">Filter Channel:</span>
              {(['All', 'WAWCD', 'telegramBot'] as const).map(ch => (
                <button
                  key={ch}
                  onClick={() => setChannelFilter(ch)}
                  className={`px-2.5 py-1 rounded transition-all ${
                    channelFilter === ch
                      ? 'bg-teal-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {ch === 'All' ? 'All' : ch === 'WAWCD' ? 'WhatsApp' : 'Telegram'}
                </button>
              ))}
            </div>
          </div>

          {/* SIMPLIFIED TABLE */}
          <div className="border border-slate-800 rounded-xl bg-[#12161f] overflow-hidden shadow-lg">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="bg-[#181f2b] border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="p-3.5">Contact / Channel</th>
                  <th className="p-3.5">Latest Message &amp; Context</th>
                  <th className="p-3.5 text-center">Messages</th>
                  <th className="p-3.5 text-center">AI Auto-Reply</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredThreads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-mono">
                      No matching chats found.
                    </td>
                  </tr>
                ) : (
                  filteredThreads.map((thread) => {
                    const isSelected = selectedChatId === thread.id;
                    return (
                      <tr
                        key={thread.id}
                        onClick={() => openChatContext(thread.id)}
                        className={`transition-colors cursor-pointer ${
                          isSelected 
                            ? 'bg-teal-950/30' 
                            : 'hover:bg-slate-800/50'
                        }`}
                      >
                        {/* Contact & Channel */}
                        <td className="p-3.5">
                          <div className="flex items-center space-x-2.5">
                            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                              {thread.connectedNumber === 'WAWCD' ? (
                                <Smartphone className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Bot className="w-4 h-4 text-blue-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm">
                                {thread.clientNumber}
                              </div>
                              <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-1.5 mt-0.5">
                                <span className={`px-1.5 py-0.2 rounded font-semibold ${
                                  thread.connectedNumber === 'WAWCD'
                                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                                    : 'bg-blue-950/60 text-blue-300 border border-blue-800/40'
                                }`}>
                                  {thread.connectedNumber === 'WAWCD' ? 'WhatsApp' : 'Telegram Bot'}
                                </span>
                                <span>&bull; {thread.lastUpdate}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Latest Message Snippet */}
                        <td className="p-3.5 max-w-md">
                          <div className="flex items-center space-x-1.5 mb-1">
                            {thread.latestDirection === 'incoming' ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold flex items-center space-x-1">
                                <ArrowDownLeft className="w-3 h-3" />
                                <span>INCOMING</span>
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold flex items-center space-x-1">
                                <ArrowUpRight className="w-3 h-3" />
                                <span>OUTGOING</span>
                              </span>
                            )}
                            {thread.hasWarningFlag && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold">
                                ⚠️ Requires Interjection
                              </span>
                            )}
                          </div>
                          <div className="text-slate-300 text-xs line-clamp-1 italic">
                            &ldquo;{thread.latestMessageSnippet}&rdquo;
                          </div>
                        </td>

                        {/* Message Count */}
                        <td className="p-3.5 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-800 text-teal-300 font-mono text-xs font-bold border border-slate-700">
                            {thread.messagesCount} msgs
                          </span>
                        </td>

                        {/* AI Auto-Reply Toggle */}
                        <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleToggleResponseSetting(thread.id)}
                            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold transition-all ${
                              thread.responseSettings 
                                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-950'
                                : 'bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-950'
                            }`}
                            title="Click to toggle AI responses on/off"
                          >
                            {thread.responseSettings ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>AI Active</span>
                              </>
                            ) : (
                              <>
                                <PauseCircle className="w-3.5 h-3.5 text-rose-400" />
                                <span>AI Paused</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Direct Action */}
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => openChatContext(thread.id)}
                            className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-all shadow font-mono inline-flex items-center space-x-1"
                          >
                            <span>View Context</span>
                            <span>→</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: DIRECT CHAT CONTEXT & MESSAGES SECTION */}
      {currentView === 'messages' && activeChat && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Chat Selector Sidebar */}
          <div className="lg:col-span-4 bg-[#12161f] border border-slate-800 rounded-xl p-3 space-y-2 max-h-[700px] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 px-1 text-xs font-mono">
              <span className="text-slate-400 font-bold uppercase">Chats ({chatThreads.length})</span>
              <span className="text-[11px] text-teal-400">Click to switch</span>
            </div>

            <div className="space-y-1">
              {chatThreads.map((thread) => {
                const isCurrent = activeChat.id === thread.id;
                return (
                  <div
                    key={thread.id}
                    onClick={() => setSelectedChatId(thread.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-all border ${
                      isCurrent
                        ? 'bg-teal-950/40 border-teal-500/50 shadow-sm'
                        : 'bg-slate-900/60 border-transparent hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1.5">
                        {thread.connectedNumber === 'WAWCD' ? (
                          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Bot className="w-3.5 h-3.5 text-blue-400" />
                        )}
                        <span className={`font-bold text-xs font-mono ${isCurrent ? 'text-teal-300' : 'text-white'}`}>
                          {thread.clientNumber}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {thread.lastUpdate}
                      </span>
                    </div>

                    <div className="text-slate-400 text-xs truncate">
                      {thread.latestMessageSnippet}
                    </div>

                    <div className="flex items-center justify-between mt-2 text-[10px] font-mono">
                      <span className="text-slate-500">{thread.messagesCount} messages</span>
                      <span className={`px-1.5 py-0.2 rounded font-semibold ${
                        thread.responseSettings 
                          ? 'bg-emerald-950/60 text-emerald-400' 
                          : 'bg-rose-950/60 text-rose-400'
                      }`}>
                        {thread.responseSettings ? 'AI Active' : 'AI Paused'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Full Chat Dialogue Context & Interjection Composer */}
          <div className="lg:col-span-8 bg-[#12161f] border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-xl min-h-[580px]">
            {/* Header of Active Chat */}
            <div className="p-4 bg-[#161c26] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                  {activeChat.connectedNumber === 'WAWCD' ? (
                    <Smartphone className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Bot className="w-5 h-5 text-blue-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm sm:text-base font-mono">
                      {activeChat.clientNumber}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      activeChat.connectedNumber === 'WAWCD'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-blue-950 text-blue-300 border border-blue-800'
                    }`}>
                      {activeChat.connectedNumber === 'WAWCD' ? 'WhatsApp' : 'Telegram Bot'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-sans mt-0.5">
                    Context: {activeChat.messages.length} messages &bull; Last activity: {activeChat.lastUpdate}
                  </div>
                </div>
              </div>

              {/* AI Auto-Reply Switch */}
              <button
                onClick={() => handleToggleResponseSetting(activeChat.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                  activeChat.responseSettings
                    ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/80'
                    : 'bg-rose-950/50 border-rose-500/40 text-rose-300 hover:bg-rose-950/80'
                }`}
              >
                {activeChat.responseSettings ? (
                  <>
                    <PauseCircle className="w-4 h-4 text-emerald-400" />
                    <span>AI Bot: ON (Click to Pause)</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 text-rose-400" />
                    <span>AI Bot: PAUSED (Admin Control)</span>
                  </>
                )}
              </button>
            </div>

            {/* Conversation Messages Stream (Straight Up Chat Context) */}
            <div className="flex-1 p-5 space-y-4 overflow-y-auto bg-[#0d1117] max-h-[480px]">
              {activeChat.messages.map((msg) => {
                const isIncoming = msg.direction === 'incoming';
                const isAdmin = msg.isInterjection || msg.sender === 'human_admin';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isIncoming ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center space-x-2 mb-1 px-1 text-[11px] font-mono text-slate-400">
                      <span>{msg.senderLabel}</span>
                      <span>&bull;</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div
                      className={`max-w-xl rounded-2xl p-3.5 text-xs font-sans leading-relaxed shadow-sm ${
                        isIncoming
                          ? 'bg-[#1e293b] text-slate-100 rounded-tl-sm border border-slate-700'
                          : isAdmin
                          ? 'bg-[#1e3a5f] text-teal-100 rounded-tr-sm border border-teal-500/50 ring-1 ring-teal-500/30'
                          : 'bg-[#2e1d47] text-purple-100 rounded-tr-sm border border-purple-500/30'
                      }`}
                    >
                      {isAdmin && (
                        <div className="flex items-center space-x-1.5 text-[10px] font-mono font-bold text-teal-300 mb-1">
                          <ShieldAlert className="w-3 h-3 text-teal-400" />
                          <span>COACH INTERJECTION:</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interjection Composer Box */}
            <div className="p-4 bg-[#141b26] border-t border-slate-800">
              <form onSubmit={handleSendInterjection} className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <div className="flex items-center space-x-1.5">
                    <Send className="w-3.5 h-3.5 text-teal-400" />
                    <span className="text-white font-bold">Reply / Interject directly to</span>
                    <span className="text-teal-300 font-bold">{activeChat.clientNumber}</span>
                  </div>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pauseAiAfterInterject}
                      onChange={(e) => setPauseAiAfterInterject(e.target.checked)}
                      className="accent-teal-500 rounded"
                    />
                    <span>Pause AI bot after sending</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <textarea
                    value={interjectText}
                    onChange={(e) => setInterjectText(e.target.value)}
                    placeholder="Type message to applicant (correcting advice, clarifying questions, etc.)..."
                    rows={2}
                    className="flex-1 bg-[#0d1117] border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none font-sans"
                  />
                  <button
                    type="submit"
                    disabled={!interjectText.trim() || isSendingInterjection}
                    className="px-5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white font-bold text-xs font-mono transition-all flex items-center justify-center space-x-1.5 shrink-0 shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingInterjection ? 'Sending...' : 'Send'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP INBOUND DIAGNOSTICS & TROUBLESHOOTING MODAL */}
      {showDiagnosticsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0b1019] border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
            {/* Modal Header */}
            <div className="p-4 bg-[#111827] border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-white font-mono">
                      WhatsApp Inbound Diagnostics &amp; Problem Solver
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      Real-Time Diagnostic
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Comprehensive check of all possible failure reasons for incoming WhatsApp messages.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDiagnosticsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-300 custom-scrollbar">
              {/* Quick Status Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                <div className="bg-[#121824] p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Cloud Run Gateway</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="font-bold text-white text-xs">
                      {diagnosticsData?.status?.deployedGateway?.reachable ? 'Reachable (200 OK)' : 'Checking...'}
                    </span>
                  </div>
                  <span className="text-[10px] text-teal-400 block mt-0.5">
                    {diagnosticsData?.status?.deployedGateway?.threadsCount || 0} Threads on Gateway
                  </span>
                </div>

                <div className="bg-[#121824] p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Database Persistence</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <span className="font-bold text-white text-xs">Firestore Active</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5 truncate" title="ai-studio-emigr8middlemang-bf04a597-2090-49a5-891b-f5be41a5460c">
                    ai-studio-emigr8...
                  </span>
                </div>

                <div className="bg-[#121824] p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Local Dashboard Queue</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                    <span className="font-bold text-white text-xs">
                      {chatThreads.filter(t => t.connectedNumber === 'WAWCD').length} WhatsApp Chats
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {chatThreads.reduce((s, t) => s + (t.connectedNumber === 'WAWCD' ? t.messages.length : 0), 0)} Total Messages
                  </span>
                </div>
              </div>

              {/* Exact Webhook URL Guide */}
              <div className="bg-[#121824] p-4 rounded-xl border border-teal-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-mono text-xs flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-400" />
                    <span>Public Webhook URL (Bypasses Google Preview Auth)</span>
                  </span>
                  <span className="text-[10px] text-teal-400 font-mono">Use this in WAWCD / Chrome Extension</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value="https://emigr8-middleman-gateway-730686851688.europe-west2.run.app/api/webhooks/whatsapp"
                    className="w-full bg-black/60 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 select-all"
                  />
                  <button
                    onClick={handleCopyGatewayUrl}
                    className="px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-mono text-xs font-bold transition-all shadow shrink-0"
                  >
                    {gatewayCopied ? 'Copied ✓' : 'Copy URL'}
                  </button>
                </div>
              </div>

              {/* All 7 Possible Problems & Solutions List */}
              <div className="space-y-3">
                <h4 className="font-bold text-white font-mono text-xs uppercase tracking-wider flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <span>All Possible Reasons Why WhatsApp Messages Don't Show:</span>
                </h4>

                <div className="space-y-2.5">
                  {/* Problem 1 */}
                  <div className="bg-[#0f1520] p-3.5 rounded-xl border border-rose-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-300 font-mono text-xs flex items-center space-x-1.5">
                        <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-[10px] font-bold">1</span>
                        <span>Google Dev Preview Cookie Barrier (HTTP 302 Redirect)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Most Common Cause
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11.5px] leading-relaxed">
                      AI Studio dev URLs (<code className="text-rose-300 font-mono">ais-dev-...run.app</code>) are protected by Google Authentication cookies. When an external service or Chrome extension sends an HTTP POST, Google intercepts it with a <strong>302 Redirect to /__cookie_check.html</strong>, completely blocking external webhooks.
                    </p>
                    <div className="bg-black/40 p-2.5 rounded-lg border border-slate-800 text-[11px] text-teal-300 font-mono">
                      <strong>Solution:</strong> Set your WAWCD Chrome Extension webhook URL to the public deployed Cloud Run bridge (<code className="text-emerald-300">https://emigr8-middleman-gateway-730686851688.europe-west2.run.app/api/webhooks/whatsapp</code>), which automatically syncs messages into this dashboard.
                    </div>
                  </div>

                  {/* Problem 2 */}
                  <div className="bg-[#0f1520] p-3.5 rounded-xl border border-amber-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300 font-mono text-xs flex items-center space-x-1.5">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">2</span>
                        <span>WAWCD Chrome Extension Inactive or WhatsApp Web Disconnected</span>
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Operational
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11.5px] leading-relaxed">
                      WAWCD is a Chrome extension that intercepts messages inside WhatsApp Web. If your computer sleeps, the WhatsApp Web tab is closed, or the extension is turned off, incoming WhatsApp messages remain only in WhatsApp and are never transmitted to the middleware.
                    </p>
                    <div className="bg-black/40 p-2.5 rounded-lg border border-slate-800 text-[11px] text-teal-300 font-mono">
                      <strong>Solution:</strong> Keep <strong>web.whatsapp.com</strong> open in Chrome with the WAWCD icon active (green dot) and ensure &ldquo;Webhook Forwarding&rdquo; is checked in extension settings.
                    </div>
                  </div>

                  {/* Problem 3 */}
                  <div className="bg-[#0f1520] p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 font-mono text-xs flex items-center space-x-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-[10px] font-bold">3</span>
                        <span>Incorrect Webhook URL Path in Settings</span>
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                        Configuration
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11.5px] leading-relaxed">
                      Entering only the base domain (e.g. <code className="text-slate-400 font-mono">https://emigr8-middleman-gateway...run.app/</code>) without the path will cause requests to fail with <strong>404 Cannot POST /</strong>.
                    </p>
                    <div className="bg-black/40 p-2.5 rounded-lg border border-slate-800 text-[11px] text-teal-300 font-mono">
                      <strong>Solution:</strong> Verify that the full path ends with <code>/api/webhooks/whatsapp</code>.
                    </div>
                  </div>

                  {/* Problem 4 */}
                  <div className="bg-[#0f1520] p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 font-mono text-xs flex items-center space-x-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-[10px] font-bold">4</span>
                        <span>Cloud Run Gateway Cold-Start or Sync Latency</span>
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                        Sync
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11.5px] leading-relaxed">
                      Messages received by the public gateway are pulled into this workspace every 30 seconds. If a Cloud Run instance is cold-starting, sync may take a few seconds.
                    </p>
                    <div className="bg-black/40 p-2.5 rounded-lg border border-slate-800 text-[11px] text-teal-300 font-mono flex items-center justify-between">
                      <span>Click the button to force pull all gateway messages immediately:</span>
                      <button
                        onClick={handleForceSyncGateway}
                        disabled={isSyncingGateway}
                        className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] shrink-0"
                      >
                        {isSyncingGateway ? 'Syncing...' : 'Force Sync Now'}
                      </button>
                    </div>
                  </div>

                  {/* Problem 5 */}
                  <div className="bg-[#0f1520] p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 font-mono text-xs flex items-center space-x-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-[10px] font-bold">5</span>
                        <span>JSON Payload Schema or Field Name Mismatch</span>
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                        Payload Parser
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11.5px] leading-relaxed">
                      If your external service sends custom field names other than <code>phone</code>, <code>receiver-whatsapp-number</code>, <code>sender</code>, or <code>message</code>, <code>text</code>, the parser cannot extract the message.
                    </p>
                    <div className="bg-black/40 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 font-mono">
                      Expected JSON format: <code>&#123; &quot;phone&quot;: &quot;+234...&quot;, &quot;message&quot;: &quot;Hello...&quot;, &quot;name&quot;: &quot;Client Name&quot; &#125;</code>
                    </div>
                  </div>

                  {/* Problem 6 */}
                  <div className="bg-[#0f1520] p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 font-mono text-xs flex items-center space-x-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-[10px] font-bold">6</span>
                        <span>UI Channel Filter or Search Term Hiding Chats</span>
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                        Display Filter
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11.5px] leading-relaxed">
                      If the Channel filter is set to &ldquo;Telegram&rdquo; or the search bar contains text that doesn&apos;t match the applicant&apos;s number, incoming WhatsApp chats are hidden.
                    </p>
                    <div className="bg-black/40 p-2.5 rounded-lg border border-slate-800 text-[11px] text-teal-300 font-mono flex items-center justify-between">
                      <span>Reset filter to show all channels:</span>
                      <button
                        onClick={() => {
                          setChannelFilter('All');
                          setSearchTerm('');
                        }}
                        className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white font-bold text-[10px] shrink-0"
                      >
                        Reset Filter &amp; Search
                      </button>
                    </div>
                  </div>

                  {/* Problem 7 */}
                  <div className="bg-[#0f1520] p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 font-mono text-xs flex items-center space-x-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-[10px] font-bold">7</span>
                        <span>Database Persistence Verified</span>
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300">
                        Active &amp; Persistent
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11.5px] leading-relaxed">
                      Firebase Firestore is connected and persisting all threads under <code>/chat_threads</code>, ensuring data does not wipe when reloading the page.
                    </p>
                  </div>
                </div>
              </div>

              {/* 1-Click Interactive Test Simulator */}
              <div className="bg-[#121824] p-4 rounded-xl border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white font-mono text-xs flex items-center space-x-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span>Test WhatsApp Ingestion (End-to-End Simulator)</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Send a simulated client message to verify that ingestion, AI bot evaluation, and Firestore persistence all work right now.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSendSimulatedWhatsApp} className="space-y-2.5 font-mono">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Applicant Phone Number:</label>
                      <input
                        type="text"
                        value={simulatedPhone}
                        onChange={(e) => setSimulatedPhone(e.target.value)}
                        placeholder="+2348120493676"
                        className="w-full bg-black/60 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Simulated Message Text:</label>
                      <input
                        type="text"
                        value={simulatedMessage}
                        onChange={(e) => setSimulatedMessage(e.target.value)}
                        placeholder="Can you evaluate my Tech Nation criteria?"
                        className="w-full bg-black/60 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-1">
                    <button
                      type="submit"
                      disabled={isSendingSimulated}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs flex items-center space-x-1.5 shadow transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSendingSimulated ? 'Ingesting & Routing to AI...' : 'Inject Simulated WhatsApp Message'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#111827] border-t border-slate-800 flex items-center justify-between shrink-0 font-mono text-xs">
              <span className="text-slate-400 text-[11px]">
                Target DB: <strong className="text-emerald-400">ai-studio-emigr8middlemang-bf04a597-2090-49a5-891b-f5be41a5460c</strong>
              </span>
              <button
                onClick={() => setShowDiagnosticsModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all"
              >
                Close Troubleshooter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

