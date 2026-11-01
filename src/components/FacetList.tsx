import React, { useState } from 'react';
import { Search, Copy, Check, ExternalLink, Filter, Layers, Code, Hash } from 'lucide-react';
import { classifyFacet } from '../utils/selectors';

interface FacetData {
  address: string;
  selectors: {
    hex: string;
    signature: string;
  }[];
}

interface FacetListProps {
  facets: FacetData[];
}

export const FacetList: React.FC<FacetListProps> = ({ facets }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const filteredFacets = facets
    .map((facet) => {
      const classification = classifyFacet(facet.selectors.map((s) => s.hex));
      
      const matchesCategory = selectedCategory === 'all' || classification.category === selectedCategory;
      if (!matchesCategory) return null;

      const matchingSelectors = facet.selectors.filter(
        (sel) =>
          sel.hex.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sel.signature.toLowerCase().includes(searchTerm.toLowerCase())
      );

      const matchesAddress = facet.address.toLowerCase().includes(searchTerm.toLowerCase());

      if (searchTerm.trim() === '' || matchesAddress || matchingSelectors.length > 0) {
        return {
          ...facet,
          classification,
          displaySelectors: searchTerm.trim() === '' || matchesAddress ? facet.selectors : matchingSelectors,
        };
      }
      return null;
    })
    .filter(Boolean) as (FacetData & {
    classification: ReturnType<typeof classifyFacet>;
    displaySelectors: FacetData['selectors'];
  })[];

  const totalSelectorsCount = facets.reduce((sum, f) => sum + f.selectors.length, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Facet & Function Directory</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full routing breakdown: {facets.length} Facets • {totalSelectorsCount} Registered Function Selectors
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search selector, signature, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-full sm:w-64"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Facet Types</option>
            <option value="loupe">Diamond Loupe</option>
            <option value="cut">Diamond Cut</option>
            <option value="ownership">Access & Ownership</option>
            <option value="business">Business Logic</option>
          </select>
        </div>
      </div>

      {/* Facet Cards */}
      <div className="mt-6 space-y-5">
        {filteredFacets.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Filter className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-600">No facets or selectors matched your query</p>
            <p className="text-xs text-slate-400 mt-1">Try refining or clearing your search filter</p>
          </div>
        ) : (
          filteredFacets.map((facet, idx) => (
            <div
              key={facet.address}
              className="rounded-xl border border-slate-200 overflow-hidden hover:border-emerald-300 transition-colors shadow-xs"
            >
              {/* Facet Card Header */}
              <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {facet.classification.label}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${facet.classification.badgeColor}`}>
                        {facet.displaySelectors.length} {facet.displaySelectors.length === 1 ? 'function' : 'functions'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-xs text-slate-600 break-all">
                        {facet.address}
                      </span>
                      <button
                        onClick={() => handleCopy(facet.address)}
                        className="text-slate-400 hover:text-emerald-600 p-0.5 transition"
                        title="Copy Facet Address"
                      >
                        {copiedText === facet.address ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <a
                  href={`https://scan.bohr.life/address/${facet.address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:border-emerald-300 transition shrink-0 self-start sm:self-auto"
                >
                  <span>BohrScan Explorer</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Function Selector Grid */}
              <div className="p-5 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {facet.displaySelectors.map((sel) => (
                    <div
                      key={sel.hex}
                      className="group flex items-start justify-between gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-emerald-50/30 hover:border-emerald-200 transition"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded border border-emerald-200">
                            {sel.hex}
                          </span>
                        </div>
                        <div className="font-mono text-xs font-semibold text-slate-900 mt-1.5 break-all">
                          {sel.signature}
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopy(sel.hex)}
                        className="text-slate-400 hover:text-emerald-600 p-1 opacity-0 group-hover:opacity-100 transition shrink-0"
                        title="Copy Selector Hex"
                      >
                        {copiedText === sel.hex ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};

