import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  HelpCircle, 
  Lightbulb, 
  Copy, 
  Check, 
  RefreshCw, 
  Settings, 
  Trash2, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { ExplainedError } from '../utils/errorExplainer';

interface DetailedErrorBannerProps {
  error: ExplainedError | null;
  onDismiss?: () => void;
  onAction?: (actionKey: string) => void;
  className?: string;
}

export const DetailedErrorBanner: React.FC<DetailedErrorBannerProps> = ({
  error,
  onDismiss,
  onAction,
  className = ''
}) => {
  const [copied, setCopied] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [isLocallyDismissed, setIsLocallyDismissed] = useState(false);

  // Reset local dismiss when a new error is passed
  useEffect(() => {
    setIsLocallyDismissed(false);
  }, [error]);

  if (!error || isLocallyDismissed) return null;

  const handleDismiss = () => {
    setIsLocallyDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(error.technicalError);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-xl border border-rose-500/50 bg-[#1a0f14] p-4 text-xs shadow-2xl transition-all duration-200 animate-fadeIn ${className}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-rose-500/20">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-rose-200 text-sm">{error.title}</h4>
            <div className="text-[11px] text-rose-300/70 font-mono mt-0.5">
              Diagnostics &amp; Resolution Guide
            </div>
          </div>
        </div>

        {/* Header Cancel / Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="px-3 py-1.5 rounded-lg bg-rose-900/70 hover:bg-rose-800 border border-rose-500/50 text-rose-100 hover:text-white font-mono text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
          title="Cancel and remove this error message"
        >
          <X className="w-4 h-4 text-rose-300" />
          <span>✕ Cancel Error</span>
        </button>
      </div>

      {/* Body: Explanation & Hint */}
      <div className="mt-3.5 space-y-3">
        {/* Explanation Block */}
        <div className="bg-[#12080c] border border-rose-950 rounded-lg p-3 space-y-1">
          <div className="flex items-center space-x-1.5 text-amber-300 font-bold uppercase tracking-wider text-[10px]">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Why this happened (Reason &amp; Context):</span>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed">
            {error.explanation}
          </p>
        </div>

        {/* Hint / Fix Block */}
        <div className="bg-[#0b1414] border border-teal-900/50 rounded-lg p-3 space-y-1">
          <div className="flex items-center space-x-1.5 text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>How to fix this solution (Hint &amp; Action):</span>
          </div>
          <div className="text-emerald-100/90 text-xs leading-relaxed whitespace-pre-line font-mono">
            {error.hint}
          </div>
        </div>

        {/* Technical Details Accordion */}
        <div className="border border-slate-800 rounded-lg overflow-hidden bg-[#0c1017]">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full px-3 py-2 text-[11px] font-mono text-slate-400 hover:text-slate-200 flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="flex items-center space-x-1.5">
              <span>Technical Error Log:</span>
              <code className="text-rose-400 truncate max-w-[280px] sm:max-w-[400px]">
                {error.technicalError}
              </code>
            </span>
            {showTechnicalDetails ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showTechnicalDetails && (
            <div className="p-3 bg-[#070a0e] border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
              <span className="text-rose-300 break-all select-all pr-2">
                {error.technicalError}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 flex items-center space-x-1 shrink-0 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Action & Cancel Buttons Bar */}
        <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {error.actionKey && onAction && (
              <button
                type="button"
                onClick={() => onAction(error.actionKey!)}
                className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-mono font-bold text-xs flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
              >
                {error.actionKey === 'retry' && <RefreshCw className="w-3.5 h-3.5" />}
                {error.actionKey === 'open_config' && <Settings className="w-3.5 h-3.5" />}
                {error.actionKey === 'delete_webhook' && <Trash2 className="w-3.5 h-3.5" />}
                {error.actionKey === 'open_telegram_botfather' && <ExternalLink className="w-3.5 h-3.5" />}
                <span>{error.actionLabel || 'Apply Fix'}</span>
              </button>
            )}
          </div>

          {/* Primary Cancel / Dismiss Button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="px-4 py-2 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-700/60 text-rose-200 hover:text-white font-mono font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-md"
          >
            <X className="w-4 h-4 text-rose-300" />
            <span>Cancel / Remove Error Message</span>
          </button>
        </div>
      </div>
    </div>
  );
};
