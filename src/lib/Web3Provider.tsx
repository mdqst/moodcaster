import React from "react";
import { BrowserProvider } from "ethers";
import type { Eip1193Provider } from "ethers";
import { BASE_SEPOLIA_ID } from "./wc";

type Web3State = {
  address: string | null;
  chainId: number | null;
  selectedChainId: number; // UI-selected
  provider: BrowserProvider | null;
  eip1193: Eip1193Provider | null;
};

const Ctx = React.createContext<{
  state: Web3State;
  setState: React.Dispatch<React.SetStateAction<Web3State>>;
} | null>(null);

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<Web3State>({
    address: null,
    chainId: null,
    selectedChainId: BASE_SEPOLIA_ID, // default
    provider: null,
    eip1193: null,
  });

  return <Ctx.Provider value={{ state, setState }}>{children}</Ctx.Provider>;
}

export function useWeb3() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useWeb3 must be used within Web3Provider");
  return ctx;
}
