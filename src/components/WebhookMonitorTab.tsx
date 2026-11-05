import React, { useState } from 'react';
import { WebhookEvent } from '../types/middleware';
import { Radio, RefreshCw, Send, CheckCircle2, Clock, ShieldCheck, ChevronDown, ChevronRight, Play } from 'lucide-react';

const INITIAL_EVENTS: WebhookEvent[] = [
  {
    id: 'evt-101',
    event: 'candidate.profile.evaluated',
    timestamp: '2026-09-28T07:30:15.120Z',
    targetUrl: 'https://api.hubspot.com/v3/objects/contacts/sync',
    system: 'HubSpot CRM',
    status: 'delivered',
    httpStatus: 200,
    latencyMs: 142,
    payload: {
      candidateId: 'cand-0912-ade',
      candidateName: 'Dr. Adebayo Ogunlesi',
      email: 'adebayo.o@neuralfintech.io',
      topRoute: 'UK Global Talent (Tech Nation)',
      track: 'Exceptional Talent',
      readinessScore: 94,
      dealStage: 'Qualified_Tier_1'
    },
    signature: 'sha256=9b71a2e38c94627192fde00a88192a543b123901a8df98129034ef812'
  },
  {
    id: 'evt-102',
    event: 'applicant.notification.triggered',
    timestamp: '2026-09-28T07:30:15.340Z',
    targetUrl: 'https://graph.facebook.com/v19.0/emigr8_bot/messages',
    system: 'WhatsApp Bot',
    status: 'delivered',
    httpStatus: 201,
    latencyMs: 188,
    payload: {
      recipient: '+2348039912048',
      template: 'dr_zenith_diagnosis_ready',
      params: {
        candidateName: 'Adebayo',
        route: 'UK Global Talent',
        score: '94%'
      }
    },
    signature: 'sha256=11d4e8329bc019283fa7109283a0018892cb14f109230912a7812bc89'
  },
  {
    id: 'evt-103',
    event: 'coach.lead.allocated',
    timestamp: '2026-09-28T07:30:15.520Z',
    targetUrl: 'https://hooks.slack.com/services/T0123/B0456/emigr8_coaches',
    system: 'Slack Coach Channel',
    status: 'delivered',
    httpStatus: 200,
    latencyMs: 98,
    payload: {
      channel: '#visa-coaches-uk',
      priority: 'URGENT_TIER_1',
      text: '🎯 Ingestion Alert: Dr. Adebayo Ogunlesi scored 94% on UK Global Talent. Assigned to Senior Coach David.'
    },
    signature: 'sha256=77a83c21a990bbd4412093847291a9218cbf09823192039841289381'
  }
];

export const WebhookMonitorTab: React.FC = () => {
  const [events, setEvents] = useState<WebhookEvent[]>(INITIAL_EVENTS);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(INITIAL_EVENTS[0].id);
  const [filterSystem, setFilterSystem] = useState<string>('All');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const handleSimulateDispatch = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const newEvt: WebhookEvent = {
        id: `evt-${Date.now()}`,
        event: 'evidence.packet.verified',
        timestamp: new Date().toISOString(),
        targetUrl: 'https://api.hubspot.com/v3/objects/contacts/sync',
        system: 'HubSpot CRM',
        status: 'delivered',
        httpStatus: 200,
        latencyMs: Math.floor(Math.random() * 80) + 110,
        payload: {
          candidateId: 'cand-4411-chi',
          candidateName: 'Chinweike Eze',
          status: 'DOSSIER_COMPLIANT',
          evidenceCount: 10,
          recommendationLetters: 3,
          actionRequired: 'Book Final Pre-Submission Coaching Session'
        },
        signature: `sha256=${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`
      };
      setEvents([newEvt, ...events]);
      setExpandedEventId(newEvt.id);
      setIsSimulating(false);
    }, 400);
  };

  const filteredEvents = filterSystem === 'All'
    ? events
    : events.filter(e => e.system === filterSystem);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              <Radio className="w-3.5 h-3.5" />
              <span>Event Bus & Outbound Integrations</span>
            </div>
            <h2 className="text-xl font-bold text-white">Webhook Delivery & Telemetry Monitor</h2>
            <p className="text-xs text-slate-400 mt-1">
              Real-time monitoring of outbound webhooks, HMAC signature headers, and downstream delivery statuses.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={filterSystem}
              onChange={(e) => setFilterSystem(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            >
              <option value="All">All Systems</option>
              <option value="HubSpot CRM">HubSpot CRM</option>
              <option value="WhatsApp Bot">WhatsApp Bot</option>
              <option value="Slack Coach Channel">Slack Coach Channel</option>
            </select>

            <button
              onClick={handleSimulateDispatch}
              disabled={isSimulating}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all"
            >
              {isSimulating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>Simulate Webhook Dispatch</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-800">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Total Dispatched</div>
            <div className="text-lg font-bold text-white mt-0.5">{events.length} Events</div>
            <div className="text-[10px] text-emerald-400">100% Delivery Success</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Average Latency</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">142ms</div>
            <div className="text-[10px] text-slate-400">p95 &lt; 210ms</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Security Standard</div>
            <div className="text-lg font-bold text-white mt-0.5">HMAC-SHA256</div>
            <div className="text-[10px] text-slate-400">Signature verification enforced</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Retry Policy</div>
            <div className="text-lg font-bold text-white mt-0.5">Exponential Backoff</div>
            <div className="text-[10px] text-slate-400">3 retries on HTTP 5xx</div>
          </div>
        </div>
      </div>

      {/* Events Table / Feed */}
      <div className="space-y-3">
        {filteredEvents.map((evt) => {
          const isExpanded = expandedEventId === evt.id;
          return (
            <div
              key={evt.id}
              className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden transition-all"
            >
              <div
                onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/40"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white font-mono">{evt.event}</span>
                      <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        {evt.system}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5 truncate max-w-md">
                      {evt.targetUrl}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 self-end sm:self-center">
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    HTTP {evt.httpStatus}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {evt.latencyMs}ms
                  </span>
                  <span className="text-xs text-slate-500 font-mono hidden md:inline">
                    {evt.timestamp.split('T')[1].substring(0, 8)}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expanded JSON Inspector */}
              {isExpanded && (
                <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-400">
                      HMAC Signature: <code className="text-emerald-400">{evt.signature}</code>
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">ISO: {evt.timestamp}</span>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Dispatched Event Payload</div>
                    <pre className="p-3 rounded-lg bg-slate-900 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed border border-slate-800">
                      {JSON.stringify(evt.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
