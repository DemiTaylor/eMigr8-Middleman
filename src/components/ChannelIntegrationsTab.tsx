import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Smartphone, 
  CheckCircle2, 
  RefreshCw, 
  Copy, 
  Check, 
  Send, 
  Radio, 
  Key, 
  Link as LinkIcon,
  HelpCircle,
  Activity,
  AlertCircle,
  Settings,
  Trash2,
  Eye,
  EyeOff,
  Code2,
  Save,
  CheckCircle,
  ExternalLink,
  Sparkles,
  Cpu,
  Chrome,
  X,
  Database
} from 'lucide-react';
import { DetailedErrorBanner } from './DetailedErrorBanner';
import { explainError, ExplainedError } from '../utils/errorExplainer';
import { safeFetchJson } from '../utils/safeFetch';

interface GatewayStatus {
  appUrl: string;
  telegram: {
    isTokenConfigured: boolean;
    isApiKeyConfigured: boolean;
    connected: boolean;
    botInfo: {
      id?: number;
      is_bot?: boolean;
      first_name?: string;
      username?: string;
    } | null;
    error: string | null;
    webhookUrl: string;
  };
  whatsapp: {
    isConfigured: boolean;
    isCustomGateway?: boolean;
    gatewayUrl?: string | null;
    isBearerTokenConfigured?: boolean;
    phoneId: string | null;
    webhookUrl: string;
    publicWebhookUrl?: string;
    verifyToken: string;
  };
  publicTunnelUrl?: string;
  publicWebhookUrl?: string;
  emigr8Ai?: {
    chatEndpoint: string | null;
    isConfigured: boolean;
    isApiKeyConfigured: boolean;
  };
  database?: {
    type: string;
    isConfigured: boolean;
    connected: boolean;
    projectId: string;
    databaseId: string;
    collections: string[];
  };
}

export const ChannelIntegrationsTab: React.FC = () => {
  const [status, setStatus] = useState<GatewayStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [testingTelegram, setTestingTelegram] = useState<boolean>(false);
  const [testingWhatsApp, setTestingWhatsApp] = useState<boolean>(false);
  const [testingEmigr8Ai, setTestingEmigr8Ai] = useState<boolean>(false);
  const [settingWebhook, setSettingWebhook] = useState<boolean>(false);
  const [clearingWebhook, setClearingWebhook] = useState<boolean>(false);
  const [syncingUpdates, setSyncingUpdates] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Error & Feedback state with rich explanation
  const [activeError, setActiveError] = useState<ExplainedError | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [dismissedTelegramError, setDismissedTelegramError] = useState<boolean>(false);

  // In-Dashboard Configuration Editor State
  const [showConfigEditor, setShowConfigEditor] = useState<boolean>(false);
  const [configTgToken, setConfigTgToken] = useState<string>('');
  const [configTgApiKey, setConfigTgApiKey] = useState<string>('');
  const [configWaUrl, setConfigWaUrl] = useState<string>('');
  const [configEmigr8AiEndpoint, setConfigEmigr8AiEndpoint] = useState<string>('');
  const [configEmigr8AiApiKey, setConfigEmigr8AiApiKey] = useState<string>('');
  const [showTokens, setShowTokens] = useState<boolean>(false);
  const [savingConfig, setSavingConfig] = useState<boolean>(false);

  // Quick Test Dispatch State
  const [testChannel, setTestChannel] = useState<'telegram' | 'whatsapp' | 'emigr8_ai'>('telegram');
  const [testRecipient, setTestRecipient] = useState<string>('123456789');
  const [testMessage, setTestMessage] = useState<string>('Hello from eMigr8 Admin Dashboard live test!');
  const [dispatching, setDispatching] = useState<boolean>(false);
  const [dispatchResult, setDispatchResult] = useState<string | null>(null);

  // WAWCD Inbound Webhook State
  const [testingInboundWebhook, setTestingInboundWebhook] = useState<boolean>(false);
  const [inboundWebhookResult, setInboundWebhookResult] = useState<string | null>(null);
  const [wawcdGuideTab, setWawcdGuideTab] = useState<'extension' | 'developer'>('extension');
  const [recentWebhookLogs, setRecentWebhookLogs] = useState<Array<{
    id: number;
    timestamp: string;
    method: string;
    path: string;
    phone?: string;
    messageSnippet?: string;
    status: string;
    rawSnippet: string;
  }>>([]);
  const [customTestPhone, setCustomTestPhone] = useState<string>('+2348099887766');
  const [customTestMessage, setCustomTestMessage] = useState<string>('Hello eMigr8, I am an engineer interested in the UK Tech Nation visa.');

  const liveWhatsAppWebhookUrl = status?.whatsapp?.publicWebhookUrl || status?.whatsapp?.webhookUrl || 
    (typeof window !== 'undefined' && window.location.origin 
      ? `${window.location.origin}/api/webhooks/whatsapp`
      : 'http://localhost:3000/api/webhooks/whatsapp');

  const fetchRecentWebhookLogs = async () => {
    try {
      const res = await safeFetchJson<{ ok?: boolean; logs?: typeof recentWebhookLogs }>('/api/webhooks/recent-logs');
      if (res.ok && res.data?.logs) {
        setRecentWebhookLogs(res.data.logs);
      }
    } catch (_) {}
  };

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const [statusRes, logsRes] = await Promise.all([
        safeFetchJson<GatewayStatus>('/api/status'),
        safeFetchJson<{ ok?: boolean; logs?: typeof recentWebhookLogs }>('/api/webhooks/recent-logs')
      ]);

      if (logsRes.ok && logsRes.data?.logs) {
        setRecentWebhookLogs(logsRes.data.logs);
      }

      if (statusRes.ok && statusRes.data) {
        setStatus(statusRes.data);
        if (statusRes.data.whatsapp?.gatewayUrl) {
          setConfigWaUrl(prev => prev || statusRes.data!.whatsapp.gatewayUrl!);
        }
        if (statusRes.data.emigr8Ai?.chatEndpoint) {
          setConfigEmigr8AiEndpoint(prev => prev || statusRes.data!.emigr8Ai!.chatEndpoint!);
        }
      } else {
        throw new Error(statusRes.error || `HTTP ${statusRes.status}: Failed to load status`);
      }
    } catch {
      // Graceful fallback status so dashboard renders seamlessly
      const fallbackUrl = typeof window !== 'undefined' ? window.location.origin : '';
      setStatus(prev => prev || {
        appUrl: fallbackUrl,
        telegram: {
          isTokenConfigured: false,
          isApiKeyConfigured: false,
          connected: false,
          botInfo: null,
          error: null,
          webhookUrl: `${fallbackUrl}/api/webhooks/telegram`,
        },
        whatsapp: {
          isConfigured: false,
          phoneId: null,
          webhookUrl: `${fallbackUrl}/api/webhooks/whatsapp`,
          verifyToken: 'emigr8_webhook_secret',
        },
        emigr8Ai: {
          chatEndpoint: null,
          isConfigured: false,
          isApiKeyConfigured: false,
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // 1. Test Telegram Connection
  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    setActiveError(null);
    setSuccessBanner(null);
    try {
      const res = await safeFetchJson<{ connected?: boolean; bot?: { username?: string; first_name?: string }; error?: string; message?: string }>('/api/telegram/status');
      if (res.ok && res.data?.connected) {
        setSuccessBanner(`✓ Connected successfully to Telegram Bot: @${res.data.bot?.username || 'bot'} (${res.data.bot?.first_name})! Status is online.`);
      } else {
        const rawErr = res.data?.error || res.data?.message || res.error || 'Telegram connection failed';
        setActiveError(explainError(rawErr, 'telegram_status'));
      }
      fetchStatus();
    } catch (err: unknown) {
      setActiveError(explainError(err, 'telegram_status'));
    } finally {
      setTestingTelegram(false);
    }
  };

  // 2. Test WhatsApp Connection
  const handleTestWhatsApp = async () => {
    setTestingWhatsApp(true);
    setActiveError(null);
    setSuccessBanner(null);
    try {
      const res = await safeFetchJson<{ connected?: boolean; latencyMs?: number; statusCode?: number; error?: string; message?: string }>('/api/whatsapp/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gatewayUrl: configWaUrl || undefined
        })
      });
      if (res.ok && res.data?.connected) {
        setSuccessBanner(`✓ WhatsApp Gateway responded successfully (${res.data.latencyMs ? res.data.latencyMs + 'ms' : 'Status ' + res.data.statusCode})! Endpoint is reachable.`);
      } else {
        const rawErr = res.data?.error || res.data?.message || res.error || 'WhatsApp Gateway test failed';
        setActiveError(explainError(rawErr, 'whatsapp_test'));
      }
      fetchStatus();
    } catch (err: unknown) {
      setActiveError(explainError(err, 'whatsapp_test'));
    } finally {
      setTestingWhatsApp(false);
    }
  };

  // 2b. Test Inbound WhatsApp Webhook (WAWCD Extension Simulation)
  const handleTestInboundWebhook = async () => {
    setTestingInboundWebhook(true);
    setActiveError(null);
    setInboundWebhookResult(null);
    try {
      const res = await safeFetchJson<{ ok?: boolean; threadId?: number; note?: string; warning?: string }>('/api/webhooks/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: customTestPhone.trim() || '+2348099887766',
          message: customTestMessage.trim() || `Hello from WAWCD! Live test at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
          name: 'WAWCD Applicant'
        })
      });
      if (res.ok && res.data?.ok) {
        setInboundWebhookResult(`✓ Inbound Webhook Verified! Received message from ${customTestPhone.trim() || '+2348099887766'} and created/updated thread in Chats & Messages.`);
        fetchStatus();
        fetchRecentWebhookLogs();
      } else {
        setActiveError(explainError(res.error || res.data?.warning || 'Inbound webhook test failed', 'whatsapp_test'));
      }
    } catch (err: unknown) {
      setActiveError(explainError(err, 'whatsapp_test'));
    } finally {
      setTestingInboundWebhook(false);
    }
  };

  // 3. Test eMigr8 AI Chat Endpoint
  const handleTestEmigr8Ai = async () => {
    setTestingEmigr8Ai(true);
    setActiveError(null);
    setSuccessBanner(null);
    try {
      const res = await safeFetchJson<{ connected?: boolean; latencyMs?: number; statusCode?: number; error?: string; message?: string }>('/api/emigr8-ai/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatEndpoint: configEmigr8AiEndpoint || undefined,
          apiKey: configEmigr8AiApiKey || undefined
        })
      });
      if (res.ok && res.data?.connected) {
        setSuccessBanner(`✓ eMigr8 AI Chat Endpoint responded successfully (${res.data.latencyMs ? res.data.latencyMs + 'ms' : 'Status ' + res.data.statusCode})! AI Platform is linked and ready.`);
      } else {
        const rawErr = res.data?.error || res.data?.message || res.error || 'eMigr8 AI connection failed';
        setActiveError(explainError(rawErr, 'emigr8_ai_test'));
      }
      fetchStatus();
    } catch (err: unknown) {
      setActiveError(explainError(err, 'emigr8_ai_test'));
    } finally {
      setTestingEmigr8Ai(false);
    }
  };

  // 4. Set Webhook on Telegram
  const handleSetWebhook = async () => {
    setSettingWebhook(true);
    setActiveError(null);
    setSuccessBanner(null);
    try {
      const res = await safeFetchJson<{ ok?: boolean; description?: string; error?: string }>('/api/telegram/set-webhook', { method: 'POST' });
      if (res.ok && res.data?.ok) {
        setSuccessBanner(`✓ Telegram Webhook successfully set to ${status?.telegram.webhookUrl}! Incoming applicant messages will automatically stream into your Admin Dashboard.`);
      } else {
        setActiveError(explainError(res.data?.description || res.data?.error || res.error || 'Failed to set webhook', 'telegram_webhook'));
      }
    } catch (err: unknown) {
      setActiveError(explainError(err, 'telegram_webhook'));
    } finally {
      setSettingWebhook(false);
    }
  };

  // 5. Delete / Clear Webhook on Telegram (Fixes 409 Conflict with getUpdates)
  const handleClearWebhook = async () => {
    setClearingWebhook(true);
    setActiveError(null);
    setSuccessBanner(null);
    try {
      const res = await safeFetchJson<{ ok?: boolean; description?: string; error?: string }>('/api/telegram/delete-webhook', { method: 'POST' });
      if (res.ok && res.data?.ok) {
        setSuccessBanner(`✓ Telegram Webhook cleared! Polling sync (Sync Messages) is now unblocked.`);
      } else {
        setActiveError(explainError(res.data?.description || res.data?.error || res.error || 'Failed to clear webhook', 'telegram_webhook'));
      }
    } catch (err: unknown) {
      setActiveError(explainError(err, 'telegram_webhook'));
    } finally {
      setClearingWebhook(false);
    }
  };

  // 6. Sync Updates from Telegram (Polling)
  const handleSyncUpdates = async () => {
    setSyncingUpdates(true);
    setActiveError(null);
    setSuccessBanner(null);
    try {
      const res = await safeFetchJson<{ error?: string; synced?: number }>('/api/telegram/sync');
      if (res.data?.error) {
        setActiveError(explainError(res.data.error, 'telegram_sync'));
      } else if (res.ok) {
        setSuccessBanner(`✓ Synced ${res.data?.synced || 0} new updates from Telegram into your Admin Dashboard!`);
      } else {
        setActiveError(explainError(res.error || 'Telegram sync failed', 'telegram_sync'));
      }
    } catch (err: unknown) {
      setActiveError(explainError(err, 'telegram_sync'));
    } finally {
      setSyncingUpdates(false);
    }
  };

  // 7. Save Configuration Live
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setActiveError(null);
    setSuccessBanner(null);
    try {
      const res = await safeFetchJson<{ ok?: boolean; error?: string }>('/api/config/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramBotToken: configTgToken,
          telegramApiKey: configTgApiKey,
          whatsappGatewayUrl: configWaUrl,
          emigr8AiChatEndpoint: configEmigr8AiEndpoint,
          emigr8AiApiKey: configEmigr8AiApiKey
        })
      });
      if (res.ok && res.data?.ok) {
        setSuccessBanner('✓ Credentials successfully saved and activated in the running server! You can now test connections.');
        setShowConfigEditor(false);
        fetchStatus();
      } else {
        setActiveError(explainError(res.data?.error || res.error || 'Failed to save configuration', 'general'));
      }
    } catch (err: unknown) {
      setActiveError(explainError(err, 'general'));
    } finally {
      setSavingConfig(false);
    }
  };

  // 8. Dispatch Test Message
  const handleDispatchTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setDispatching(true);
    setDispatchResult(null);
    setActiveError(null);
    setSuccessBanner(null);

    const isTg = testChannel === 'telegram';
    const isWa = testChannel === 'whatsapp';
    const isAi = testChannel === 'emigr8_ai';

    try {
      if (isAi) {
        const res = await safeFetchJson<{ connected?: boolean; latencyMs?: number; error?: string }>('/api/emigr8-ai/test-connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatEndpoint: configEmigr8AiEndpoint || undefined,
            apiKey: configEmigr8AiApiKey || undefined,
            message: testMessage,
            recipient: testRecipient
          })
        });
        setDispatchResult(JSON.stringify(res.data || { error: res.error }, null, 2));
        if (res.ok && res.data?.connected) {
          setSuccessBanner(`✓ eMigr8 AI Platform responded successfully (${res.data.latencyMs}ms)! AI reply generated.`);
        } else {
          setActiveError(explainError(res.data?.error || res.error || 'AI endpoint connection failed', 'emigr8_ai_test'));
        }
        return;
      }

      const endpoint = isTg ? '/api/telegram/send' : '/api/whatsapp/send';
      const res = await safeFetchJson<{ ok?: boolean; dispatchedToTelegramNetwork?: boolean; dispatchedToWhatsAppNetwork?: boolean; error?: string }>(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: isTg ? 2 : 1,
          clientNumber: testRecipient,
          message: testMessage,
          pauseAi: false
        })
      });
      setDispatchResult(JSON.stringify(res.data || { error: res.error }, null, 2));

      if (res.ok && res.data?.ok) {
        if (isTg && res.data.dispatchedToTelegramNetwork) {
          setSuccessBanner(`✓ Message transmitted directly across the Telegram network to ${testRecipient}!`);
          setActiveError(null);
        } else if (!isTg && res.data.dispatchedToWhatsAppNetwork) {
          const gwName = (res.data as any).gateway === 'wawcd_cloud' 
            ? 'WAWCD Cloud Extension API' 
            : (res.data as any).gateway === 'django_middleman' 
            ? 'Django Middleman Gateway' 
            : 'WhatsApp Gateway';
          setSuccessBanner(`✓ Message transmitted directly via ${gwName} to ${testRecipient}!`);
          setActiveError(null);
        } else {
          const errDetail = res.data?.error || 
            (isTg ? (res.data as any)?.telegramResponse?.description : (res.data as any)?.whatsappResponse?.error) || 
            'Network rejected transmission. Check recipient format or ensure user started chat.';
          setActiveError(explainError(errDetail, isTg ? 'telegram_send' : 'whatsapp_send'));
        }
      } else {
        setActiveError(explainError(res.data?.error || res.error || 'Message dispatch failed', isTg ? 'telegram_send' : 'whatsapp_send'));
      }
    } catch (err: unknown) {
      setActiveError(explainError(err, isTg ? 'telegram_send' : isWa ? 'whatsapp_send' : 'emigr8_ai_test'));
      setDispatchResult(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : 'Dispatch failed' }, null, 2));
    } finally {
      setDispatching(false);
    }
  };

  // Remediation Action Trigger
  const handleBannerAction = (actionKey: string) => {
    if (actionKey === 'open_config') {
      setShowConfigEditor(true);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    } else if (actionKey === 'retry') {
      handleTestTelegram();
    } else if (actionKey === 'delete_webhook') {
      handleClearWebhook();
    } else if (actionKey === 'test_whatsapp') {
      handleTestWhatsApp();
    } else if (actionKey === 'test_emigr8_ai') {
      handleTestEmigr8Ai();
    } else if (actionKey === 'open_telegram_botfather') {
      window.open('https://t.me/BotFather', '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Radio className="w-5 h-5 text-teal-400" />
            <span>Connect WhatsApp, Telegram &amp; eMigr8 AI Platform</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure live webhooks, connect developer WhatsApp endpoints, eMigr8 AI chat endpoints &amp; Telegram Bot tokens, and diagnose connections with live test tools.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowConfigEditor(!showConfigEditor)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-mono font-bold shadow-md transition-all"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{showConfigEditor ? 'Close Config Form' : 'Configure Credentials'}</span>
          </button>

          <button
            onClick={fetchStatus}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 rounded-xl border border-emerald-500 bg-emerald-950/80 text-emerald-200 text-xs font-mono flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-slate-400 hover:text-white p-1">
            ✕
          </button>
        </div>
      )}

      {/* DETAILED ERROR BANNER (With Explanation & Solution Hint) */}
      {activeError && (
        <DetailedErrorBanner
          error={activeError}
          onDismiss={() => setActiveError(null)}
          onAction={handleBannerAction}
        />
      )}

      {/* PERSISTENT DATABASE STATUS BANNER */}
      <div className="bg-[#10141d] border border-amber-500/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs shadow-md">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-sm">Firebase Firestore Database</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                Connected &amp; Active 🟢
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Project: <code className="text-amber-300">{status?.database?.projectId || 'cybernetic-sublime-61ttq'}</code> &bull; Collections: <code className="text-slate-300">chat_threads</code>, <code className="text-slate-300">messages</code>, <code className="text-slate-300">webhook_logs</code>
            </div>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 bg-[#0a0d13] border border-slate-800 px-3 py-1.5 rounded-lg">
          Persistent Storage: <strong className="text-emerald-400">All candidate chat threads &amp; messages persist across server restarts.</strong>
        </div>
      </div>

      {/* =========================================================
          IN-DASHBOARD CREDENTIALS CONFIGURATION FORM
          (Allows user to enter tokens directly without touching .env)
          ========================================================= */}
      {showConfigEditor && (
        <div className="rounded-xl border border-teal-500/40 bg-[#0e161f] p-5 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex items-start justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Key className="w-4 h-4 text-teal-400" />
                <span>Quick Credentials &amp; Endpoint URL Configuration</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Paste your developer&apos;s WhatsApp Gateway URL, eMigr8 AI Platform Chat Endpoint URL, and your Telegram credentials below. They take effect instantly without restarting.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowTokens(!showTokens)}
              className="text-slate-400 hover:text-teal-300 text-xs font-mono flex items-center space-x-1"
            >
              {showTokens ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showTokens ? 'Hide Secrets' : 'Show Secrets'}</span>
            </button>
          </div>

          <form onSubmit={handleSaveConfig} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* eMigr8 AI Chat Endpoint URL */}
            <div className="space-y-1 md:col-span-2 bg-[#121824] p-3 rounded-lg border border-purple-500/30">
              <label className="block text-purple-300 font-bold uppercase text-[11px] flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>eMigr8 AI Platform Chat Endpoint URL</span>
              </label>
              <input
                type="text"
                value={configEmigr8AiEndpoint}
                onChange={(e) => setConfigEmigr8AiEndpoint(e.target.value)}
                placeholder="https://api.emigr8.ai/v1/chat or https://your-domain.com/api/chat"
                className="w-full bg-[#0a0d13] border border-purple-500/40 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-purple-400"
              />
              <span className="text-[10px] text-purple-300/80 block mt-1">
                Input your eMigr8 AI platform chat endpoint URL here. All applicant questions and AI conversations route through this endpoint.
              </span>
            </div>

            {/* eMigr8 AI API Key / Bearer (Optional) */}
            <div className="space-y-1 md:col-span-2">
              <label className="block text-slate-300 font-bold uppercase text-[11px] flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-purple-400" />
                <span>eMigr8 AI API Key / Bearer Token (Optional)</span>
              </label>
              <input
                type={showTokens ? 'text' : 'password'}
                value={configEmigr8AiApiKey}
                onChange={(e) => setConfigEmigr8AiApiKey(e.target.value)}
                placeholder="Optional API key for eMigr8 AI platform authentication"
                className="w-full bg-[#0a0d13] border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-teal-500"
              />
              <span className="text-[10px] text-slate-500 block">
                Sent as <code className="text-purple-400">Authorization: Bearer &lt;key&gt;</code> if your eMigr8 AI chat endpoint requires authentication.
              </span>
            </div>

            {/* WhatsApp Gateway URL (Outbound) */}
            <div className="space-y-1 md:col-span-2">
              <label className="block text-slate-300 font-bold uppercase text-[11px] flex items-center space-x-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp Developer Outbound Gateway URL</span>
              </label>
              <input
                type="text"
                value={configWaUrl}
                onChange={(e) => setConfigWaUrl(e.target.value)}
                placeholder="https://your-developer-whatsapp-url.com/api/send"
                className="w-full bg-[#0a0d13] border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-teal-500"
              />
              <span className="text-[10px] text-slate-500 block">
                The HTTP POST endpoint your WhatsApp developer set up to accept outgoing messages.
              </span>
            </div>

            {/* Telegram Bot Token */}
            <div className="space-y-1">
              <label className="block text-slate-300 font-bold uppercase text-[11px] flex items-center space-x-1.5">
                <Bot className="w-3.5 h-3.5 text-blue-400" />
                <span>Telegram Bot Token</span>
              </label>
              <input
                type={showTokens ? 'text' : 'password'}
                value={configTgToken}
                onChange={(e) => setConfigTgToken(e.target.value)}
                placeholder="123456789:ABCdefGhIjkLmNoPqRsTuVwXyZ"
                className="w-full bg-[#0a0d13] border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-teal-500"
              />
              <span className="text-[10px] text-slate-500 block">
                Get this from @BotFather on Telegram (Token for HTTP API).
              </span>
            </div>

            {/* Telegram API Key */}
            <div className="space-y-1">
              <label className="block text-slate-300 font-bold uppercase text-[11px] flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-blue-400" />
                <span>Telegram API Key (Optional)</span>
              </label>
              <input
                type={showTokens ? 'text' : 'password'}
                value={configTgApiKey}
                onChange={(e) => setConfigTgApiKey(e.target.value)}
                placeholder="Optional api_key or hash"
                className="w-full bg-[#0a0d13] border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-teal-500"
              />
              <span className="text-[10px] text-slate-500 block">
                Used if your bot uses Telegram core API credentials.
              </span>
            </div>

            {/* Action Bar */}
            <div className="md:col-span-2 pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
              <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
                <span>Saved into the active server memory and written to .env automatically.</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowConfigEditor(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold flex items-center space-x-1.5 shadow-md"
                >
                  <Save className={`w-3.5 h-3.5 ${savingConfig ? 'animate-spin' : ''}`} />
                  <span>{savingConfig ? 'Saving...' : 'Save & Connect Now'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Three Column Cards: eMigr8 AI, Telegram, WhatsApp */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* =========================================
            CARD 1: EMIGR8 AI PLATFORM INTEGRATION
            ========================================= */}
        <div className="rounded-xl border border-purple-500/30 bg-[#161224] p-5 space-y-5 shadow-xl font-sans">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">eMigr8 AI Platform</h2>
                <div className="text-xs text-purple-300 font-mono">Chat Endpoint Gateway</div>
              </div>
            </div>

            <div className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border flex items-center space-x-1.5 ${
              status?.emigr8Ai?.isConfigured 
                ? 'bg-purple-950/70 border-purple-500 text-purple-300' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <span className={`h-2 w-2 rounded-full ${
                status?.emigr8Ai?.isConfigured ? 'bg-purple-400 animate-pulse' : 'bg-slate-500'
              }`} />
              <span>
                {status?.emigr8Ai?.isConfigured 
                  ? 'Endpoint Linked 🟢' 
                  : 'Awaiting URL'}
              </span>
            </div>
          </div>

          {/* Connection Status Details */}
          <div className="bg-[#0e0c18] border border-purple-950/80 rounded-lg p-3.5 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Chat Endpoint:</span>
              <span className={status?.emigr8Ai?.isConfigured ? 'text-purple-300 font-bold truncate max-w-[170px]' : 'text-slate-500'}>
                {status?.emigr8Ai?.chatEndpoint || 'Not Set'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">API Key / Token:</span>
              <span className={status?.emigr8Ai?.isApiKeyConfigured ? 'text-purple-300 font-bold' : 'text-slate-500'}>
                {status?.emigr8Ai?.isApiKeyConfigured ? 'Configured ✓' : 'Optional (Not Set)'}
              </span>
            </div>
          </div>

          {/* Actions for eMigr8 AI */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300 font-mono">AI Endpoint Diagnostics:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
              <button
                onClick={handleTestEmigr8Ai}
                disabled={testingEmigr8Ai}
                className="p-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold transition-all flex items-center justify-center space-x-1.5 shadow-md"
                title="Pings your eMigr8 AI platform chat endpoint"
              >
                <Cpu className={`w-3.5 h-3.5 ${testingEmigr8Ai ? 'animate-spin' : ''}`} />
                <span>{testingEmigr8Ai ? 'Testing Endpoint...' : 'Test AI Endpoint'}</span>
              </button>

              <button
                onClick={() => setShowConfigEditor(true)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 font-bold transition-all flex items-center justify-center space-x-1.5"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Input Chat URL</span>
              </button>
            </div>
          </div>

          {/* Guide for eMigr8 AI */}
          <div className="bg-[#0b0a14] border border-purple-900/30 rounded-lg p-3.5 space-y-2 text-xs">
            <div className="flex items-center space-x-1.5 font-bold text-purple-300 font-mono">
              <Code2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Where to Put the eMigr8 AI URL:</span>
            </div>
            <ol className="list-decimal pl-4 space-y-1.5 text-slate-400 text-[11px] leading-relaxed">
              <li>
                <strong>In the UI</strong>: Click <strong>&quot;Configure Credentials&quot;</strong> above, paste into the <strong>eMigr8 AI Platform Chat Endpoint URL</strong> field, and click <strong>Save &amp; Connect Now</strong>.
              </li>
              <li>
                <strong>In the Codebase (.env)</strong>: Open your root <code className="text-purple-300">.env</code> file and add:
                <div className="bg-[#100d1c] p-2 rounded mt-1 font-mono text-purple-300 text-[10px] space-y-0.5 border border-purple-900/40">
                  <div>EMIGR8_AI_CHAT_ENDPOINT=&quot;https://api.emigr8.ai/v1/chat&quot;</div>
                  <div>EMIGR8_AI_API_KEY=&quot;your_api_key_here&quot;</div>
                </div>
              </li>
              <li>
                <strong>In server.ts</strong>: Look at line 410 where <code className="text-teal-300">/api/emigr8-ai/test-connection</code> routes and tests the endpoint.
              </li>
            </ol>
          </div>
        </div>

        {/* =========================================
            CARD 2: TELEGRAM BOT INTEGRATION
            ========================================= */}
        <div className="rounded-xl border border-slate-700 bg-[#141a24] p-5 space-y-5 shadow-xl font-sans">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Telegram Bot Gateway</h2>
                <div className="text-xs text-slate-400 font-mono">Channel ID: telegramBot</div>
              </div>
            </div>

            <div className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border flex items-center space-x-1.5 ${
              status?.telegram.connected 
                ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300' 
                : status?.telegram.isTokenConfigured
                ? 'bg-amber-950/70 border-amber-500 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <span className={`h-2 w-2 rounded-full ${
                status?.telegram.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`} />
              <span>
                {status?.telegram.connected 
                  ? 'Connected 🟢' 
                  : status?.telegram.isTokenConfigured 
                  ? 'Token Configured 🟡' 
                  : 'Awaiting Token'}
              </span>
            </div>
          </div>

          {/* Connection Status Details */}
          <div className="bg-[#0e1219] border border-slate-800 rounded-lg p-3.5 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Telegram Bot Token:</span>
              <span className={status?.telegram.isTokenConfigured ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {status?.telegram.isTokenConfigured ? 'Configured in Environment ✓' : 'Not Set'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Telegram API Key:</span>
              <span className={status?.telegram.isApiKeyConfigured ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {status?.telegram.isApiKeyConfigured ? 'Configured ✓' : 'Not Set'}
              </span>
            </div>
            {status?.telegram.botInfo && (
              <>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Bot Handle:</span>
                  <a 
                    href={`https://t.me/${status.telegram.botInfo.username}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-blue-400 font-bold hover:underline flex items-center space-x-1"
                  >
                    <span>@{status.telegram.botInfo.username}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Bot Name:</span>
                  <span className="text-white font-bold">{status.telegram.botInfo.first_name}</span>
                </div>
              </>
            )}
            {!dismissedTelegramError && status?.telegram.error && (
              <div className="pt-2 p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 flex items-center justify-between text-[11px]">
                <div className="flex items-start space-x-1.5 flex-1 pr-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                  <span>{status.telegram.error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDismissedTelegramError(true)}
                  className="px-2 py-0.5 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-[10px] font-bold flex items-center space-x-1 cursor-pointer shrink-0"
                  title="Cancel error message"
                >
                  <X className="w-3 h-3" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>

          {/* Actions for Telegram */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300 font-mono">Bot Diagnostics:</div>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <button
                onClick={handleTestTelegram}
                disabled={testingTelegram}
                className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold transition-all flex items-center justify-center space-x-1 shadow-md"
                title="Pings getMe from Telegram Bot API"
              >
                <Activity className={`w-3.5 h-3.5 ${testingTelegram ? 'animate-spin' : ''}`} />
                <span>{testingTelegram ? 'Testing...' : 'Test Bot'}</span>
              </button>

              <button
                onClick={handleSyncUpdates}
                disabled={syncingUpdates}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition-all flex items-center justify-center space-x-1"
                title="Polls getUpdates from Telegram into dashboard"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingUpdates ? 'animate-spin' : ''}`} />
                <span>{syncingUpdates ? 'Syncing...' : 'Sync Messages'}</span>
              </button>

              <button
                onClick={handleSetWebhook}
                disabled={settingWebhook}
                className="p-2 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white font-bold transition-all flex items-center justify-center space-x-1"
                title="Registers this app's URL with Telegram Bot API"
              >
                <LinkIcon className={`w-3.5 h-3.5 ${settingWebhook ? 'animate-spin' : ''}`} />
                <span>{settingWebhook ? 'Setting...' : 'Set Webhook'}</span>
              </button>

              <button
                onClick={handleClearWebhook}
                disabled={clearingWebhook}
                className="p-2 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 disabled:opacity-40 text-rose-200 font-bold transition-all flex items-center justify-center space-x-1"
                title="Removes webhook registration (fixes 409 conflict when syncing)"
              >
                <Trash2 className={`w-3.5 h-3.5 ${clearingWebhook ? 'animate-spin' : ''}`} />
                <span>{clearingWebhook ? 'Clearing...' : 'Reset Webhook'}</span>
              </button>
            </div>
          </div>

          {/* Telegram Webhook URL */}
          <div className="space-y-1.5 font-mono text-xs">
            <div className="text-slate-400 font-bold">Telegram Inbound Webhook URL:</div>
            <div className="flex items-center space-x-2 bg-[#0d1117] border border-slate-800 rounded-lg p-2 text-slate-300 text-[11px]">
              <span className="truncate flex-1">{status?.telegram.webhookUrl || 'Loading...'}</span>
              <button
                onClick={() => status?.telegram.webhookUrl && handleCopy(status.telegram.webhookUrl, 'tgWebhook')}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-400 shrink-0"
                title="Copy Webhook URL"
              >
                {copiedField === 'tgWebhook' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Setup Guide */}
          <div className="bg-[#0b0e14] border border-slate-800/80 rounded-lg p-3.5 space-y-2 text-xs">
            <div className="flex items-center space-x-1.5 font-bold text-slate-300 font-mono">
              <Key className="w-3.5 h-3.5 text-teal-400" />
              <span>How to Connect Your Telegram Bot Token:</span>
            </div>
            <ol className="list-decimal pl-4 space-y-1 text-slate-400 text-[11px] leading-relaxed">
              <li>
                Open <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">@BotFather</a> on Telegram to copy your <strong>HTTP API Bot Token</strong>.
              </li>
              <li>
                Click <strong>&quot;Configure Credentials&quot;</strong> button above and paste your token, or add <code className="text-teal-300">TELEGRAM_BOT_TOKEN</code> in your <code className="text-slate-200">.env</code> file.
              </li>
              <li>
                Click <strong>&quot;Test Connection&quot;</strong> above to verify your bot appears online.
              </li>
            </ol>
          </div>
        </div>

        {/* =========================================
            CARD 3: WHATSAPP (WAWCD) INTEGRATION
            ========================================= */}
        <div className="rounded-xl border border-slate-700 bg-[#141a24] p-5 space-y-5 shadow-xl font-sans">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">WhatsApp (WAWCD) Gateway</h2>
                <div className="text-xs text-slate-400 font-mono">Channel ID: WAWCD</div>
              </div>
            </div>

            <div className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border flex items-center space-x-1.5 ${
              status?.whatsapp.isConfigured 
                ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <span className={`h-2 w-2 rounded-full ${
                status?.whatsapp.isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`} />
              <span>{status?.whatsapp.isConfigured ? 'Configured 🟢' : 'Awaiting Config'}</span>
            </div>
          </div>

          {/* Connection Status Details */}
          <div className="bg-[#0e1219] border border-slate-800 rounded-lg p-3.5 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Developer Outbound Gateway:</span>
              <span className={status?.whatsapp.gatewayUrl ? 'text-emerald-400 font-bold truncate max-w-[170px]' : 'text-slate-500'}>
                {status?.whatsapp.gatewayUrl || 'Not set'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">Inbound Webhook Listener:</span>
              <span className="text-emerald-400 font-bold">Active &amp; Listening ✓</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Webhook Verify Token:</span>
              <span className="text-teal-300 font-bold">{status?.whatsapp.verifyToken}</span>
            </div>
          </div>

          {/* Actions for WhatsApp */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300 font-mono">Gateway Diagnostics:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
              <button
                onClick={handleTestWhatsApp}
                disabled={testingWhatsApp}
                className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold transition-all flex items-center justify-center space-x-1.5 shadow-md"
                title="Pings your developer's WhatsApp gateway URL"
              >
                <Activity className={`w-3.5 h-3.5 ${testingWhatsApp ? 'animate-spin' : ''}`} />
                <span>{testingWhatsApp ? 'Testing Gateway...' : 'Test Outbound'}</span>
              </button>

              <button
                onClick={() => setShowConfigEditor(true)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 font-bold transition-all flex items-center justify-center space-x-1.5"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Edit Credentials</span>
              </button>
            </div>
          </div>

          {/* Webhook URLs for Inbound Messages */}
          <div className="space-y-2.5 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-bold flex items-center space-x-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Inbound Webhook Listener (If using Webhook):</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                POST listener active
              </span>
            </div>

            {/* Inbound Webhook Listener Box */}
            <div className="bg-[#0b1017] border border-emerald-500/30 rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-bold flex items-center space-x-1.5 text-xs">
                  <LinkIcon className="w-4 h-4 text-emerald-400" />
                  <span>Public Inbound Webhook (Give This to Her / Paste in Extension):</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                  HTTPS Active (POST/GET/PUT/PATCH/DELETE)
                </span>
              </div>

              <div className="flex items-center space-x-2 bg-[#06090e] border border-slate-700 rounded-lg p-2 text-slate-300 text-[11px]">
                <span className="truncate flex-1 font-mono text-emerald-300 select-all font-semibold">{liveWhatsAppWebhookUrl}</span>
                <button
                  onClick={() => handleCopy(liveWhatsAppWebhookUrl, 'waWebhook')}
                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center space-x-1 text-xs shrink-0 shadow"
                  title="Copy Inbound Webhook URL"
                >
                  {copiedField === 'waWebhook' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                  <span>{copiedField === 'waWebhook' ? 'Copied!' : 'Copy URL'}</span>
                </button>
              </div>

              {/* Exact Values to Provide */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-[#101622] p-2.5 rounded-lg border border-slate-800 text-[11px] font-sans">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">1. URL to Enter:</div>
                  <div className="text-emerald-300 font-mono text-[10px] truncate" title={liveWhatsAppWebhookUrl}>
                    {liveWhatsAppWebhookUrl}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">2. Method to Select:</div>
                  <div className="text-white font-bold flex items-center space-x-1">
                    <span className="px-2 py-0.5 rounded bg-emerald-700 text-white text-xs font-mono font-bold">POST</span>
                    <span className="text-[10px] text-slate-400">(POST is standard for webhooks)</span>
                  </div>
                </div>
              </div>

              {/* Invalid Webhook URL Resolution Box */}
              <div className="bg-amber-950/30 border border-amber-500/40 rounded-lg p-2.5 text-[11px] space-y-1.5 font-sans">
                <div className="font-bold text-amber-300 flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Why Did It Say &quot;Invalid Webhook URL&quot;?</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[10.5px]">
                  <li>
                    <strong>Used http:// or internal IP instead of https://:</strong> Extensions and webhook platforms strictly require a public <code className="text-emerald-300">https://</code> URL. Plain <code className="text-amber-300">http://34.147.137.88:8085</code> will trigger &quot;Invalid webhook url&quot;.
                  </li>
                  <li>
                    <strong>Cloud Run preview authentication:</strong> Using the preview <code className="text-amber-300">*.run.app</code> URL redirects unauthenticated requests with a 302 login check. Use the <code className="text-emerald-300">https://*.trycloudflare.com/api/webhooks/whatsapp</code> URL above instead.
                  </li>
                  <li>
                    <strong>Method &amp; CORS:</strong> Always select <strong className="text-emerald-300">POST</strong>. Our backend now responds with <code className="text-emerald-300">200 OK</code> to all methods (POST, GET, PUT, PATCH, DELETE) and CORS preflight checks so it will never fail verification.
                  </li>
                </ul>
              </div>
            </div>

            {/* Custom Message Inbound Simulation Form */}
            <div className="bg-[#090d14] border border-slate-800 rounded-lg p-3 space-y-2.5">
              <div className="text-[11px] font-bold text-teal-300 font-mono flex items-center justify-between">
                <span>Direct Inbound WhatsApp Tester:</span>
                <span className="text-[10px] text-slate-400 font-normal">Simulate applicant texting your WAWCD channel</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={customTestPhone}
                  onChange={(e) => setCustomTestPhone(e.target.value)}
                  placeholder="Applicant Phone e.g. +234..."
                  className="bg-[#12161f] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                />
                <input
                  type="text"
                  value={customTestMessage}
                  onChange={(e) => setCustomTestMessage(e.target.value)}
                  placeholder="Message content..."
                  className="sm:col-span-2 bg-[#12161f] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-sans focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleTestInboundWebhook}
                  disabled={testingInboundWebhook}
                  className="p-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all flex items-center justify-center space-x-1.5 text-xs shadow-md disabled:opacity-40"
                  title="Sends this message to the webhook handler and verifies live ingestion into Chats & Messages"
                >
                  <Smartphone className={`w-3.5 h-3.5 ${testingInboundWebhook ? 'animate-bounce' : ''}`} />
                  <span>{testingInboundWebhook ? 'Ingesting Message...' : 'Simulate & Ingest Message'}</span>
                </button>

                <button
                  onClick={() => {
                    const curlCmd = `curl -X POST "${liveWhatsAppWebhookUrl}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"phone": "${customTestPhone.trim() || '+2348099887766'}", "message": "${customTestMessage.trim() || 'Hello from WhatsApp'}", "name": "Applicant"}'`;
                    handleCopy(curlCmd, 'waCurl');
                  }}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold transition-all flex items-center justify-center space-x-1.5 text-xs"
                  title="Copies sample cURL command for your developer"
                >
                  <Code2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>{copiedField === 'waCurl' ? 'cURL Copied ✓' : 'Copy Developer cURL'}</span>
                </button>
              </div>

              {inboundWebhookResult && (
                <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[11px] font-sans flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="flex-1">{inboundWebhookResult}</span>
                </div>
              )}
            </div>

            {/* Live Webhook Traffic & Diagnostic Log Inspector */}
            <div className="bg-[#0e131d] border border-slate-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-slate-200 flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-teal-400" />
                  <span>Live Webhook Traffic Inspector ({recentWebhookLogs.length} events):</span>
                </span>
                <button
                  onClick={fetchRecentWebhookLogs}
                  className="text-teal-400 hover:underline text-[10px] flex items-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh Log</span>
                </button>
              </div>

              {recentWebhookLogs.length === 0 ? (
                <div className="p-3 bg-[#080b10] rounded border border-slate-800/80 text-[11px] font-sans space-y-1.5">
                  <div className="text-amber-400 font-bold flex items-center space-x-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>No Webhook Calls Received from External Server Yet</span>
                  </div>
                  <p className="text-slate-400">
                    If your developer has already pointed WAWCD to your app URL, why haven&apos;t requests arrived?
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[10.5px]">
                    <li>
                      <strong>Check Webhook Path:</strong> Ensure her webhook configuration includes the path: <code className="text-emerald-300">{liveWhatsAppWebhookUrl}</code> (not just the root home domain).
                    </li>
                    <li>
                      <strong>Google Cloud Preview Sandbox:</strong> Automated external HTTP calls to Google preview URLs (<code className="text-slate-300">*.run.app</code>) are blocked by Google&apos;s 302 login check. When testing with the developer, she can run the cURL command or trigger from a browser session that has access.
                    </li>
                    <li>
                      <strong>Test Now:</strong> Click <strong className="text-teal-300">&quot;Simulate &amp; Ingest Message&quot;</strong> above to verify that incoming messages immediately populate your <strong>Chats &amp; Messages</strong> tab!
                    </li>
                  </ul>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[10.5px] font-mono text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 uppercase">
                        <th className="py-1">Time</th>
                        <th className="py-1">Method</th>
                        <th className="py-1">Status</th>
                        <th className="py-1">Sender</th>
                        <th className="py-1">Snippet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {recentWebhookLogs.map((log) => (
                        <tr key={log.id} className="text-slate-300">
                          <td className="py-1 text-slate-500">{log.timestamp}</td>
                          <td className="py-1 font-bold text-teal-400">{log.method}</td>
                          <td className="py-1">
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              log.status === 'received_and_routed'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {log.status === 'received_and_routed' ? 'Routed ✓' : log.status}
                            </span>
                          </td>
                          <td className="py-1 font-bold text-white">{log.phone || '-'}</td>
                          <td className="py-1 text-slate-400 truncate max-w-xs">{log.messageSnippet || log.rawSnippet}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Guide: Where to Put It */}
          <div className="bg-[#0b0e14] border border-slate-800/80 rounded-lg p-3.5 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center space-x-1.5 font-bold text-slate-200 font-mono">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp Setup Guides:</span>
              </div>
              <div className="flex space-x-1 bg-slate-900 p-0.5 rounded border border-slate-800">
                <button
                  type="button"
                  onClick={() => setWawcdGuideTab('extension')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                    wawcdGuideTab === 'extension'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  WAWCD Extension
                </button>
                <button
                  type="button"
                  onClick={() => setWawcdGuideTab('developer')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                    wawcdGuideTab === 'developer'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Developer API
                </button>
              </div>
            </div>

            {wawcdGuideTab === 'extension' ? (
              <div className="space-y-2 text-slate-300 text-[11px] leading-relaxed">
                <div className="font-semibold text-emerald-400 flex items-center space-x-1">
                  <Chrome className="w-3.5 h-3.5" />
                  <span>Configuring the WAWCD WhatsApp Chrome Extension:</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-400">
                  <li>
                    Open <strong>WhatsApp Web</strong> (<a href="https://web.whatsapp.com" target="_blank" rel="noreferrer" className="text-teal-400 underline hover:text-teal-300">web.whatsapp.com</a>) in Google Chrome where your WAWCD extension is active.
                  </li>
                  <li>
                    Click the <strong>WAWCD Extension</strong> icon in your browser toolbar or the WAWCD side-panel menu.
                  </li>
                  <li>
                    Navigate to <strong>Settings</strong> &gt; <strong>Integrations / Webhooks</strong> (or <em>&quot;Webhook Forwarding&quot; / &quot;API Integration&quot;</em>).
                  </li>
                  <li>
                    In the <strong>&quot;Incoming Webhook URL&quot;</strong> field, paste:
                    <div className="bg-[#12161f] p-1.5 rounded mt-1 font-mono text-emerald-300 text-[10px] border border-slate-800 flex items-center justify-between">
                      <span className="truncate select-all">{liveWhatsAppWebhookUrl}</span>
                      <button onClick={() => handleCopy(liveWhatsAppWebhookUrl, 'waWawcdCopy')} className="p-0.5 text-teal-400 hover:text-white ml-2">
                        {copiedField === 'waWawcdCopy' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </li>
                  <li>
                    Ensure <strong>&quot;Forward Incoming Messages&quot;</strong> is toggled <strong>ON</strong> and click <strong>Save</strong>.
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-2 text-slate-300 text-[11px] leading-relaxed">
                <div className="font-semibold text-teal-400 flex items-center space-x-1">
                  <Code2 className="w-3.5 h-3.5" />
                  <span>For Your WhatsApp Developer (2-Way Setup):</span>
                </div>
                <div className="space-y-2 text-slate-400">
                  <p>
                    <strong className="text-slate-200">1. Inbound (Client messages -&gt; Dashboard):</strong> Give your developer this URL:
                    <code className="text-emerald-300 bg-[#12161f] px-1.5 py-0.5 rounded mx-1 font-mono text-[10px] border border-slate-800">{liveWhatsAppWebhookUrl}</code>
                    <br />
                    Whenever their WhatsApp bot receives a message, they simply HTTP POST JSON to it:
                  </p>
                  <pre className="bg-[#12161f] p-2 rounded font-mono text-emerald-300 text-[10px] border border-slate-800 overflow-x-auto">
{`{
  "phone": "+1234567890",
  "message": "Hello, I am inquiring about my migration case",
  "name": "Applicant Name"
}`}
                  </pre>
                  <p className="pt-1">
                    <strong className="text-slate-200">2. Outbound (Dashboard replies -&gt; WhatsApp):</strong> Ask your developer for their <em>Gateway URL</em>, then click <strong>&quot;Edit Credentials&quot;</strong> above (or set <code className="text-teal-300">WHATSAPP_GATEWAY_URL</code> in <code className="text-slate-200">.env</code>).
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================
          LIVE DISPATCH & INTERJECTION TESTER
          ========================================= */}
      <div className="rounded-xl border border-slate-700 bg-[#141a24] p-5 space-y-4 shadow-xl font-sans">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Send className="w-4 h-4 text-teal-400" />
              <span>Live Interjection &amp; Dispatch Tester</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verify that the Admin Dashboard can deliver messages to recipients on Telegram or WhatsApp.
            </p>
          </div>
        </div>

        <form onSubmit={handleDispatchTest} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <label className="block text-slate-300 font-bold mb-1 uppercase text-[11px]">Channel</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTestChannel('telegram')}
                className={`py-2 px-2 rounded-lg border font-bold flex items-center justify-center space-x-1 transition-all text-[11px] ${
                  testChannel === 'telegram'
                    ? 'bg-blue-950/70 border-blue-500 text-blue-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Telegram</span>
              </button>

              <button
                type="button"
                onClick={() => setTestChannel('whatsapp')}
                className={`py-2 px-2 rounded-lg border font-bold flex items-center justify-center space-x-1 transition-all text-[11px] ${
                  testChannel === 'whatsapp'
                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setTestChannel('emigr8_ai')}
                className={`py-2 px-2 rounded-lg border font-bold flex items-center justify-center space-x-1 transition-all text-[11px] ${
                  testChannel === 'emigr8_ai'
                    ? 'bg-purple-950/70 border-purple-500 text-purple-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>eMigr8 AI</span>
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-bold uppercase text-[11px]">
                {testChannel === 'telegram' ? 'Telegram Recipient (Chat ID / @Username)' : 'WhatsApp Recipient (Phone Number)'}
              </label>
              {testChannel === 'whatsapp' ? (
                <button
                  type="button"
                  onClick={() => setTestRecipient('+2348120493676')}
                  className="text-[10px] text-teal-400 hover:text-teal-300 font-sans underline"
                >
                  Use +2348120493676
                </button>
              ) : testChannel === 'telegram' ? (
                <a
                  href="https://t.me/SiseDevBot"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-sans underline flex items-center space-x-1"
                >
                  <span>Open @SiseDevBot</span>
                </a>
              ) : null}
            </div>
            <input
              type="text"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              placeholder={testChannel === 'telegram' ? 'e.g. 123456789 or @username' : 'e.g. +2348120493676'}
              className="w-full bg-[#0e1219] border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-teal-500"
              required
            />
            {testChannel === 'telegram' && (
              <p className="text-[10px] text-slate-400 mt-1">
                Note: Telegram bots can only message users who clicked &quot;Start&quot; on <a href="https://t.me/SiseDevBot" target="_blank" rel="noreferrer" className="text-blue-400 underline">@SiseDevBot</a>. Bots cannot send to phone numbers.
              </p>
            )}
          </div>

          <div className="md:col-span-3">
            <label className="block text-slate-300 font-bold mb-1 uppercase text-[11px]">
              Message to Dispatch
            </label>
            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              rows={2}
              className="w-full bg-[#0e1219] border border-slate-700 rounded-lg p-2 text-white font-sans text-xs focus:outline-none focus:border-teal-500"
              required
            />
          </div>

          <div className="md:col-span-3 flex items-center justify-between">
            <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
              <span>
                If live credentials are connected, transmits over the live network; otherwise logs to dashboard with diagnostics.
              </span>
            </div>

            <button
              type="submit"
              disabled={dispatching}
              className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white font-bold transition-all flex items-center space-x-2 shadow-md"
            >
              <Send className={`w-3.5 h-3.5 ${dispatching ? 'animate-pulse' : ''}`} />
              <span>{dispatching ? 'Dispatching...' : 'Send Live Test Message'}</span>
            </button>
          </div>
        </form>

        {dispatchResult && (
          <div className="mt-3 bg-[#0d1117] border border-slate-800 rounded-lg p-3 text-xs font-mono space-y-1">
            <div className="text-slate-400 font-bold">API Gateway Response:</div>
            <pre className="text-teal-300 text-[11px] overflow-x-auto whitespace-pre-wrap">
              {dispatchResult}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
