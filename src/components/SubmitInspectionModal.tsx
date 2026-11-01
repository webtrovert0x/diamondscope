import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { X, CheckCircle2, AlertCircle, Fuel, ExternalLink, Loader2, ArrowRight } from 'lucide-react';
import { diamondScopeAbi } from '../contracts/diamondScopeAbi';
import deploymentInfo from '../contracts/diamondScopeAddress.json';

interface SubmitInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  diamondAddress: string;
  facetCount: number;
  selectorCount: number;
  onSuccess: () => void;
}

export const SubmitInspectionModal: React.FC<SubmitInspectionModalProps> = ({
  isOpen,
  onClose,
  diamondAddress,
  facetCount,
  selectorCount,
  onSuccess,
}) => {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [step, setStep] = useState<'request' | 'publishing' | 'complete'>('request');
  const [recordedRequestId, setRecordedRequestId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const contractAddress = (deploymentInfo.address ||
    (typeof process !== 'undefined' && process.env?.DIAMONDSCOPE_CONTRACT_ADDRESS)) as `0x${string}`;

  // 1. Transaction to call requestDiamondCheck
  const {
    writeContract: submitRequest,
    data: requestTxHash,
    isPending: isRequestPending,
    error: requestError,
  } = useWriteContract();

  // 2. Transaction to call publishResult
  const {
    writeContract: submitPublish,
    data: publishTxHash,
    isPending: isPublishPending,
    error: publishError,
  } = useWriteContract();

  // Wait for Request Tx
  const { isLoading: isRequestTxLoading, isSuccess: isRequestTxSuccess } =
    useWaitForTransactionReceipt({
      hash: requestTxHash,
    });

  // Wait for Publish Tx
  const { isLoading: isPublishTxLoading, isSuccess: isPublishTxSuccess } =
    useWaitForTransactionReceipt({
      hash: publishTxHash,
    });

  if (!isOpen) return null;

  // Handle Step 1: Submit requestDiamondCheck
  const handleRequestCheck = async () => {
    setErrorMessage(null);
    try {
      submitRequest({
        address: contractAddress,
        abi: diamondScopeAbi,
        functionName: 'requestDiamondCheck',
        args: [diamondAddress as `0x${string}`],
        value: 0n, // STRICTLY GAS FEE ONLY - 0 VALUE TRANSFER
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Transaction submission failed');
    }
  };

  // Handle Step 2: Submit publishResult
  const handlePublishResult = async () => {
    setErrorMessage(null);
    try {
      // Query recent requests or requestCount from contract
      let reqId = recordedRequestId;
      if (!reqId && publicClient) {
        try {
          const reqCount = await publicClient.readContract({
            address: contractAddress,
            abi: diamondScopeAbi,
            functionName: 'requestCount',
          });
          reqId = Number(reqCount);
        } catch {
          reqId = 1;
        }
      }

      const summary = JSON.stringify({
        facets: facetCount,
        selectors: selectorCount,
        auditedAt: new Date().toISOString(),
      });

      submitPublish({
        address: contractAddress,
        abi: diamondScopeAbi,
        functionName: 'publishResult',
        args: [BigInt(reqId || 1), BigInt(facetCount), BigInt(selectorCount), summary],
        value: 0n, // STRICTLY GAS FEE ONLY - 0 VALUE TRANSFER
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Publishing inspection result failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              💎
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Record Inspection On-Chain</h3>
              <p className="text-xs text-slate-500">DiamondScope.sol • Botchain Testnet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice on Gas Fee Only */}
        <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-900">
          <Fuel className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold">Gas Fee Only:</span> Zero protocol fee is charged. Transactions strictly consume standard network gas in BOT.
          </div>
        </div>

        {/* Audit Details */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Target Diamond:</span>
            <span className="font-mono font-semibold text-slate-900 break-all text-right max-w-[240px]">
              {diamondAddress}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Discovered Facets:</span>
            <span className="font-bold text-slate-900">{facetCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Registered Selectors:</span>
            <span className="font-bold text-slate-900">{selectorCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">DiamondScope Registry:</span>
            <span className="font-mono font-semibold text-emerald-700">
              {contractAddress.slice(0, 8)}...{contractAddress.slice(-6)}
            </span>
          </div>
        </div>

        {/* Progress / Step UI */}
        <div className="mt-5 space-y-3">
          
          {/* Step 1: Request Check */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900">Step 1: Request Diamond Check</span>
                <p className="text-[11px] text-slate-500">
                  Calls <code className="text-emerald-700 font-mono">requestDiamondCheck(address)</code>
                </p>
              </div>

              {isRequestTxSuccess ? (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" /> Confirmed
                </span>
              ) : isRequestTxLoading || isRequestPending ? (
                <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
                  <Loader2 className="w-4 h-4 animate-spin" /> Mining...
                </span>
              ) : (
                <button
                  onClick={handleRequestCheck}
                  disabled={!isConnected}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition"
                >
                  Submit Tx
                </button>
              )}
            </div>

            {requestTxHash && (
              <a
                href={`https://scan.bohr.life/tx/${requestTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <span>View Request Tx on BohrScan</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Step 2: Publish Result (Available once step 1 confirms) */}
          <div
            className={`p-3.5 rounded-xl border transition ${
              isRequestTxSuccess ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200 bg-slate-50 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900">Step 2: Publish Architecture Result</span>
                <p className="text-[11px] text-slate-500">
                  Calls <code className="text-emerald-700 font-mono">publishResult(requestId, ...)</code>
                </p>
              </div>

              {isPublishTxSuccess ? (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" /> Published
                </span>
              ) : isPublishTxLoading || isPublishPending ? (
                <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
                  <Loader2 className="w-4 h-4 animate-spin" /> Mining...
                </span>
              ) : (
                <button
                  onClick={handlePublishResult}
                  disabled={!isRequestTxSuccess}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition"
                >
                  Publish Tx
                </button>
              )}
            </div>

            {publishTxHash && (
              <a
                href={`https://scan.bohr.life/tx/${publishTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <span>View Publish Tx on BohrScan</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

        </div>

        {/* Errors */}
        {(errorMessage || requestError || publishError) && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="break-all">
              {errorMessage || requestError?.message || publishError?.message}
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={() => {
              if (isPublishTxSuccess) {
                onSuccess();
              }
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
          >
            {isPublishTxSuccess ? 'Done' : 'Cancel'}
          </button>
        </div>

      </div>
    </div>
  );
};

