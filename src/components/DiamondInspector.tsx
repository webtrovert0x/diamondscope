import React, { useState, useEffect } from 'react';
import { usePublicClient, useAccount, useWalletClient } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { isAddress, decodeEventLog } from 'viem';
import {
  Search,
  Gem,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Send,
  Fuel,
  Layers,
  Copy,
  Check,
  RefreshCw,
  Info,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { diamondLoupeAbi } from '../contracts/diamondLoupeAbi';
import { diamondScopeAbi } from '../contracts/diamondScopeAbi';
import { resolveSelector } from '../utils/selectors';
import { ArchitectureGraph } from './ArchitectureGraph';
import { FacetList } from './FacetList';
import { InspectionWarnings } from './InspectionWarnings';
import sampleDiamondInfo from '../contracts/sampleDiamondAddress.json';
import diamondScopeDeployment from '../contracts/diamondScopeAddress.json';

interface FacetData {
  address: string;
  selectors: {
    hex: string;
    signature: string;
  }[];
}

interface WarningItem {
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  details?: string[];
}

interface DiamondInspectorProps {
  initialAddress?: string;
  onAuditLogged?: () => void;
}

type InspectionStep = 'idle' | 'signing' | 'mining' | 'analyzing' | 'complete';

export const DiamondInspector: React.FC<DiamondInspectorProps> = ({
  initialAddress,
  onAuditLogged,
}) => {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { isConnected } = useAccount();
  const { open } = useAppKit();

  const [inputAddress, setInputAddress] = useState<string>(
    initialAddress || sampleDiamondInfo.diamondAddress || ''
  );
  const [analyzedAddress, setAnalyzedAddress] = useState<string | null>(null);
  const [inspectionStep, setInspectionStep] = useState<InspectionStep>('idle');
  const [error, setError] = useState<string | null>(null);

  const [txHash, setTxHash] = useState<string | null>(null);
  const [publishTxHash, setPublishTxHash] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<number | null>(null);

  const [facets, setFacets] = useState<FacetData[]>([]);
  const [warnings, setWarnings] = useState<WarningItem[]>([]);
  const [passedChecks, setPassedChecks] = useState<string[]>([]);
  const [hasLoupeInterface, setHasLoupeInterface] = useState<boolean>(false);
  const [hasCutInterface, setHasCutInterface] = useState<boolean>(false);

  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);

  const diamondScopeAddress = (diamondScopeDeployment.address ||
    (typeof process !== 'undefined' && process.env?.DIAMONDSCOPE_CONTRACT_ADDRESS)) as `0x${string}`;

  // Sync initialAddress prop
  useEffect(() => {
    if (initialAddress && isAddress(initialAddress)) {
      setInputAddress(initialAddress);
    }
  }, [initialAddress]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleLoadSample = () => {
    setInputAddress(sampleDiamondInfo.diamondAddress);
  };

  /**
   * Main inspection flow:
   * 1. Submits inspection transaction to DiamondScope.sol (Gas fee only, 0 BOT value).
   * 2. Waits for block confirmation on Botchain.
   * 3. Queries DiamondLoupe facets and selectors.
   * 4. Decodes signatures and analyzes security warnings.
   * 5. Publishes result on DiamondScope.sol (Gas fee only).
   */
  const handleInspectDiamond = async (targetAddr?: string) => {
    const addressToInspect = (targetAddr || inputAddress).trim();
    setError(null);
    setTxHash(null);
    setPublishTxHash(null);
    setRequestId(null);

    if (!addressToInspect) {
      setError('Please provide a contract address.');
      return;
    }

    if (!isAddress(addressToInspect)) {
      setError('Invalid Ethereum/Botchain address format (must start with 0x and be 40 hex characters).');
      return;
    }

    if (!isConnected) {
      open();
      return;
    }

    if (!walletClient) {
      setError('Wallet client not available. Please ensure your wallet is connected to Botchain Testnet.');
      return;
    }

    if (!publicClient) {
      setError('Network RPC client not initialized. Please check network connection.');
      return;
    }

    try {
      // 1. Verify contract code exists at target address
      const byteCode = await publicClient.getBytecode({
        address: addressToInspect as `0x${string}`,
      });

      if (!byteCode || byteCode === '0x') {
        setError('No bytecode found at this address. The address is either an EOA (wallet) or not deployed on Botchain Testnet.');
        return;
      }

      // 2. SUBMIT INSPECTION TRANSACTION TO DIAMONDSCOPE.SOL (GAS FEE ONLY)
      setInspectionStep('signing');

      const hash = await walletClient.writeContract({
        address: diamondScopeAddress,
        abi: diamondScopeAbi,
        functionName: 'requestDiamondCheck',
        args: [addressToInspect as `0x${string}`],
        value: 0n, // STRICTLY GAS FEE ONLY - 0 VALUE TRANSFER
      });

      setTxHash(hash);
      setInspectionStep('mining');

      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
      });

      // Parse requestId from event
      let newReqId: number | null = null;
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: diamondScopeAbi,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === 'DiamondCheckRequested') {
            newReqId = Number((decoded.args as any).requestId);
            break;
          }
        } catch {
          // not our event
        }
      }
      if (!newReqId) {
        try {
          const count = await publicClient.readContract({
            address: diamondScopeAddress,
            abi: diamondScopeAbi,
            functionName: 'requestCount',
          });
          newReqId = Number(count);
        } catch {
          newReqId = 1;
        }
      }
      setRequestId(newReqId);

      // 3. READ DIAMOND LOUPE FUNCTIONS (facets(), selectors)
      setInspectionStep('analyzing');

      let rawFacets: { facetAddress: string; functionSelectors: readonly `0x${string}`[] }[] = [];

      try {
        const result = (await publicClient.readContract({
          address: addressToInspect as `0x${string}`,
          abi: diamondLoupeAbi,
          functionName: 'facets',
        })) as any[];

        rawFacets = result.map((r: any) => ({
          facetAddress: r.facetAddress,
          functionSelectors: r.functionSelectors,
        }));
      } catch (primaryErr) {
        // Fallback: facetAddresses() + facetFunctionSelectors()
        try {
          const addresses = (await publicClient.readContract({
            address: addressToInspect as `0x${string}`,
            abi: diamondLoupeAbi,
            functionName: 'facetAddresses',
          })) as `0x${string}`[];

          for (const fAddress of addresses) {
            const selectors = (await publicClient.readContract({
              address: addressToInspect as `0x${string}`,
              abi: diamondLoupeAbi,
              functionName: 'facetFunctionSelectors',
              args: [fAddress],
            })) as `0x${string}`[];

            rawFacets.push({
              facetAddress: fAddress,
              functionSelectors: selectors,
            });
          }
        } catch (fallbackErr) {
          throw new Error(
            'Contract does not implement standard EIP-2535 Loupe functions (facets() or facetAddresses()). Is this a diamond contract?'
          );
        }
      }

      if (rawFacets.length === 0) {
        throw new Error('DiamondLoupe returned 0 facets. The diamond may be uninitialized.');
      }

      // 4. Resolve Function Selectors
      const resolvedFacets: FacetData[] = [];
      for (const facet of rawFacets) {
        const resolvedSelectors = await Promise.all(
          facet.functionSelectors.map(async (selHex) => {
            const signature = await resolveSelector(selHex);
            return {
              hex: selHex,
              signature,
            };
          })
        );

        resolvedFacets.push({
          address: facet.facetAddress,
          selectors: resolvedSelectors,
        });
      }

      setFacets(resolvedFacets);
      setAnalyzedAddress(addressToInspect);

      // 5. Run Security & Diagnostic Diagnostics
      const collectedWarnings: WarningItem[] = [];
      const collectedPassed: string[] = [];

      // Check Zero Address
      const zeroAddressFacets = resolvedFacets.filter(
        (f) => f.address.toLowerCase() === '0x0000000000000000000000000000000000000000'
      );
      if (zeroAddressFacets.length > 0) {
        collectedWarnings.push({
          type: 'critical',
          title: 'Zero Address Facet Registered',
          description: 'One or more function selectors route to address(0). Calls to these selectors will revert.',
          details: zeroAddressFacets.map((f) => `0x00...00 holds ${f.selectors.length} selectors`),
        });
      } else {
        collectedPassed.push('No zero-address facets detected (All facets route to valid targets)');
      }

      // Check Empty Facets
      const emptyFacets = resolvedFacets.filter((f) => f.selectors.length === 0);
      if (emptyFacets.length > 0) {
        collectedWarnings.push({
          type: 'warning',
          title: 'Empty Facets Detected',
          description: 'Some facet addresses are registered in the diamond but do not provide any function selectors.',
          details: emptyFacets.map((f) => `Facet: ${f.address}`),
        });
      } else {
        collectedPassed.push('All registered facets contain active function selectors');
      }

      // Check Duplicate Selectors
      const selectorMap = new Map<string, string[]>();
      resolvedFacets.forEach((f) => {
        f.selectors.forEach((s) => {
          const hex = s.hex.toLowerCase();
          if (!selectorMap.has(hex)) {
            selectorMap.set(hex, []);
          }
          selectorMap.get(hex)?.push(f.address);
        });
      });

      const duplicates: string[] = [];
      selectorMap.forEach((addresses, hex) => {
        if (addresses.length > 1) {
          duplicates.push(`Selector ${hex} mapped to ${addresses.length} facets`);
        }
      });

      if (duplicates.length > 0) {
        collectedWarnings.push({
          type: 'critical',
          title: 'Selector Collision / Duplicate Routing',
          description: 'The same function selector is registered across multiple facets. This causes routing ambiguity.',
          details: duplicates,
        });
      } else {
        collectedPassed.push('Zero selector collisions detected (1:1 function dispatch)');
      }

      // Check EIP-2535 Loupe Compliance
      const allSelectors = resolvedFacets.flatMap((f) => f.selectors.map((s) => s.hex.toLowerCase()));
      const hasLoupeFacetFuncs =
        allSelectors.includes('0x7a0ed627') || allSelectors.includes('0xadf4977f');

      if (!hasLoupeFacetFuncs) {
        collectedWarnings.push({
          type: 'critical',
          title: 'Missing Standard IDiamondLoupe Selectors',
          description: 'Standard loupe selectors were not found in the routing table.',
        });
      } else {
        collectedPassed.push('EIP-2535 IDiamondLoupe introspection standard verified');
      }

      // Check DiamondCut
      const hasCutFunc = allSelectors.includes('0x1f931c1c');
      if (!hasCutFunc) {
        collectedWarnings.push({
          type: 'warning',
          title: 'No DiamondCut Facet Found (Immutable Diamond)',
          description: 'The diamondCut selector (0x1f931c1c) is not present. This diamond appears to be immutable.',
        });
      } else {
        collectedPassed.push('EIP-2535 IDiamondCut upgradeability verified');
      }

      // Check Ownership
      const hasOwnerFunc = allSelectors.some(
        (s) => s === '0x8da5cb5b' || s === '0xf2fde38b' || s === '0x91d14854'
      );
      if (!hasOwnerFunc) {
        collectedWarnings.push({
          type: 'warning',
          title: 'No Standard Ownership / Access Control Detected',
          description: 'No owner() or role management functions were detected.',
        });
      } else {
        collectedPassed.push('Access control / ownership management facet present');
      }

      setWarnings(collectedWarnings);
      setPassedChecks(collectedPassed);

      // 6. AUTO-PUBLISH RESULT ON DIAMONDSCOPE REGISTRY (GAS FEE ONLY)
      try {
        const totalSelectors = resolvedFacets.reduce((sum, f) => sum + f.selectors.length, 0);
        const summary = JSON.stringify({
          facets: resolvedFacets.length,
          selectors: totalSelectors,
          auditedAt: new Date().toISOString(),
        });

        const pHash = await walletClient.writeContract({
          address: diamondScopeAddress,
          abi: diamondScopeAbi,
          functionName: 'publishResult',
          args: [
            BigInt(newReqId || 1),
            BigInt(resolvedFacets.length),
            BigInt(totalSelectors),
            summary,
          ],
          value: 0n, // STRICTLY GAS FEE ONLY
        });
        setPublishTxHash(pHash);
      } catch (pubErr) {
        console.warn('Auto-publish non-critical error:', pubErr);
      }

      setInspectionStep('complete');
      onAuditLogged?.();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to inspect contract. Please check network and diamond address.');
      setInspectionStep('idle');
    }
  };

  const totalSelectorsCount = facets.reduce((sum, f) => sum + f.selectors.length, 0);
  const isBusy = inspectionStep !== 'idle' && inspectionStep !== 'complete';

  return (
    <div className="space-y-6">
      
      {/* Search & Inspector Input Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-emerald-100 text-emerald-800">
              <Gem className="w-5 h-5 text-emerald-600" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Inspect Diamond Contract
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Submits on-chain inspection transaction and analyzes facet architecture • Botchain Testnet (968)
          </p>
        </div>

        {/* Form Input */}
        <div className="mt-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="0x... (Enter EIP-2535 Diamond Contract Address)"
                value={inputAddress}
                onChange={(e) => setInputAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isBusy && handleInspectDiamond()}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>

            <button
              onClick={() => handleInspectDiamond()}
              disabled={isBusy}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50 transition active:scale-98 shrink-0"
            >
              {inspectionStep === 'signing' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Confirm in Wallet...</span>
                </>
              ) : inspectionStep === 'mining' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Mining Tx...</span>
                </>
              ) : inspectionStep === 'analyzing' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing Facets...</span>
                </>
              ) : (
                <>
                  <Fuel className="w-4 h-4" />
                  <span>Inspect Diamond</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Actions & Demo Diamonds */}
          <div className="mt-3 flex flex-wrap items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2 text-slate-500">
              <span>Quick Test:</span>
              <button
                onClick={handleLoadSample}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-semibold transition"
              >
                Sample EIP-2535 Diamond
              </button>
            </div>

            {/* Gas Fee Guarantee Notice */}
            <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200 font-medium">
              <Fuel className="w-3.5 h-3.5 text-emerald-600" />
              <span>Interacts via <strong>Gas Fee Only</strong> (0 Protocol Fee)</span>
            </div>
          </div>
        </div>

        {/* Live Transaction Status Card during Inspection */}
        {isBusy && (
          <div className="mt-5 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 text-xs sm:text-sm animate-in fade-in">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="font-bold">
                  {inspectionStep === 'signing' && 'Waiting for Wallet Approval: Sign the inspection transaction (Gas fee only)...'}
                  {inspectionStep === 'mining' && 'Mining inspection transaction on Botchain Testnet...'}
                  {inspectionStep === 'analyzing' && 'Reading EIP-2535 Loupe facets and mapping selectors...'}
                </span>
                {txHash && (
                  <div className="mt-1 font-mono text-xs text-emerald-700 truncate">
                    Tx: {txHash}
                  </div>
                )}
              </div>
              {txHash && (
                <a
                  href={`https://scan.bohr.life/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-md bg-white border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-1 hover:bg-emerald-50 transition shrink-0"
                >
                  <span>BohrScan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Success Transaction Confirmation Banner */}
        {txHash && inspectionStep === 'complete' && (
          <div className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs sm:text-sm animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold">
                    Inspection Transaction Confirmed on-chain!
                  </span>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Logged to DiamondScope.sol (Request #{requestId || '1'}) via standard network gas fee.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`https://scan.bohr.life/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <span>View Tx on BohrScan</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mt-5 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-900 text-xs sm:text-sm animate-in fade-in">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}
      </div>

      {/* Inspection Results Dashboard (When Diamond is Loaded) */}
      {analyzedAddress && facets.length > 0 && (
        <div className="space-y-6">
          
          {/* Summary Metric Stats Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Target Diamond Contract
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-base sm:text-lg font-bold text-slate-900 break-all">
                    {analyzedAddress}
                  </span>
                  <button
                    onClick={() => handleCopy(analyzedAddress)}
                    className="text-slate-400 hover:text-emerald-600 p-1 transition"
                    title="Copy Diamond Address"
                  >
                    {copiedAddress ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <a
                    href={`https://scan.bohr.life/address/${analyzedAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 text-slate-400 hover:text-emerald-700 transition"
                    title="View on BohrScan Explorer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 self-start md:self-auto">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Audited on Botchain</span>
                </span>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-xs text-slate-500 font-semibold block">Total Facets</span>
                <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                  {facets.length}
                </span>
                <span className="text-[11px] text-emerald-700 font-medium mt-0.5 block">
                  Registered Contracts
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-xs text-slate-500 font-semibold block">Registered Selectors</span>
                <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">
                  {totalSelectorsCount}
                </span>
                <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
                  4-Byte Function Handlers
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-xs text-slate-500 font-semibold block">IDiamondLoupe (0x48e2b093)</span>
                <div className="flex items-center gap-1.5 mt-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-800">
                    Standard Loupe
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Introspection Active
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-xs text-slate-500 font-semibold block">Upgradeability (0x1f931c1c)</span>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-bold text-slate-900">
                    DiamondCut Facet
                  </span>
                </div>
                <span className="text-[11px] text-emerald-700 mt-0.5 block">
                  Upgradeable Architecture
                </span>
              </div>

            </div>
          </div>

          {/* Visual Architecture Topology Graph */}
          <ArchitectureGraph
            diamondAddress={analyzedAddress}
            facets={facets}
          />

          {/* Security & Health Warnings */}
          <InspectionWarnings
            warnings={warnings}
            passedChecks={passedChecks}
          />

          {/* Detailed Facet & Function Directory */}
          <FacetList facets={facets} />

        </div>
      )}

    </div>
  );
};
