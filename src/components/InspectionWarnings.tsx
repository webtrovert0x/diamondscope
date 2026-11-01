import React from 'react';
import { AlertTriangle, AlertOctagon, CheckCircle2, ShieldAlert, Info } from 'lucide-react';

interface WarningItem {
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  details?: string[];
}

interface InspectionWarningsProps {
  warnings: WarningItem[];
  passedChecks: string[];
}

export const InspectionWarnings: React.FC<InspectionWarningsProps> = ({
  warnings,
  passedChecks,
}) => {
  const criticalCount = warnings.filter((w) => w.type === 'critical').length;
  const warningCount = warnings.filter((w) => w.type === 'warning').length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-emerald-600" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">Security & Architecture Diagnostics</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated EIP-2535 standard verification and facet anomaly detection
            </p>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 text-xs">
          {criticalCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold flex items-center gap-1">
              <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
              {criticalCount} Critical
            </span>
          )}
          {warningCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              {warningCount} Warnings
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {passedChecks.length} Passed
          </span>
        </div>
      </div>

      {/* Warnings List */}
      <div className="mt-6 space-y-4">
        {warnings.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-emerald-900">
                All EIP-2535 Standard Checks Passed
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                No selector collisions, zero-address routing, or missing core interfaces were detected.
              </p>
            </div>
          </div>
        ) : (
          warnings.map((warn, index) => {
            const isCritical = warn.type === 'critical';
            return (
              <div
                key={index}
                className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
                  isCritical
                    ? 'bg-red-50/60 border-red-200 text-red-950'
                    : 'bg-amber-50/60 border-amber-200 text-amber-950'
                }`}
              >
                {isCritical ? (
                  <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold">{warn.title}</h4>
                    <span
                      className={`text-[10px] uppercase font-extrabold px-1.5 py-0.2 rounded border ${
                        isCritical
                          ? 'bg-red-100 text-red-800 border-red-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {warn.type}
                    </span>
                  </div>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">
                    {warn.description}
                  </p>

                  {warn.details && warn.details.length > 0 && (
                    <div className="mt-2 p-2 rounded-lg bg-white/70 border border-slate-200/50 space-y-1 font-mono text-[11px]">
                      {warn.details.map((d, i) => (
                        <div key={i} className="text-slate-700 break-all">
                          • {d}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Passed Checks Accordion / Badges */}
        {passedChecks.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Verified Compliance Checks
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {passedChecks.map((check, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-emerald-900"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">{check}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

