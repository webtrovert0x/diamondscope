import React, { useState } from 'react';
import { Layers, ChevronRight, Hash, Code, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react';
import { classifyFacet } from '../utils/selectors';

interface FacetData {
  address: string;
  selectors: {
    hex: string;
    signature: string;
  }[];
}

interface ArchitectureGraphProps {
  diamondAddress: string;
  facets: FacetData[];
  onSelectFacet?: (address: string) => void;
}

export const ArchitectureGraph: React.FC<ArchitectureGraphProps> = ({
  diamondAddress,
  facets,
  onSelectFacet,
}) => {
  const [activeFacetAddress, setActiveFacetAddress] = useState<string | null>(
    facets.length > 0 ? facets[0].address : null
  );

  const selectedFacet = facets.find((f) => f.address === activeFacetAddress) || facets[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
      
      {/* Title & Legend */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Visual Diamond Architecture</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive facet topology and selector dispatch map
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Loupe Facet
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 text-green-800 border border-green-200">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Cut Facet
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            Ownership
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            Business Logic
          </span>
        </div>
      </div>

      {/* Main Visualizer Area */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Interactive Routing Map */}
        <div className="lg:col-span-7 bg-slate-50/60 rounded-xl border border-slate-200/80 p-5 relative">
          
          {/* Diamond Central Hub */}
          <div className="mb-6 p-4 rounded-xl bg-white border-2 border-emerald-500 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full pointer-events-none -mr-4 -mt-4 opacity-50"></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
                  💎
                </div>
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-700">
                    Diamond Proxy Core (EIP-2535)
                  </span>
                  <div className="font-mono text-sm font-semibold text-slate-800 break-all">
                    {diamondAddress}
                  </div>
                </div>
              </div>
              <a
                href={`https://scan.bohr.life/address/${diamondAddress}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-emerald-50 transition"
                title="View on BohrScan"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Delegatecall Router via <code className="text-emerald-700 font-mono font-semibold">fallback()</code></span>
              <span className="font-medium text-slate-700">{facets.length} Active Facets</span>
            </div>
          </div>

          {/* Facet Node Cards */}
          <div className="space-y-2.5">
            {facets.map((facet, idx) => {
              const classification = classifyFacet(facet.selectors.map((s) => s.hex));
              const isSelected = activeFacetAddress === facet.address;

              return (
                <div
                  key={facet.address}
                  onClick={() => {
                    setActiveFacetAddress(facet.address);
                    onSelectFacet?.(facet.address);
                  }}
                  className={`group cursor-pointer rounded-xl p-3.5 border transition-all ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-500 shadow-sm ring-1 ring-emerald-500/30'
                      : 'bg-white hover:bg-slate-50/90 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Connection Indicator */}
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 transition ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-800'
                        }`}
                      >
                        {idx + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${classification.badgeColor}`}>
                            {classification.label}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {facet.selectors.length} {facet.selectors.length === 1 ? 'selector' : 'selectors'}
                          </span>
                        </div>
                        <div className="font-mono text-xs font-medium text-slate-700 truncate mt-1">
                          {facet.address}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-semibold text-emerald-600 hidden sm:inline">
                        {isSelected ? 'Inspecting' : 'View'}
                      </span>
                      <ChevronRight
                        className={`w-4 h-4 transition ${
                          isSelected ? 'text-emerald-600 translate-x-0.5' : 'text-slate-400 group-hover:translate-x-0.5'
                        }`}
                      />
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right: Selected Facet Details & Selectors */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          {selectedFacet ? (
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    Facet Detail Inspector
                  </span>
                  <h3 className="font-bold text-slate-900 text-base mt-0.5">
                    {classifyFacet(selectedFacet.selectors.map((s) => s.hex)).label}
                  </h3>
                </div>
                <a
                  href={`https://scan.bohr.life/address/${selectedFacet.address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium px-2 py-1 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition"
                >
                  <span>BohrScan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 font-mono text-xs break-all text-slate-700">
                <span className="text-slate-400 select-none">Target: </span>
                {selectedFacet.address}
              </div>

              {/* Selector List */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-emerald-600" />
                    Assigned Function Selectors ({selectedFacet.selectors.length})
                  </span>
                </div>

                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {selectedFacet.selectors.map((sel) => (
                    <div
                      key={sel.hex}
                      className="p-2.5 rounded-lg border border-slate-200/80 bg-white hover:border-emerald-300 hover:bg-emerald-50/30 transition text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {sel.hex}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          4-Byte ID
                        </span>
                      </div>
                      <div className="mt-1.5 font-mono text-slate-800 break-all font-medium">
                        {sel.signature}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs">Select a facet to inspect its selectors</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

