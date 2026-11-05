import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Workflow, 
  Cpu, 
  Database, 
  Server, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  FileText, 
  Code2, 
  Network
} from 'lucide-react';

export const AssessmentTab: React.FC = () => {
  const [activeSubSection, setActiveSubSection] = useState<'executive' | 'topology' | 'modules' | 'roadmap'>('executive');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Assessment Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>eMigr8 System Engineering Blueprint</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            eMigr8 Middleware Platform Assessment & Implementation Plan
          </h1>
          <p className="mt-3 text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
            Comprehensive architectural assessment for orchestrating eMigr8&apos;s candidate intake, 
            <strong className="text-emerald-400 font-semibold"> Dr. Zenith AI Diagnostic Engine</strong>, multi-country visa criteria verification, 
            evidence compliance auditing, and downstream CRM & messaging ecosystem.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
            <div>
              <div className="text-xs text-slate-400 font-medium">Primary Focus</div>
              <div className="text-sm font-semibold text-white mt-0.5">Orchestration & Rules Engine</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Core Intelligence</div>
              <div className="text-sm font-semibold text-emerald-400 mt-0.5">Dr. Zenith Multi-Vector Model</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Target Routes</div>
              <div className="text-sm font-semibold text-white mt-0.5">UK, US, Canada, EU Tech Visas</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Throughput Target</div>
              <div className="text-sm font-semibold text-white mt-0.5">&gt; 1,500 profiles/hr &lt; 250ms</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubSection('executive')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeSubSection === 'executive'
              ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          1. Executive & Context Assessment
        </button>
        <button
          onClick={() => setActiveSubSection('topology')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeSubSection === 'topology'
              ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          2. Middleware Topology & Flow
        </button>
        <button
          onClick={() => setActiveSubSection('modules')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeSubSection === 'modules'
              ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          3. Core Functional Modules
        </button>
        <button
          onClick={() => setActiveSubSection('roadmap')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeSubSection === 'roadmap'
              ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          4. 5-Phase Implementation Strategy
        </button>
      </div>

      {/* Sub-section 1: Executive Assessment */}
      {activeSubSection === 'executive' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                  <Workflow className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Current eMigr8 Challenge & Gap</h3>
              </div>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start space-x-2">
                  <span className="text-rose-400 font-bold mt-0.5">✕</span>
                  <span><strong>Fragmented Client Touchpoints:</strong> Intake happens via Typeform, WhatsApp bots, Google Forms, and manual coach calls with no single canonical profile state.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-rose-400 font-bold mt-0.5">✕</span>
                  <span><strong>Manual Criteria Cross-Referencing:</strong> Coaches spend 4-6 hours per profile manually verifying whether evidence satisfies Tech Nation Mandatory Criteria or US O-1A criteria.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-rose-400 font-bold mt-0.5">✕</span>
                  <span><strong>Evidence Packet Compliance Leaks:</strong> Applicants often exceed the 10-piece maximum, upload uncorroborated screenshots, or miss official referee letterheads.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-rose-400 font-bold mt-0.5">✕</span>
                  <span><strong>Delayed Downstream Sync:</strong> Disconnect between CRM (HubSpot), applicant WhatsApp notifications, and coach task distribution queues.</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">The Middleware Solution</h3>
              </div>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span><strong>Universal Intake Ingestion API:</strong> High-throughput REST & Webhook receiver that normalizes tech profiles into a unified schema across all intake funnels.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span><strong>Automated Dr. Zenith Evaluation Pipeline:</strong> Algorithmic & AI criteria matrix that computes instant readiness scores for UK, US, Canada, and EU routes.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span><strong>Deterministic Evidence Integrity Auditor:</strong> Real-time validation enforcing 10-piece limits, 3-reference letter rules, page restrictions, and third-party corroboration.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span><strong>Event Bus & Outbound Dispatcher:</strong> Reliable webhook dispatch with HMAC signing, exponential backoff retries, and direct delivery receipts.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Key Value Metrics */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400 mb-4">Expected Operational ROI</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div className="text-2xl font-bold text-emerald-400">85%</div>
                <div className="text-xs font-medium text-slate-300 mt-1">Reduction in Assessment Turnaround</div>
                <p className="text-xs text-slate-400 mt-2">From 48-72 hours manual review down to &lt; 30 seconds automated Dr. Zenith eligibility scoring.</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div className="text-2xl font-bold text-emerald-400">100%</div>
                <div className="text-xs font-medium text-slate-300 mt-1">Evidence Packet Compliance</div>
                <p className="text-xs text-slate-400 mt-2">Zero endorsements rejected on procedural grounds (10-piece rule, missing letterhead, page caps).</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div className="text-2xl font-bold text-emerald-400">3x</div>
                <div className="text-xs font-medium text-slate-300 mt-1">Candidate Throughput Capacity</div>
                <p className="text-xs text-slate-400 mt-2">Allows eMigr8 coaches to handle 300+ active candidates per cohort without expanding headcounts.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-section 2: Topology */}
      {activeSubSection === 'topology' && (
        <div className="space-y-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
            <h3 className="text-base font-bold text-white mb-2">eMigr8 Middleware Ecosystem Architecture</h3>
            <p className="text-xs text-slate-400 mb-6">
              The middleware sits at the epicenter of user ingress, AI evaluation, and downstream platform sync.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-center">
              {/* Box 1: Sources */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
                <div className="inline-flex p-2 bg-blue-500/10 text-blue-400 rounded-lg mb-2">
                  <Network className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-white">Ingress Channels</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  • Web Assessment Form<br/>
                  • Dr. Zenith Chatbot<br/>
                  • WhatsApp Intake Bot<br/>
                  • Partner Universities
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden lg:flex justify-center text-slate-600">
                <ArrowRight className="w-6 h-6 animate-pulse text-emerald-400" />
              </div>

              {/* Box 2: Middleware Core */}
              <div className="bg-emerald-950/20 border-2 border-emerald-500/40 rounded-xl p-5 text-center shadow-lg shadow-emerald-500/10">
                <div className="inline-flex p-2 bg-emerald-500/20 text-emerald-300 rounded-lg mb-2">
                  <Cpu className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-white">eMigr8 Middleware Gateway</div>
                <div className="text-xs text-emerald-400 font-mono mt-0.5">Core Orchestration Engine</div>
                <div className="text-[11px] text-slate-300 mt-2 space-y-1 text-left bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex items-center space-x-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400"/><span>Data Ingestion & Sanitizer</span></div>
                  <div className="flex items-center space-x-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400"/><span>Dr. Zenith Scoring Matrix</span></div>
                  <div className="flex items-center space-x-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400"/><span>Evidence Dossier Auditor</span></div>
                  <div className="flex items-center space-x-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400"/><span>Event Bus & Webhook Dispatcher</span></div>
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden lg:flex justify-center text-slate-600">
                <ArrowRight className="w-6 h-6 animate-pulse text-emerald-400" />
              </div>

              {/* Box 3: Downstream Destinations */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
                <div className="inline-flex p-2 bg-purple-500/10 text-purple-400 rounded-lg mb-2">
                  <Server className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-white">Downstream Sync</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  • HubSpot CRM (Stages)<br/>
                  • WhatsApp Cloud API<br/>
                  • Coach Slack Escalations<br/>
                  • Client Portal Dashboard
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl">
              <div className="flex items-center space-x-2 text-white font-semibold text-sm mb-1">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Zero-Trust Security</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                HMAC-SHA256 signature verification on every inbound intake and outbound webhook payload to safeguard sensitive immigration documents.
              </p>
            </div>

            <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl">
              <div className="flex items-center space-x-2 text-white font-semibold text-sm mb-1">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Canonical Talent Schema</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Universal JSON representation of tech achievements, citations, open source metrics, salary benchmarks, and recommendation status.
              </p>
            </div>

            <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl">
              <div className="flex items-center space-x-2 text-white font-semibold text-sm mb-1">
                <Workflow className="w-4 h-4 text-emerald-400" />
                <span>Deterministic Fallback</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Combines hard rule evaluation (10-piece ceiling, 3 letters) with LLM semantic reasoning for qualitative criteria (innovation, impact).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sub-section 3: Core Modules */}
      {activeSubSection === 'modules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">Module 01</span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">POST /v1/ingest</span>
            </div>
            <h4 className="text-base font-bold text-white flex items-center space-x-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Ingestion & Normalization Engine</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Consumes candidate intake data from web apps, mobile apps, or partner leads. Automatically benchmarks salary against localized tech salary percentiles, normalizes GitHub/open-source metrics, validates email domains, and generates canonical profile hash.
            </p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400">
              Output: Normalized Candidate Object + Seniority & Impact Index
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">Module 02</span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">POST /v1/evaluate</span>
            </div>
            <h4 className="text-base font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Dr. Zenith Multi-Jurisdiction Engine</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Executes concurrent rule matching against UK Tech Nation (MC, OC1-OC4), US O-1A/EB-1A 10 regulatory criteria, Canada Startup Visa, and Germany Opportunity Card. Identifies best-fit track (Talent vs Promise) and flags missing evidence items.
            </p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400">
              Output: Ranked Route Matrices + Actionable Evidence Checklist
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">Module 03</span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">POST /v1/evidence/verify</span>
            </div>
            <h4 className="text-base font-bold text-white flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Evidence Dossier Auditor</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Enforces procedural immigration constraints: Max 10 evidence documents for UK Global Talent; Exactly 3 letters of recommendation; verifies official corporate letterheads; scans for third-party corroborating proof (news media, cap tables, conference programs).
            </p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400">
              Output: Dossier Compliance Score + Rejection Risk Flags
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">Module 04</span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">POST /v1/webhooks/dispatch</span>
            </div>
            <h4 className="text-base font-bold text-white flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span>Event Bus & Webhook Dispatcher</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Dispatches authenticated event notifications to HubSpot (updating contact deal stages), WhatsApp Cloud API (sending diagnosis summary to candidate), and coach Slack channels for priority review. Features automatic 3-tier exponential backoff retry.
            </p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400">
              Output: Signed Delivery Receipts + Real-Time Telemetry Logs
            </div>
          </div>
        </div>
      )}

      {/* Sub-section 4: Roadmap */}
      {activeSubSection === 'roadmap' && (
        <div className="space-y-4">
          <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5">
            <div className="flex items-start space-x-4">
              <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                1
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">Stage 1: Core Middleware Skeleton & Canonical Schema</h4>
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Implemented & Live</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Establish TypeScript interfaces, normalization rules, data sanitation, and error handling framework.
                </p>
              </div>
            </div>
          </div>

          <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5">
            <div className="flex items-start space-x-4">
              <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                2
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">Stage 2: Dr. Zenith Rules & Diagnostic Engine</h4>
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Operational</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Implement UK Tech Nation (MC + OC1-OC4), US O-1A/EB-1A, Canada SUV, and Germany Opportunity Card evaluation matrices.
                </p>
              </div>
            </div>
          </div>

          <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5">
            <div className="flex items-start space-x-4">
              <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                3
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">Stage 3: Evidence Auditor & Integrity Checker</h4>
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Operational</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Automated checks for the 10-piece ceiling, referee letterhead validation, and third-party corroboration scoring.
                </p>
              </div>
            </div>
          </div>

          <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5">
            <div className="flex items-start space-x-4">
              <div className="h-8 w-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-sm shrink-0">
                4
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">Stage 4: Webhook Dispatcher & External Integrations</h4>
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Live Simulator</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  HMAC signing, delivery retries, and out-of-the-box connectors for HubSpot, WhatsApp Business API, and Slack.
                </p>
              </div>
            </div>
          </div>

          <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5">
            <div className="flex items-start space-x-4">
              <div className="h-8 w-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-sm shrink-0">
                5
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">Stage 5: Production Deployment & Coach Console</h4>
                  <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Ready to Test in Tabs Above</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Full production readiness with the interactive sandbox, API explorer, and criteria matrix configuration.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
