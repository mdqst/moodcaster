import EthereumProvider from "@walletconnect/ethereum-provider";

export const BASE_MAINNET_ID = 8453;
export const BASE_MAINNET_HEX = "0x2105";
export const BASE_SEPOLIA_ID = 84532;
export const BASE_SEPOLIA_HEX = "0x14A74";

export type ChainMeta = {
  id: number;
  hex: string;
  name: string;
  rpc: string;
  explorer: string;
  currency: { name: string; symbol: string; decimals: number };
};

export const CHAINS: Record<number, ChainMeta> = {
  [BASE_SEPOLIA_ID]: {
    id: BASE_SEPOLIA_ID,
    hex: BASE_SEPOLIA_HEX,
    name: "Base Sepolia",
    rpc: "https://sepolia.base.org",
    explorer: "https://sepolia.basescan.org",
    currency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  [BASE_MAINNET_ID]: {
    id: BASE_MAINNET_ID,
    hex: BASE_MAINNET_HEX,
    name: "Base",
    rpc: "https://mainnet.base.org",
    explorer: "https://basescan.org",
    currency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
};

let _provider: any = null;

export async function getProvider(projectId: string, defaultChainId: number) {
  if (_provider) return _provider;

  const rpcMap: Record<number, string> = {};
  Object.values(CHAINS).forEach((c) => (rpcMap[c.id] = c.rpc));

  _provider = await EthereumProvider.init({
    projectId,
    chains: [defaultChainId],
    optionalChains: [BASE_MAINNET_ID, BASE_SEPOLIA_ID],
    rpcMap,
    showQrModal: true,
    metadata: {
      name: "BaseProof",
      description: "WalletConnect + Network Switch",
      url: typeof window !== "undefined" ? window.location.origin : "https://example.com",
      icons: ["https://walletconnect.com/meta/favicon.ico"],
    },
  });

  return _provider;
}

export async function connect(projectId: string, defaultChainId: number) {
  const provider = await getProvider(projectId, defaultChainId);
  if (provider.session && provider.session.accounts.length > 0) return provider;
  await provider.connect();
  return provider;
}

export async function switchNetwork(provider: any, chainId: number) {
  const meta = CHAINS[chainId];
  if (!meta) throw new Error("Unsupported chain");
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: meta.hex }],
    });
  } catch (err: any) {
    if (err?.code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: meta.hex,
          chainName: meta.name,
          nativeCurrency: meta.currency,
          rpcUrls: [meta.rpc],
          blockExplorerUrls: [meta.explorer],
        }],
      });
    } else {
      throw err;
    }
  }
}
