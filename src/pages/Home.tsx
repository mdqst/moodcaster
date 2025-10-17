import React from "react";
import QRCode from "react-qr-code";
import NativeMint from "../components/NativeMint";

export default function Home() {
  const eventId = "event-001";
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://example.com";
  const eventUrl = `${baseUrl}/mint?event=${eventId}`;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: 32 }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600 }}>BaseProof — WalletConnect + Network Switch</h1>
        <p style={{ color: "#475569" }}>Connect your wallet, choose a network (Base / Base Sepolia), then mint.</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <section style={{ background: "#fff", padding: 16, borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>QR</h2>
          <div style={{ display: "flex", justifyContent: "center", padding: 12 }}>
            <QRCode value={eventUrl} size={200} />
          </div>
          <p style={{ fontSize: 12, color: "#64748b", wordBreak: "break-all" }}>{eventUrl}</p>
        </section>

        <section style={{ background: "#fff", padding: 16, borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Mint</h2>
          <p style={{ fontSize: 14, color: "#475569" }}>Calls a common mint() signature on your contract.</p>
          <div style={{ marginTop: 12 }}>
            <NativeMint />
          </div>
        </section>
      </div>
    </div>
  );
}
