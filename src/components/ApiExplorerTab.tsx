import React, { useState } from 'react';
import { Terminal, Send, Copy, Check, Play, Globe, Shield, Code, ArrowDownRight } from 'lucide-react';
import { SAMPLE_CANDIDATE_PROFILES } from '../data/mockProfiles';
import { Emigr8MiddlewareEngine } from '../services/middlewareEngine';
import { VISA_ROUTES, TECH_NATION_CRITERIA_SPECS } from '../data/visaCriteria';

interface EndpointSpec {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  name: string;
  description: string;
  defaultPayload?: Record<string, unknown>;
}

const ENDPOINTS: EndpointSpec[] = [
  {
    id: 'ingest_profile',
    method: 'POST',
    path: '/api/v1/ingest/candidate-profile',
    name: 'Ingest Candidate Profile',
    description: 'Universal intake endpoint for web, mobile, and WhatsApp leads. Normalizes tech credentials and calculates seniority percentiles.',
    defaultPayload: SAMPLE_CANDIDATE_PROFILES[0] as unknown as Record<string, unknown>
  },
  {
    id: 'evaluate_matrix',
    method: 'POST',
    path: '/api/v1/evaluate/dr-zenith-matrix',
    name: 'Dr. Zenith Route Evaluation',
    description: 'Cross-evaluates candidate profile against UK Tech Nation, US O-1A/EB-1A, Canada SUV, and Germany Chancenkarte.',
    defaultPayload: {
      candidateProfile: SAMPLE_CANDIDATE_PROFILES[0],
      jurisdictions: ['GB', 'US', 'CA', 'DE'],
      confidenceThreshold: 0.75
    }
  },
  {
    id: 'verify_evidence',
    method: 'POST',
    path: '/api/v1/evidence/verify-packet',
    name: 'Verify Evidence Packet Integrity',
    description: 'Audits evidence dossier against procedural rules (10-piece ceiling, 3 referee letters, corporate letterheads).',
    defaultPayload: {
      candidateId: 'cand-0912-ade',
      routeId: 'uk_global_talent',
      evidenceItemsCount: 10,
      lettersOfRecommendationReady: 3,
      pageCountTotal: 42
    }
  },
  {
    id: 'dispatch_webhooks',
    method: 'POST',
    path: '/api/v1/webhooks/dispatch',
    name: 'Dispatch Downstream Event',
    description: 'Emits signed event to external CRM (HubSpot), applicant notifications (WhatsApp), or coach queues.',
    defaultPayload: {
      event: 'candidate.assessment.completed',
      candidateId: 'cand-0912-ade',
      topRoute: 'UK Global Talent (Tech Nation)',
      readinessScore: 92,
      targetSystems: ['hubspot', 'whatsapp_bot', 'slack_coaches']
    }
  },
  {
    id: 'get_criteria',
    method: 'GET',
    path: '/api/v1/routes/criteria-spec?route=uk_global_talent',
    name: 'Get Visa Criteria Specification',
    description: 'Retrieves current authoritative criteria specification and documentation requirements for a given route.',
  }
];

export const ApiExplorerTab: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointSpec>(ENDPOINTS[0]);
  const [payloadText, setPayloadText] = useState<string>(
    JSON.stringify(ENDPOINTS[0].defaultPayload, null, 2) || '{}'
  );
  const [responseOutput, setResponseOutput] = useState<{
    status: number;
    timeMs: number;
    headers: Record<string, string>;
    body: Record<string, unknown>;
  } | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);

  const handleSelectEndpoint = (ep: EndpointSpec) => {
    setSelectedEndpoint(ep);
    setPayloadText(ep.defaultPayload ? JSON.stringify(ep.defaultPayload, null, 2) : '');
    setResponseOutput(null);
  };

  const handleExecute = () => {
    setIsExecuting(true);
    const start = performance.now();

    setTimeout(() => {
      let body: Record<string, unknown> = {};
      const status = 200;

      if (selectedEndpoint.id === 'ingest_profile') {
        const norm = Emigr8MiddlewareEngine.normalizeProfile(SAMPLE_CANDIDATE_PROFILES[0]);
        body = {
          success: true,
          candidateId: norm.normalized.id,
          normalizedProfile: norm.normalized,
          benchmarks: norm.metrics,
          pipelineState: 'Ready_For_Dr_Zenith'
        };
      } else if (selectedEndpoint.id === 'evaluate_matrix') {
        const norm = Emigr8MiddlewareEngine.normalizeProfile(SAMPLE_CANDIDATE_PROFILES[0]);
        const evalResults = Emigr8MiddlewareEngine.evaluateRoutes(norm.normalized);
        body = {
          success: true,
          evaluatedCandidate: norm.normalized.fullName,
          matchedRoutesCount: evalResults.results.length,
          topMatch: evalResults.results[0],
          allRoutes: evalResults.results
        };
      } else if (selectedEndpoint.id === 'verify_evidence') {
        const audit = Emigr8MiddlewareEngine.auditEvidenceDossier(10, 3);
        body = {
          success: true,
          isCompliant: audit.isValid,
          maxItemsAllowed: 10,
          recommendationLettersCompliant: true,
          proceduralErrors: audit.errors,
          warnings: audit.warnings
        };
      } else if (selectedEndpoint.id === 'dispatch_webhooks') {
        const norm = Emigr8MiddlewareEngine.normalizeProfile(SAMPLE_CANDIDATE_PROFILES[0]);
        const evalResults = Emigr8MiddlewareEngine.evaluateRoutes(norm.normalized);
        const wh = Emigr8MiddlewareEngine.dispatchWebhooks(norm.normalized, evalResults.results[0]);
        body = {
          success: true,
          dispatchedEvents: wh.events,
          count: wh.events.length,
          deliveryReceiptTimestamp: new Date().toISOString()
        };
      } else {
        body = {
          route: VISA_ROUTES[0],
          criteria: TECH_NATION_CRITERIA_SPECS,
          specVersion: '2026.3.1',
          lastImmigrationRuleChange: '2026-04-01'
        };
      }

      const end = performance.now();
      setResponseOutput({
        status,
        timeMs: Math.round(end - start + 85),
        headers: {
          'Content-Type': 'application/json',
          'X-Emigr8-Signature': 'sha256=4f92d83ab91280a98f12...',
          'X-RateLimit-Remaining': '4982',
          'X-Dr-Zenith-Model': 'dr-zenith-matrix-v3'
        },
        body
      });
      setIsExecuting(false);
    }, 350);
  };

  const curlString = `curl -X ${selectedEndpoint.method} "https://api.emigr8.internal${selectedEndpoint.path}" \\
  -H "Authorization: Bearer em8_live_98ad23f81..." \\
  -H "Content-Type: application/json" \\
  -H "X-Emigr8-Signature: sha256=auto_generated" \\
  ${selectedEndpoint.method === 'POST' ? `-d '${payloadText.replace(/'/g, "\\'")}'` : ''}`;

  const copyCurl = () => {
    navigator.clipboard.writeText(curlString);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Endpoints Sidebar */}
      <div className="lg:col-span-4 space-y-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Middleware Endpoints</span>
            <span className="font-mono text-emerald-400">v1 Spec</span>
          </div>

          <div className="space-y-1.5">
            {ENDPOINTS.map((ep) => {
              const isSelected = selectedEndpoint.id === ep.id;
              return (
                <button
                  key={ep.id}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                    isSelected
                      ? 'bg-slate-800 border-emerald-500/50 text-white shadow-md shadow-emerald-500/10'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span
                      className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        ep.method === 'GET'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="font-semibold text-white truncate">{ep.name}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1 truncate">
                    {ep.path}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Security & Authentication Info */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 space-y-2">
          <div className="flex items-center space-x-2 text-white font-semibold">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Zero-Trust API Gateway Auth</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Requests require a Bearer service token and an HMAC-SHA256 signature in the <code className="text-emerald-400">X-Emigr8-Signature</code> header.
          </p>
        </div>
      </div>

      {/* Main Request & Response Workbench */}
      <div className="lg:col-span-8 space-y-6">
        {/* Endpoint Header Bar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span
                  className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                    selectedEndpoint.method === 'GET'
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {selectedEndpoint.method}
                </span>
                <span className="font-mono text-sm font-semibold text-white">
                  {selectedEndpoint.path}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {selectedEndpoint.description}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={copyCurl}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
              >
                {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCurl ? 'Copied cURL' : 'cURL'}</span>
              </button>

              <button
                onClick={handleExecute}
                disabled={isExecuting}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all"
              >
                <Send className="w-3.5 h-3.5 fill-current" />
                <span>{isExecuting ? 'Sending...' : 'Send Request'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Request Payload Editor */}
        {selectedEndpoint.method === 'POST' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Code className="w-3.5 h-3.5 text-emerald-400" />
                <span>Request Body (JSON)</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">application/json</span>
            </div>
            <textarea
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              rows={8}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-400 focus:outline-none focus:border-emerald-500 resize-y leading-relaxed"
            />
          </div>
        )}

        {/* Response Panel */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Response</span>
            </div>

            {responseOutput ? (
              <div className="flex items-center space-x-3 text-xs font-mono">
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                  HTTP {responseOutput.status} OK
                </span>
                <span className="text-slate-400">{responseOutput.timeMs}ms</span>
              </div>
            ) : (
              <span className="text-xs text-slate-500 italic">Awaiting request trigger...</span>
            )}
          </div>

          {responseOutput ? (
            <div className="space-y-4">
              {/* Response Headers */}
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Response Headers</div>
                <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-400 space-y-1">
                  {Object.entries(responseOutput.headers).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-slate-500">{k}:</span> {v}
                    </div>
                  ))}
                </div>
              </div>

              {/* Response Body */}
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Response Body</div>
                <pre className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-emerald-300 overflow-x-auto max-h-96 scrollbar-thin border border-slate-800/80 leading-relaxed">
                  {JSON.stringify(responseOutput.body, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              Click &quot;Send Request&quot; above to execute this endpoint and inspect the live middleware output.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
