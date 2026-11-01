import React from 'react';
import { History, ExternalLink, ArrowRight, Clock, CheckCircle2, FileSearch } from 'lucide-react';

export interface AuditRecord {
  requestId: number;
  diamondAddress: string;
  requester: string;
  timestamp: number;
  isCompleted: boolean;
  facetCount: number;
  selectorCount: number;
  diagnosticSummary: string;
}

interface RequestHistoryProps {
  records: AuditRecord[];
  onSelectDiamond: (address: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export const RequestHistory: React.FC<RequestHistoryProps> = ({
  records,
  onSelectDiamond,
  isLoading,
  onRefresh,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      
      {/* Title */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-emerald-600" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">On-Chain Inspection Ledger</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Audits immutably recorded on DiamondScope.sol (Gas fee only)
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 transition"
        >
          {isLoading ? 'Refreshing...' : 'Refresh Ledger'}
        </button>
      </div>

      {/* Ledger Feed */}
      <div className="mt-5 space-y-3">
        {records.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <FileSearch className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">No on-chain requests logged yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Inspect a diamond above and click "Submit Inspection Tx" to record the first audit on Botchain!
            </p>
          </div>
        ) : (
          records.map((rec) => {
            const dateStr = rec.timestamp > 0
              ? new Date(rec.timestamp * 1000).toLocaleString()
              : 'Recent';

            return (
              <div
                key={rec.requestId}
                className="group p-4 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      #{rec.requestId}
                    </span>
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      {rec.facetCount} Facets
                    </span>
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      {rec.selectorCount} Selectors
                    </span>
                    {rec.isCompleted && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Published
                      </span>
                    )}
                  </div>

                  {/* Diamond Address */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">Diamond:</span>
                    <span className="font-mono text-xs font-bold text-slate-900 truncate">
                      {rec.diamondAddress}
                    </span>
                  </div>

                  {/* Requester & Timestamp */}
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {dateStr}
                    </span>
                    <span>•</span>
                    <span className="font-mono">
                      By: {rec.requester ? `${rec.requester.slice(0, 6)}...${rec.requester.slice(-4)}` : 'Anonymous'}
                    </span>
                  </div>
                </div>

                {/* Inspect Action */}
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`https://scan.bohr.life/address/${rec.diamondAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition"
                    title="View on BohrScan"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => onSelectDiamond(rec.diamondAddress)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

