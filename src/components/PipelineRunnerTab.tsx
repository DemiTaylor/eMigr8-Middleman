import React, { useState } from 'react';
import { SAMPLE_CANDIDATE_PROFILES } from '../data/mockProfiles';
import { CandidateProfile, RouteMatchResult, PipelineExecutionLog, WebhookEvent } from '../types/middleware';
import { Emigr8MiddlewareEngine } from '../services/middlewareEngine';
import { 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Globe, 
  Terminal, 
  Send, 
  Award, 
  ChevronRight,
  UserCheck,
  FileCheck
} from 'lucide-react';

export const PipelineRunnerTab: React.FC = () => {
  const [selectedProfileId, setSelectedProfileId] = useState<string>(SAMPLE_CANDIDATE_PROFILES[0].id);
  const [activeProfile, setActiveProfile] = useState<CandidateProfile>(SAMPLE_CANDIDATE_PROFILES[0]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  
  // Pipeline Results
  const [evaluationResults, setEvaluationResults] = useState<RouteMatchResult[] | null>(null);
  const [executionLogs, setExecutionLogs] = useState<PipelineExecutionLog[]>([]);
  const [dispatchedWebhooks, setDispatchedWebhooks] = useState<WebhookEvent[]>([]);
  const [auditResult, setAuditResult] = useState<{ isValid: boolean; errors: string[]; warnings: string[] } | null>(null);

  const stages = [
    { name: '1. Ingestion & Normalization', desc: 'Sanitizing tech credentials & salary benchmark' },
    { name: '2. Multi-Route Matching', desc: 'Cross-evaluating UK, US, CA, EU talent criteria' },
    { name: '3. Dr. Zenith AI Diagnosis', desc: 'Mandatory & Optional Criteria scoring' },
    { name: '4. Evidence Packet Audit', desc: '10-piece ceiling & referee letter checks' },
    { name: '5. Webhook & CRM Dispatch', desc: 'Emitting signed event payloads to HubSpot & WhatsApp' },
  ];

  const handleSelectProfile = (id: string) => {
    const profile = SAMPLE_CANDIDATE_PROFILES.find(p => p.id === id);
    if (profile) {
      setSelectedProfileId(id);
      setActiveProfile(profile);
      // Reset pipeline state
      setEvaluationResults(null);
      setExecutionLogs([]);
      setDispatchedWebhooks([]);
      setAuditResult(null);
      setCurrentStageIndex(0);
    }
  };

  const runPipeline = () => {
    setIsRunning(true);
    setCurrentStageIndex(0);
    setEvaluationResults(null);
    setExecutionLogs([]);
    setDispatchedWebhooks([]);
    setAuditResult(null);

    const allLogs: PipelineExecutionLog[] = [];

    // Stage 1
    const { normalized, logs: normLogs } = Emigr8MiddlewareEngine.normalizeProfile(activeProfile);
    allLogs.push(...normLogs);
    setExecutionLogs([...allLogs]);

    setTimeout(() => {
      setCurrentStageIndex(1);
      // Stage 2 & 3
      const { results, logs: evalLogs } = Emigr8MiddlewareEngine.evaluateRoutes(normalized);
      allLogs.push(...evalLogs);
      setEvaluationResults(results);
      setExecutionLogs([...allLogs]);

      setTimeout(() => {
        setCurrentStageIndex(2);
        
        setTimeout(() => {
          setCurrentStageIndex(3);
          // Stage 4: Evidence Audit
          const audit = Emigr8MiddlewareEngine.auditEvidenceDossier(normalized.evidenceItemsCount, normalized.recommendationLettersReady);
          allLogs.push(...audit.logs);
          setAuditResult({ isValid: audit.isValid, errors: audit.errors, warnings: audit.warnings });
          setExecutionLogs([...allLogs]);

          setTimeout(() => {
            setCurrentStageIndex(4);
            // Stage 5: Webhooks
            const { events, logs: whLogs } = Emigr8MiddlewareEngine.dispatchWebhooks(normalized, results[0]);
            allLogs.push(...whLogs);
            setDispatchedWebhooks(events);
            setExecutionLogs([...allLogs]);
            setIsRunning(false);
          }, 600);
        }, 600);
      }, 600);
    }, 600);
  };

  const topMatch = evaluationResults ? evaluationResults[0] : null;

  return (
    <div className="space-y-6">
      {/* Top Controller Panel */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Middleware Pipeline</span>
            </div>
            <h2 className="text-xl font-bold text-white">Live Execution Simulator</h2>
            <p className="text-xs text-slate-400 mt-1">
              Select a candidate tech profile and trigger the end-to-end middleware orchestration engine.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={selectedProfileId}
              onChange={(e) => handleSelectProfile(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
            >
              {SAMPLE_CANDIDATE_PROFILES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.currentRole} - {p.trackPreference})
                </option>
              ))}
            </select>

            <button
              onClick={runPipeline}
              disabled={isRunning}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${
                isRunning
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 active:scale-95'
              }`}
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Processing Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute Pipeline</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Candidate Profile Summary Card */}
        <div className="mt-5 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Candidate</div>
            <div className="text-xs font-bold text-white truncate mt-0.5">{activeProfile.fullName}</div>
            <div className="text-[10px] text-emerald-400 truncate">{activeProfile.currentRole}</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Location & Target</div>
            <div className="text-xs font-semibold text-white mt-0.5">{activeProfile.currentCountry}</div>
            <div className="text-[10px] text-slate-400 truncate">→ {activeProfile.targetCountries.join(', ')}</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Experience & Track</div>
            <div className="text-xs font-semibold text-white mt-0.5">{activeProfile.yearsExperience} yrs exp</div>
            <div className="text-[10px] text-emerald-400">{activeProfile.trackPreference} Track</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Salary Equiv (USD)</div>
            <div className="text-xs font-semibold text-white mt-0.5">${activeProfile.salaryUsdEquivalent.toLocaleString()}</div>
            <div className="text-[10px] text-slate-400">Top tech percentile</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Open Source / Stars</div>
            <div className="text-xs font-semibold text-white mt-0.5">
              {activeProfile.openSourceStars ? `${activeProfile.openSourceStars.toLocaleString()} stars` : 'None'}
            </div>
            <div className="text-[10px] text-slate-400">{activeProfile.patentsCount} patent(s)</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Evidence Prepared</div>
            <div className="text-xs font-semibold text-white mt-0.5">{activeProfile.evidenceItemsCount} / 10 items</div>
            <div className="text-[10px] text-slate-400">{activeProfile.recommendationLettersReady} / 3 letters</div>
          </div>
        </div>
      </div>

      {/* Visual Pipeline Progress Tracker */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Pipeline Execution Stages</h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {stages.map((stage, idx) => {
            const isCompleted = evaluationResults && (!isRunning || currentStageIndex > idx);
            const isCurrent = isRunning && currentStageIndex === idx;

            return (
              <div
                key={stage.name}
                className={`p-3 rounded-xl border transition-all ${
                  isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                    : isCurrent
                    ? 'bg-slate-800 border-emerald-400 text-white shadow-md shadow-emerald-500/10 animate-pulse'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono font-bold">
                    {idx + 1}. Stage
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isCurrent ? (
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-slate-800" />
                  )}
                </div>
                <div className="text-xs font-semibold text-white truncate">{stage.name.split('. ')[1]}</div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">{stage.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Results Display when pipeline runs */}
      {topMatch && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Column 1 & 2: Dr. Zenith Evaluation & Route Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Top Match Highlight */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 mb-3">
                    <Award className="w-3.5 h-3.5" />
                    <span>Primary Recommended Route</span>
                  </div>
                  <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                    <span>{topMatch.route.flag}</span>
                    <span>{topMatch.route.name}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Endorsement: {topMatch.route.endorsementBody} • Processing: {topMatch.route.processingTimeMonths}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-black text-emerald-400 font-mono">
                    {topMatch.overallFitPercentage}%
                  </div>
                  <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    {topMatch.readinessLevel}
                  </div>
                </div>
              </div>

              {/* Dr. Zenith AI Synthesis Box */}
              <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30">
                <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Dr. Zenith Diagnostic Assessment</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {topMatch.drZenithRecommendation}
                </p>
              </div>

              {/* Criteria Evaluations Grid */}
              <div className="mt-5 space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  UK Tech Nation Criteria Breakdown
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {topMatch.criteriaEvaluations.map((crit) => (
                    <div
                      key={crit.code}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{crit.code}: {crit.name.split(':')[1] || crit.name}</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            crit.status === 'Met'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {crit.confidenceScore}% ({crit.status})
                        </span>
                      </div>
                      
                      {crit.matchedEvidence.length > 0 && (
                        <div className="text-[11px] text-slate-300">
                          <span className="text-slate-500 font-medium">Evidence:</span> {crit.matchedEvidence.join('; ')}
                        </div>
                      )}
                      
                      <div className="text-[10px] text-slate-400 italic">
                        Guidance: {crit.remediationAdvice}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Other Global Routes Quick Matrix */}
              <div className="mt-6 pt-5 border-t border-slate-800">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Cross-Jurisdiction Comparison
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {evaluationResults?.slice(1).map((r) => (
                    <div key={r.route.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">{r.route.flag} {r.route.name.split(' ')[0]} {r.route.name.split(' ')[1]}</span>
                        <span className="font-mono font-bold text-emerald-400">{r.overallFitPercentage}%</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{r.readinessLevel}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Evidence Audit Verdict */}
            {auditResult && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white">Procedural Evidence Compliance Audit</h4>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold font-mono border ${
                      auditResult.isValid
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {auditResult.isValid ? 'PASSED PROCEDURAL CHECKS' : 'ACTION REQUIRED'}
                  </span>
                </div>

                {auditResult.errors.length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-800/40 text-xs text-rose-300 space-y-1 mb-3">
                    <div className="font-bold flex items-center space-x-1.5 text-rose-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Procedural Blockers (Must Fix Before Submission):</span>
                    </div>
                    {auditResult.errors.map((err, i) => (
                      <div key={i}>• {err}</div>
                    ))}
                  </div>
                )}

                {auditResult.warnings.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-300 space-y-1">
                    <div className="font-bold text-amber-400">Optimization Advice:</div>
                    {auditResult.warnings.map((warn, i) => (
                      <div key={i}>• {warn}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Column 3: Live Logs & Dispatched Webhooks */}
          <div className="space-y-6">
            {/* Dispatched Webhooks */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-white">
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Outbound Webhook Deliveries</span>
                </div>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                  {dispatchedWebhooks.length} Dispatched
                </span>
              </div>

              <div className="space-y-2.5">
                {dispatchedWebhooks.map((wh) => (
                  <div key={wh.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{wh.system}</span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        HTTP {wh.httpStatus} • {wh.latencyMs}ms
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 truncate">
                      Event: {wh.event}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 truncate">
                      Sig: {wh.signature}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pipeline Execution Telemetry Logs */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Middleware Pipeline Logs</span>
                </div>
                <span className="text-[10px] text-slate-500">Auto-streaming</span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                {executionLogs.map((log) => (
                  <div key={log.id} className="text-[11px] leading-relaxed">
                    <span className="text-slate-500">[{log.stage}]</span>{' '}
                    <span
                      className={
                        log.level === 'success'
                          ? 'text-emerald-400'
                          : log.level === 'warn'
                          ? 'text-amber-400'
                          : 'text-slate-300'
                      }
                    >
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
