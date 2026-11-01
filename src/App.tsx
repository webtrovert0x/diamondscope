import React, { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { Header } from './components/Header';
import { DiamondInspector } from './components/DiamondInspector';
import { RequestHistory, AuditRecord } from './components/RequestHistory';
import { diamondScopeAbi } from './contracts/diamondScopeAbi';
import deploymentInfo from './contracts/diamondScopeAddress.json';
import {
  Gem,
  Layers,
  History,
  BookOpen,
  Terminal,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Fuel,
  Cpu,
} from 'lucide-react';

export const App: React.FC = () => {
  const publicClient = usePublicClient();
  const [activeTab, setActiveTab] = useState<'inspector' | 'ledger' | 'guide'>('inspector');
  const [selectedDiamond, setSelectedDiamond] = useState<string | undefined>(undefined);
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [isLedgerLoading, setIsLedgerLoading] = useState<boolean>(false);
  const [reownMissing, setReownMissing] = useState<boolean>(false);

  const contractAddress = (deploymentInfo.address ||
    (typeof process !== 'undefined' && process.env?.DIAMONDSCOPE_CONTRACT_ADDRESS)) as `0x${string}`;

  // Check if REOWN_ID is missing
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (!data.reownId || data.reownId.trim() === '') {
          setReownMissing(true);
        }
      })
      .catch(() => {
        // ignore
      });
  }, []);

  // Fetch On-chain Inspection records from DiamondScope.sol
  const fetchRecords = async () => {
    if (!publicClient || !contractAddress) return;
    setIsLedgerLoading(true);

    try {
      // 1. Try getRecentRequests(10)
      const data = (await publicClient.readContract({
        address: contractAddress,
        abi: diamondScopeAbi,
        functionName: 'getRecentRequests',
        args: [10n],
      })) as any[];

      const mapped: AuditRecord[] = data.map((r: any) => ({
        requestId: Number(r.requestId),
        diamondAddress: r.diamondAddress,
        requester: r.requester,
        timestamp: Number(r.timestamp),
        isCompleted: Boolean(r.isCompleted),
        facetCount: Number(r.facetCount),
        selectorCount: Number(r.selectorCount),
        diagnosticSummary: r.diagnosticSummary || '',
      }));

      setRecords(mapped);
    } catch (err) {
      // Fallback: If DiamondScope not yet deployed or zero requests, show empty or local mock
      console.warn('Could not query DiamondScope contract:', err);
    } finally {
      setIsLedgerLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [publicClient]);

  const handleSelectDiamondFromLedger = (addr: string) => {
    setSelectedDiamond(addr);
    setActiveTab('inspector');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Top Header */}
      <Header />

      {/* REOWN_ID Reminder Banner (if not set in .env) */}
      {reownMissing && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-emerald-900 gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Note:</strong> Set your <code className="bg-emerald-100 font-mono px-1 py-0.5 rounded text-emerald-800">REOWN_ID</code> in <code className="bg-emerald-100 font-mono px-1 py-0.5 rounded text-emerald-800">.env</code> to enable seamless wallet modal connection.
              </span>
            </div>
            <button
              onClick={() => setActiveTab('guide')}
              className="font-semibold underline hover:text-emerald-700 shrink-0"
            >
              Setup Guide →
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mb-8 border-b border-slate-200 pb-4 overflow-x-auto">
          
          <button
            onClick={() => setActiveTab('inspector')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition ${
              activeTab === 'inspector'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Diamond Inspector</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('ledger');
              fetchRecords();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition ${
              activeTab === 'ledger'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>On-Chain Ledger</span>
            {records.length > 0 && (
              <span className={`text-xs px-2 py-0.2 rounded-full font-mono ${
                activeTab === 'ledger' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {records.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition ${
              activeTab === 'guide'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Deployment & Contract</span>
          </button>

        </div>

        {/* Tab 1: Diamond Inspector */}
        {activeTab === 'inspector' && (
          <DiamondInspector
            initialAddress={selectedDiamond}
            onAuditLogged={() => {
              fetchRecords();
              setActiveTab('ledger');
            }}
          />
        )}

        {/* Tab 2: On-Chain Ledger */}
        {activeTab === 'ledger' && (
          <RequestHistory
            records={records}
            onSelectDiamond={handleSelectDiamondFromLedger}
            isLoading={isLedgerLoading}
            onRefresh={fetchRecords}
          />
        )}

        {/* Tab 3: Deployment & Smart Contract Information */}
        {activeTab === 'guide' && (
          <div className="space-y-6">
            
            {/* Contract Info Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">DiamondScope Smart Contract</h2>
                  <p className="text-xs text-slate-500">
                    On-chain audit recording system • Botchain Testnet (Chain ID 968)
                  </p>
                </div>
              </div>

              {/* Gas Fee Guarantee */}
              <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <Fuel className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-950">
                    Zero Protocol Fee Policy (Gas Fee Only)
                  </h4>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    All functions on <code className="font-mono font-bold">DiamondScope.sol</code> (<code className="font-mono">requestDiamondCheck</code> and <code className="font-mono">publishResult</code>) are non-payable. Users and developers only pay standard EVM gas fees in BOT token. No service cut, tax, or protocol fee is charged.
                  </p>
                </div>
              </div>

              {/* Botchain Parameters */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block font-sans">Network Name</span>
                  <span className="font-bold text-slate-900 mt-1 block">Botchain Testnet</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block font-sans">Chain ID</span>
                  <span className="font-bold text-slate-900 mt-1 block">968</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block font-sans">Native Token</span>
                  <span className="font-bold text-slate-900 mt-1 block">BOT</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block font-sans">RPC Endpoint</span>
                  <a
                    href="https://rpc.bohr.life"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-emerald-700 mt-1 block hover:underline truncate"
                  >
                    https://rpc.bohr.life
                  </a>
                </div>
              </div>

              {/* Environment Setup */}
              <div className="mt-6 border-t border-slate-100 pt-6">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Environment Configuration (.env)</h3>
                <p className="text-xs text-slate-600 mb-3">
                  Your project has a ready-to-use <code className="font-mono text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded">.env</code> file in the project root:
                </p>
                <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto">
                  <pre>{`# DiamondScope Configuration - Botchain Testnet
PRIVATE_KEY=your_private_key_here
REOWN_ID=your_reown_project_id_here
RPC_URL=https://rpc.bohr.life
CHAIN_ID=968
EXPLORER_URL=https://scan.bohr.life/`}</pre>
                </div>
              </div>

              {/* Deployment Commands */}
              <div className="mt-6 border-t border-slate-100 pt-6">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Deployment Commands</h3>
                <p className="text-xs text-slate-600 mb-3">
                  Once you add your private key with BOT gas funds into <code className="font-mono text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded">.env</code>, deploy directly to Botchain Testnet:
                </p>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800">
                    <span className="text-slate-400 block font-sans mb-1 text-[11px]">1. Deploy DiamondScope.sol:</span>
                    <code>npm run deploy:botchain</code>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800">
                    <span className="text-slate-400 block font-sans mb-1 text-[11px]">2. Deploy Sample EIP-2535 Diamond:</span>
                    <code>npm run deploy:sample-diamond</code>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Gem className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-slate-800">DiamondScope</span>
            <span>• EIP-2535 Loupe Inspector</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://scan.bohr.life/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-700 transition"
            >
              BohrScan Explorer
            </a>
            <span>•</span>
            <a
              href="https://eips.ethereum.org/EIPS/eip-2535"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-700 transition"
            >
              EIP-2535 Specification
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
};

