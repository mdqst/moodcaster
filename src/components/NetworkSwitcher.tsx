import React from "react";
import { useWeb3 } from "../lib/Web3Provider";
import { CHAINS, switchNetwork } from "../lib/wc";

export default function NetworkSwitcher() {
  const { state, setState } = useWeb3();

  const onChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const target = parseInt(e.target.value, 10);
    setState((s) => ({ ...s, selectedChainId: target }));
    if (state.eip1193) {
      try {
        await switchNetwork(state.eip1193, target);
        const hex: string = await state.eip1193.request({ method: "eth_chainId" }) as any;
        setState((s) => ({ ...s, chainId: parseInt(hex, 16) }));
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, color: "#475569" }}>Network:</span>
      <select value={state.selectedChainId} onChange={onChange} style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #e5e7eb" }}>
        {Object.values(CHAINS).map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </label>
  );
}
