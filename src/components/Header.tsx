import React from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { ExternalLink, ShieldCheck, AlertTriangle, Fuel } from 'lucide-react';
import { botchainMainnet, botchainTestnet } from '../config/wagmi';

export const Header: React.FC = () => {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const isMainnet = chainId === botchainMainnet.id;
  const isSupported = chainId === botchainMainnet.id || chainId === botchainTestnet.id;
  const isWrongNetwork = isConnected && !isSupported;

  const currentExplorer = isMainnet ? 'https://scan.botchain.ai/' : 'https://scan.bohr.life/';
  const currentNetworkName = isMainnet ? 'Botchain Mainnet' : chainId === botchainTestnet.id ? 'Botchain Testnet' : 'Botchain';
  const currentChainId = isMainnet ? '#677' : chainId === botchainTestnet.id ? '#968' : '';

  return (
    <header className="bg-white border-b border-emerald-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand (DiamondScope Official Logo) */}
          <div className="flex items-center gap-3">
            <img
              src="/diamondscope-logo.svg"
              alt="DiamondScope Logo"
              className="w-11 h-11 rounded-xl shadow-md ring-2 ring-emerald-200 object-contain hover:scale-105 transition-transform"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold tracking-tight text-slate-900">
                  Diamond<span className="text-emerald-600">Scope</span>
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  EIP-2535
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Diamond Facet Architecture Inspector & Diagnostic Registry
              </p>
            </div>
          </div>

          {/* Network & Interaction Badges with Official Botchain Logo */}
          <div className="hidden md:flex items-center gap-3 text-xs">
            {/* Official Botchain Website Link with Logo */}
            <a
              href="https://botchain.ai"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-800 transition-colors shadow-2xs"
              title="Official Botchain Website"
            >
              <img
                src="/botchain-logo.png"
                alt="Botchain Official Logo"
                className="w-4 h-4 rounded-full object-contain shrink-0"
              />
              <span className="font-semibold">botchain.ai</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            {/* Official Botchain Explorer Badge with Logo */}
            <a
              href={currentExplorer}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              <img
                src="/botchain-logo.png"
                alt="Botchain Official Logo"
                className="w-4 h-4 rounded-full object-contain shrink-0"
              />
              <span className="font-semibold">{currentNetworkName}</span>
              <span className="text-emerald-600 font-mono">{currentChainId}</span>
              <ExternalLink className="w-3 h-3 text-emerald-500 ml-0.5" />
            </a>

            {/* Zero Protocol Fee Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
              <Fuel className="w-3.5 h-3.5 text-emerald-600" />
              <span>Gas Fee Only</span>
              <span className="font-semibold text-emerald-700">(0 Fee)</span>
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center gap-3">
            {isWrongNetwork && (
              <button
                onClick={() => switchChain?.({ chainId: botchainMainnet.id })}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <AlertTriangle className="w-4 h-4" />
                Switch to Mainnet (677)
              </button>
            )}

            {isConnected ? (
              <button
                onClick={() => open()}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border-2 border-emerald-500 rounded-xl text-sm font-semibold shadow-sm transition"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="font-mono">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
                </span>
              </button>
            ) : (
              <button
                onClick={() => open()}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/25 transition active:scale-95"
              >
                <ShieldCheck className="w-4 h-4" />
                Connect Wallet
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
