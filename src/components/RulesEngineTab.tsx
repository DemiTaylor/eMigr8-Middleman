import React, { useState } from 'react';
import { VISA_ROUTES, TECH_NATION_CRITERIA_SPECS } from '../data/visaCriteria';
import { VisaRoute } from '../types/middleware';
import { ShieldCheck, Sliders, CheckCircle, Info, FileText, Sparkles, Scale } from 'lucide-react';

export const RulesEngineTab: React.FC = () => {
  const [selectedRoute, setSelectedRoute] = useState<VisaRoute>(VISA_ROUTES[0]);
  const [activeTrack, setActiveTrack] = useState<string>(VISA_ROUTES[0].tracks[0]);
  const [salaryWeight, setSalaryWeight] = useState<number>(25);
  const [openSourceWeight, setOpenSourceWeight] = useState<number>(25);
  const [publicationsWeight, setPublicationsWeight] = useState<number>(25);
  const [patentsWeight, setPatentsWeight] = useState<number>(25);

  const handleSelectRoute = (route: VisaRoute) => {
    setSelectedRoute(route);
    setActiveTrack(route.tracks[0]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Immigration Policy Knowledge Base</span>
            </div>
            <h2 className="text-xl font-bold text-white">Visa Criteria & Scoring Matrices</h2>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic criteria rules enforced by Dr. Zenith across global jurisdictions.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-mono">Updated for:</span>
            <span className="text-xs bg-slate-800 text-emerald-400 px-2.5 py-1 rounded-full border border-slate-700 font-mono">
              2026/2027 Guidelines
            </span>
          </div>
        </div>

        {/* Route Selector Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-5">
          {VISA_ROUTES.map((route) => {
            const isSelected = selectedRoute.id === route.id;
            return (
              <button
                key={route.id}
                onClick={() => handleSelectRoute(route)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-slate-800 border-emerald-500/50 text-white shadow-md shadow-emerald-500/10'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="text-xl mb-1">{route.flag}</div>
                <div className="text-xs font-bold text-white truncate">{route.name.split(' ')[0]} {route.name.split(' ')[1]}</div>
                <div className="text-[10px] text-slate-400 truncate">{route.country}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Criteria Inspection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Route Specifics & Track Tabs */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <span>{selectedRoute.flag}</span>
                  <span>{selectedRoute.name}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Endorsing Body: <span className="text-emerald-400 font-medium">{selectedRoute.endorsementBody}</span>
                </p>
              </div>

              {/* Tracks pill selector */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                {selectedRoute.tracks.map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTrack(t)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activeTrack === t
                        ? 'bg-emerald-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.split(' ')[0]} {t.split(' ')[1] || ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Statutory Constraints Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase font-mono text-slate-500">Max Evidence Items</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">Max {selectedRoute.maxEvidenceItems} docs</div>
                <div className="text-[10px] text-slate-400">Strict regulatory ceiling</div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase font-mono text-slate-500">Referee Letters</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">{selectedRoute.referenceLettersRequired} required</div>
                <div className="text-[10px] text-slate-400">On official company letterhead</div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase font-mono text-slate-500">Optional Criteria</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {selectedRoute.optionalCriteriaCountRequired} of {selectedRoute.totalOptionalCriteriaAvailable} required
                </div>
                <div className="text-[10px] text-slate-400">Must be proven conclusively</div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase font-mono text-slate-500">Difficulty Rating</div>
                <div className="text-sm font-bold text-amber-400 mt-0.5">{selectedRoute.difficulty}</div>
                <div className="text-[10px] text-slate-400">{selectedRoute.processingTimeMonths}</div>
              </div>
            </div>

            {/* Criteria Breakdown List */}
            <div className="mt-6 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Authoritative Evidentiary Requirements ({selectedRoute.country})
              </h4>

              {selectedRoute.id === 'uk_global_talent' ? (
                <div className="space-y-3">
                  {TECH_NATION_CRITERIA_SPECS.map((spec) => (
                    <div key={spec.code} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                              spec.category === 'Mandatory'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {spec.code} • {spec.category}
                          </span>
                          <span className="text-xs font-bold text-white">{spec.name}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{spec.description}</p>
                      <div className="text-[11px] text-slate-400">
                        <span className="text-emerald-400 font-medium">Valid Evidence Types:</span>{' '}
                        {spec.examples.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-3">
                  <p>
                    <strong>Mandatory Baseline:</strong> {selectedRoute.mandatoryCriteriaDescription}
                  </p>
                  <p>
                    <strong>Tracks Available:</strong> {selectedRoute.tracks.join(' • ')}
                  </p>
                  <p className="text-slate-400">
                    The eMigr8 middleware uses country-specific verification pipelines to parse referee credentials, employment verification, and IP registry records against immigration statutory instruments.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Dr. Zenith Algorithmic Weights Configurator */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-white uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dr. Zenith Scoring Weights</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Adjust relative scoring impact when Dr. Zenith calculates candidate baseline readiness.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Earnings & Salary Percentile</span>
                  <span className="font-mono text-emerald-400 font-bold">{salaryWeight}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={salaryWeight}
                  onChange={(e) => setSalaryWeight(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Open-Source Traction & Commits</span>
                  <span className="font-mono text-emerald-400 font-bold">{openSourceWeight}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={openSourceWeight}
                  onChange={(e) => setOpenSourceWeight(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Scientific Papers & Citations</span>
                  <span className="font-mono text-emerald-400 font-bold">{publicationsWeight}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={publicationsWeight}
                  onChange={(e) => setPublicationsWeight(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Patents & Commercial Innovation</span>
                  <span className="font-mono text-emerald-400 font-bold">{patentsWeight}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={patentsWeight}
                  onChange={(e) => setPatentsWeight(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Aggregate Weight:</span>
                <span className="font-mono font-bold text-white">
                  {salaryWeight + openSourceWeight + publicationsWeight + patentsWeight}%
                </span>
              </div>
            </div>
          </div>

          {/* Compliance Checklist Tip */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 text-xs space-y-2">
            <div className="flex items-center space-x-2 text-white font-semibold">
              <Scale className="w-4 h-4 text-emerald-400" />
              <span>Strict Evidentiary Standards</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Every piece of evidence mapped to MC or OC must not exceed 3 A4 pages, must include dates, author identity, and explicit metrics demonstrating direct impact.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
