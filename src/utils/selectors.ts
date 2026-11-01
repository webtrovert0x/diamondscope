// Offline database of standard selectors (Diamond, ERC, Ownership)
export const KNOWN_SELECTORS: Record<string, string> = {
  // EIP-2535 IDiamondLoupe
  '0x7a0ed627': 'facets()',
  '0xadf4977f': 'facetFunctionSelectors(address)',
  '0x52f0bee0': 'facetAddresses()',
  '0xcdffacc6': 'facetAddress(bytes4)',
  
  // EIP-2535 IDiamondCut
  '0x1f931c1c': 'diamondCut((address,uint8,bytes4[])[],address,bytes)',

  // ERC-165
  '0x01ffc9a7': 'supportsInterface(bytes4)',

  // Ownership & Access
  '0x8da5cb5b': 'owner()',
  '0xf2fde38b': 'transferOwnership(address)',
  '0x715018a6': 'renounceOwnership()',
  '0x248a9ca3': 'getRoleAdmin(bytes32)',
  '0x2f2ff15d': 'grantRole(bytes32,address)',
  '0xd547741f': 'revokeRole(bytes32,address)',
  '0x91d14854': 'hasRole(bytes32,address)',

  // ERC-20
  '0x06fdde03': 'name()',
  '0x95d89b41': 'symbol()',
  '0x313ce567': 'decimals()',
  '0x18160ddd': 'totalSupply()',
  '0x70a08231': 'balanceOf(address)',
  '0xa9059cbb': 'transfer(address,uint256)',
  '0xdd62ed3e': 'allowance(address,address)',
  '0x095ea7b3': 'approve(address,uint256)',
  '0x23b872dd': 'transferFrom(address,address,uint256)',

  // ERC-721
  '0x6352211e': 'ownerOf(uint256)',
  '0x42842e0e': 'safeTransferFrom(address,address,uint256)',
  '0xb88d4fde': 'safeTransferFrom(address,address,uint256,bytes)',
  '0x081812fc': 'getApproved(uint256)',
  '0xa22cb465': 'setApprovalForAll(address,bool)',
  '0xe985e9c5': 'isApprovedForAll(address,address)',
  '0xc87b56dd': 'tokenURI(uint256)',

  // ERC-1155
  '0x00fdd58e': 'balanceOf(address,uint256)',
  '0x4e1273f4': 'balanceOfBatch(address[],uint256[])',
  '0xf242432a': 'safeTransferFrom(address,address,uint256,uint256,bytes)',
  '0x2eb2c2d6': 'safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)',
  '0x0e89341c': 'uri(uint256)',

  // Pausable
  '0x5c975abb': 'paused()',
  '0x8456cb59': 'pause()',
  '0x3f4ba83a': 'unpause()',

  // Sample Vault / Business functions
  '0xd0e30db0': 'deposit()',
  '0x2e1a7d4d': 'withdraw(uint256)',
  '0xbb45d15a': 'getVaultBalance(address)',
  '0x29efcf70': 'getTotalDeposited()',
  '0x6eb7e793': 'isVaultPaused()',

  // DiamondScope
  '0x54e22137': 'requestDiamondCheck(address)',
  '0x72688082': 'publishResult(uint256,uint256,uint256,string)',
  '0x6bc4d7aa': 'getRequest(uint256)',
  '0x46ea245b': 'getRecentRequests(uint256)',
};

const cache: Record<string, string> = { ...KNOWN_SELECTORS };

/**
 * Resolves a 4-byte selector to human-readable signature.
 */
export async function resolveSelector(selectorHex: string): Promise<string> {
  const normalized = selectorHex.toLowerCase().trim();
  if (cache[normalized]) {
    return cache[normalized];
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`https://api.openchain.xyz/signature-database/v1/lookup?function=${normalized}&filter=true`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    
    if (res.ok) {
      const data = await res.json();
      if (data.result?.function?.[normalized]?.[0]?.name) {
        const name = data.result.function[normalized][0].name;
        cache[normalized] = name;
        return name;
      }
    }
  } catch (err) {
    // Graceful fallback to hex
  }

  cache[normalized] = `unknown_${normalized.slice(0, 10)}`;
  return cache[normalized];
}

/**
 * Determine facet classification / category based on its function selectors
 */
export function classifyFacet(selectors: string[]): {
  category: 'loupe' | 'cut' | 'ownership' | 'token' | 'business';
  label: string;
  badgeColor: string;
} {
  const norm = selectors.map((s) => s.toLowerCase());

  if (norm.some((s) => s === '0x7a0ed627' || s === '0xadf4977f' || s === '0x52f0bee0' || s === '0xcdffacc6')) {
    return {
      category: 'loupe',
      label: 'Diamond Loupe',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    };
  }

  if (norm.some((s) => s === '0x1f931c1c')) {
    return {
      category: 'cut',
      label: 'Diamond Cut',
      badgeColor: 'bg-green-100 text-green-800 border-green-300',
    };
  }

  if (norm.some((s) => s === '0x8da5cb5b' || s === '0xf2fde38b' || s === '0x715018a6' || s === '0x91d14854')) {
    return {
      category: 'ownership',
      label: 'Access & Ownership',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
    };
  }

  if (norm.some((s) => s === '0x18160ddd' || s === '0x70a08231' || s === '0xa9059cbb' || s === '0x6352211e')) {
    return {
      category: 'token',
      label: 'Token Standard',
      badgeColor: 'bg-lime-100 text-lime-800 border-lime-300',
    };
  }

  return {
    category: 'business',
    label: 'Business Logic',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
}

