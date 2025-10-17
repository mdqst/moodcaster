import React from "react";
import { useWeb3 } from "../lib/Web3Provider";
import { CHAINS } from "../lib/wc";

export default function Profile() {
  const { state } = useWeb3();
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>Profile</h1>
      {!state.address ? (
        <p>Please connect your wallet to view details.</p>
      ) : (
        <div style={{ background: "#fff", padding: 16, borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <p style={{ marginBottom: 8 }}><strong>Address:</strong> {state.address}</p>
          {state.chainId && <p><strong>Chain:</strong> {CHAINS[state.chainId]?.name || state.chainId}</p>}
        </div>
      )}
    </div>
  );
}
