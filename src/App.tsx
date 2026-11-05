/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { DjangoAdminConsole } from './components/DjangoAdminConsole';
import { ChannelIntegrationsTab } from './components/ChannelIntegrationsTab';
import { safeFetchJson } from './utils/safeFetch';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('admin_dashboard');
  const [telegramConnected, setTelegramConnected] = useState<boolean>(false);
  const [whatsappConnected, setWhatsappConnected] = useState<boolean>(false);
  const [emigr8AiConnected, setEmigr8AiConnected] = useState<boolean>(false);
  const [databaseConnected, setDatabaseConnected] = useState<boolean>(false);

  useEffect(() => {
    // Check channel gateway & database connectivity on mount
    safeFetchJson<{
      telegram?: { connected?: boolean };
      whatsapp?: { isConfigured?: boolean };
      emigr8Ai?: { isConfigured?: boolean };
      database?: { isConfigured?: boolean; connected?: boolean };
    }>('/api/status')
      .then(res => {
        if (res.ok && res.data) {
          if (res.data.telegram?.connected) {
            setTelegramConnected(true);
          }
          if (res.data.whatsapp?.isConfigured) {
            setWhatsappConnected(true);
          }
          if (res.data.emigr8Ai?.isConfigured) {
            setEmigr8AiConnected(true);
          }
          if (res.data.database?.connected || res.data.database?.isConfigured) {
            setDatabaseConnected(true);
          }
        }
      })
      .catch(() => {
        // Fallback silently if offline or initial load
      });
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        telegramConnected={telegramConnected}
        whatsappConnected={whatsappConnected}
        emigr8AiConnected={emigr8AiConnected}
        databaseConnected={databaseConnected}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'admin_dashboard' && (
          <DjangoAdminConsole onOpenIntegrations={() => setActiveTab('channel_integrations')} />
        )}
        {activeTab === 'channel_integrations' && <ChannelIntegrationsTab />}
      </main>

      {/* Simplified Admin Dashboard Footer */}
      <footer className="border-t border-slate-900 bg-[#0a0d13] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-mono">
          <div>eMigr8 Middleware Platform &bull; Multi-Channel Gateway (WhatsApp &amp; Telegram)</div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setActiveTab('channel_integrations')}
              className="text-teal-400 hover:underline"
            >
              Configure WhatsApp &amp; Telegram
            </button>
            <span className="text-slate-700">&bull;</span>
            <button 
              onClick={() => setActiveTab('admin_dashboard')}
              className="text-teal-400 hover:underline"
            >
              Chats &amp; Messages
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
