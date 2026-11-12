export const getExplorerBaseUrl = (chainId?: number): string => {
  if (chainId === 968) {
    return 'https://scan.bohr.life';
  }
  return 'https://scan.botchain.ai';
};

export const getExplorerAddressUrl = (address: string, chainId?: number): string => {
  return `${getExplorerBaseUrl(chainId)}/address/${address}`;
};

export const getExplorerTxUrl = (txHash: string, chainId?: number): string => {
  return `${getExplorerBaseUrl(chainId)}/tx/${txHash}`;
};

