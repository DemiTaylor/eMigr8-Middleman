import React from 'react';
import { 
  Layers, 
  MessageSquare, 
  Radio,
  Database
} from 'lucide-react';

export type ActiveTab = 
  | 'admin_dashboard' 
  | 'channel_integrations';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  telegramConnected?: boolean;
  whatsappConnected?: boolean;
  emigr8AiConnected?: boolean;
  databaseConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab,
  telegramConnected = false,
  whatsappConnected = false,
  emigr8AiConnected = false,
  databaseConnected = false
}) => {
  const tabs = [
    { id: 'admin_dashboard' as ActiveTab, label: 'Chats & Messages', icon: MessageSquare },
    { id: 'channel_integrations' as ActiveTab, label: 'WhatsApp & Telegram Channels', icon: Radio },
  ];

  return (
    <header className="border-b border-slate-800 bg-[#0f141c] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0">
              <Layers className="h-4 w-4 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm sm:text-base text-white tracking-tight">eMigr8 Engine</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 font-mono border border-teal-500/20 hidden sm:inline-block">
                  Middleware &amp; Gateways
                </span>
              </div>
            </div>
          </div>

          {/* Channel Live Status Badges */}
          <div className="hidden lg:flex items-center space-x-3 text-[11px] font-mono">
            {/* Telegram Status */}
            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border ${
              telegramConnected 
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              <span className={`h-2 w-2 rounded-full ${telegramConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>Telegram: {telegramConnected ? 'Connected' : 'Ready'}</span>
            </div>

            {/* WhatsApp Status */}
            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border ${
              whatsappConnected 
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              <span className={`h-2 w-2 rounded-full ${whatsappConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>WhatsApp: {whatsappConnected ? 'Connected' : 'Ready'}</span>
            </div>

            {/* eMigr8 AI Status */}
            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border ${
              emigr8AiConnected 
                ? 'bg-purple-950/60 border-purple-500/40 text-purple-300' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              <span className={`h-2 w-2 rounded-full ${emigr8AiConnected ? 'bg-purple-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>eMigr8 AI: {emigr8AiConnected ? 'Linked' : 'Awaiting URL'}</span>
            </div>

            {/* Firestore Database Status */}
            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border ${
              databaseConnected 
                ? 'bg-amber-950/60 border-amber-500/40 text-amber-300' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              <Database className="w-3 h-3 text-amber-400" />
              <span>DB: {databaseConnected ? 'Firestore 🟢' : 'Connecting'}</span>
            </div>
          </div>

          {/* Quick Navigation Tabs */}
          <div className="flex items-center space-x-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                      : 'bg-slate-800/80 text-slate-300 border border-slate-700/80 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
