import React from "react";
import { getProvider, connect as wcConnect, switchNetwork } from "../lib/wc";
import { BrowserProvider } from "ethers";
import { useWeb3 } from "../lib/Web3Provider";

export default function ConnectWallet() {
  const { state, setState } = useWeb3();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const connect = async () => {
    try {
      setBusy(true); setError(null);
      const projectId = import.meta.env.VITE_REOWN_PROJECT_ID as string;
      const eip1193 = await wcConnect(projectId, state.selectedChainId);
      // ensure selected network
      await switchNetwork(eip1193, state.selectedChainId);
      const provider = new BrowserProvider(eip1193 as any);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      const chainIdHex: string = await eip1193.request({ method: "eth_chainId" }) as any;
      const chainId = parseInt(chainIdHex, 16);
      setState((s) => ({ ...s, address: addr, chainId, provider, eip1193: eip1193 as any }));
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to connect");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button onClick={connect} disabled={busy} style={{ background: "#111827", color: "#fff", padding: "8px 12px", borderRadius: 8 }}>
        {busy ? "Connecting…" : state.address ? "Connected" : "Connect Wallet"}
      </button>
      {state.address && <span style={{ marginLeft: 12, fontSize: 12, color: "#475569" }}>{state.address}</span>}
      {error && <p style={{ color: "#b91c1c", fontSize: 12, marginTop: 8 }}>{error}</p>}
    </div>
  );
}
