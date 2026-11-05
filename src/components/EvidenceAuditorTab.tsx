import React, { useState } from 'react';
import { SAMPLE_EVIDENCE_ITEMS } from '../data/mockProfiles';
import { EvidenceItem } from '../types/middleware';
import { 
  FileCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  FileText, 
  Building2, 
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

export const EvidenceAuditorTab: React.FC = () => {
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>(SAMPLE_EVIDENCE_ITEMS);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<EvidenceItem['category']>('MC_Recognition');
  const [newDocType, setNewDocType] = useState<EvidenceItem['documentType']>('Letter');
  const [newPages, setNewPages] = useState<number>(3);
  const [hasLetterhead, setHasLetterhead] = useState<boolean>(true);
  const [isCorroborated, setIsCorroborated] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  const maxAllowed = 10;
  const currentCount = evidenceList.length;
  const isOverLimit = currentCount > maxAllowed;

  const handleAddEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    let score = 70;
    if (hasLetterhead) score += 15;
    if (isCorroborated) score += 15;
    if (newPages > 3) score -= 10;

    let feedback = 'Standard evidentiary document.';
    if (hasLetterhead && isCorroborated) {
      feedback = 'High credibility: official letterhead with external corroborating third-party proof.';
    } else if (!hasLetterhead) {
      feedback = 'Warning: missing corporate or institutional letterhead.';
    }

    const newItem: EvidenceItem = {
      id: `ev-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      targetCriterionName: newCategory.replace('_', ' '),
      documentType: newDocType,
      pages: newPages,
      hasOfficialLetterhead: hasLetterhead,
      isThirdPartyCorroborated: isCorroborated,
      score,
      feedback
    };

    setEvidenceList([newItem, ...evidenceList]);
    setNewTitle('');
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    setEvidenceList(evidenceList.filter(item => item.id !== id));
  };

  // Average dossier score
  const avgScore = evidenceList.length > 0
    ? Math.round(evidenceList.reduce((acc, curr) => acc + curr.score, 0) / evidenceList.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Dossier Header & Health Score */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              <FileCheck className="w-3.5 h-3.5" />
              <span>Evidence Verification Subsystem</span>
            </div>
            <h2 className="text-xl font-bold text-white">Candidate Evidence Dossier Auditor</h2>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic verification against Tech Nation 10-piece ceiling, page limits, and corroboration rules.
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Evidence Piece</span>
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-800">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Dossier Items Count</div>
            <div className={`text-lg font-bold mt-0.5 ${isOverLimit ? 'text-rose-400' : 'text-emerald-400'}`}>
              {currentCount} / {maxAllowed} Allowed
            </div>
            <div className="text-[10px] text-slate-400">
              {isOverLimit ? 'EXCEEDS STRICT UK LIMIT!' : `${maxAllowed - currentCount} slots remaining`}
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Dossier Quality Score</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">{avgScore} / 100</div>
            <div className="text-[10px] text-slate-400">Corroborated & formatted</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Letters on Official Letterhead</div>
            <div className="text-lg font-bold text-white mt-0.5">
              {evidenceList.filter(e => e.hasOfficialLetterhead).length} / {evidenceList.length} items
            </div>
            <div className="text-[10px] text-slate-400">Institutional validity</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Third-Party Corroborated</div>
            <div className="text-lg font-bold text-white mt-0.5">
              {evidenceList.filter(e => e.isThirdPartyCorroborated).length} / {evidenceList.length} items
            </div>
            <div className="text-[10px] text-slate-400">Press, links, cap tables</div>
          </div>
        </div>
      </div>

      {/* Warning banner if over limit */}
      {isOverLimit && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/60 flex items-center space-x-3 text-rose-300 text-xs">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
          <span>
            <strong>Procedural Invalidation Alert:</strong> Tech Nation guidelines state that any submission with more than 10 pieces of evidence will have additional pieces discarded or rejected unread. Remove {currentCount - maxAllowed} item(s).
          </span>
        </div>
      )}

      {/* Add Evidence Modal/Card */}
      {showAddForm && (
        <form onSubmit={handleAddEvidence} className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Add New Evidence Document for Audit</h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Document Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. AWS Summit London Speaker Confirmation & Attendee Metrics"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Visa Criterion</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as EvidenceItem['category'])}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="MC_Recognition">Mandatory: Leader / Emerging Leader</option>
                <option value="OC1_Innovation">Optional 1: Innovation in Tech Business</option>
                <option value="OC2_Outside_Work">Optional 2: Outside Work / Ecosystem</option>
                <option value="OC3_Significant_Contribution">Optional 3: Significant Commercial Impact</option>
                <option value="OC4_Academic">Optional 4: Academic & Research Contributions</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Document Format</label>
              <select
                value={newDocType}
                onChange={(e) => setNewDocType(e.target.value as EvidenceItem['documentType'])}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Letter">Letter of Reference / Verification</option>
                <option value="Metrics_Dashboard">Metrics Dashboard / Analytics Export</option>
                <option value="Employment_Contract">Employment Contract & Cap Table</option>
                <option value="Patent">Patent / Intellectual Property Grant</option>
                <option value="Media_Article">Media Feature / News Article</option>
                <option value="Code_Repository">Code Repository Audit / Git Commits</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Page Count (Max 3 A4 Recommended)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={newPages}
                onChange={(e) => setNewPages(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={hasLetterhead}
                onChange={(e) => setHasLetterhead(e.target.checked)}
                className="accent-emerald-500 rounded"
              />
              <span>Includes Official Company / University Letterhead</span>
            </label>

            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isCorroborated}
                onChange={(e) => setIsCorroborated(e.target.checked)}
                className="accent-emerald-500 rounded"
              />
              <span>Third-Party Corroborated (Verified URL, press, or external cap table)</span>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all"
            >
              Audit & Score Document
            </button>
          </div>
        </form>
      )}

      {/* Evidence List */}
      <div className="space-y-3">
        {evidenceList.map((item, idx) => {
          const isWeak = item.score < 60;
          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all ${
                isWeak
                  ? 'bg-rose-950/10 border-rose-800/40 text-rose-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-slate-400">#{idx + 1}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        item.category.startsWith('MC')
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {item.category.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-semibold text-white">{item.title}</span>
                  </div>

                  <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
                    <span>Format: {item.documentType.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>Pages: {item.pages} {item.pages > 3 ? '(Exceeds 3 page guideline)' : ''}</span>
                    <span>•</span>
                    <span className={item.hasOfficialLetterhead ? 'text-emerald-400' : 'text-amber-400'}>
                      {item.hasOfficialLetterhead ? 'Official Letterhead' : 'No Letterhead'}
                    </span>
                    <span>•</span>
                    <span className={item.isThirdPartyCorroborated ? 'text-emerald-400' : 'text-amber-400'}>
                      {item.isThirdPartyCorroborated ? 'Third-Party Corroborated' : 'Uncorroborated'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 italic pt-1">{item.feedback}</p>
                </div>

                <div className="flex items-center space-x-4 self-end sm:self-center shrink-0">
                  <div className="text-right">
                    <div
                      className={`text-lg font-bold font-mono ${
                        item.score >= 80 ? 'text-emerald-400' : item.score >= 60 ? 'text-amber-400' : 'text-rose-400'
                      }`}
                    >
                      {item.score}/100
                    </div>
                    <div className="text-[10px] text-slate-500">Credibility</div>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
