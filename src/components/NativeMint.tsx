import React from "react";
import { Contract } from "ethers";
import { useWeb3 } from "../lib/Web3Provider";
import { CHAINS } from "../lib/wc";

const CONTRACT_ADDRESS = "0x113f1db516794c687A5b79d5b8Fd3399c79DB4c5";

const CANDIDATE_FRAGMENTS = [
  "function mint(address to)",
  "function safeMint(address to)",
  "function mint(address to, uint256 tokenId)",
  "function mintTo(address to, string uri)",
  "function safeMint(address to, string uri)",
];

export default function NativeMint() {
  const { state } = useWeb3();
  const [status, setStatus] = React.useState<string>("");
  const [txHash, setTxHash] = React.useState<string | null>(null);

  const onMint = async () => {
    try {
      setStatus("Preparing tx…"); setTxHash(null);
      if (!state.provider || !state.address) {
        alert("Please connect your wallet first."); return;
      }
      if (!state.chainId || !(state.chainId in CHAINS)) {
        alert("Please switch to Base or Base Sepolia."); return;
      }
      const signer = await state.provider.getSigner();
      let lastErr: any = null;

      for (const frag of CANDIDATE_FRAGMENTS) {
        try {
          const abi = [frag];
          const c = new Contract(CONTRACT_ADDRESS, abi, signer);
          const fn = frag.split(" ")[1].split("(")[0];
          let tx;
          if (frag.includes("(address to, string uri)") || frag.includes("(address to,string uri)")) {
            tx = await (c as any)[fn](state.address, window.location.origin + "/placeholder.png");
          } else if (frag.includes("(address to, uint256 tokenId)") || frag.includes("(address,uint256)")) {
            tx = await (c as any)[fn](state.address, 1);
          } else {
            tx = await (c as any)[fn](state.address);
          }
          setStatus("Waiting for confirmation…");
          const receipt = await tx.wait();
          setTxHash(receipt.hash || tx.hash);
          setStatus("Minted ✅");
          return;
        } catch (err) {
          lastErr = err;
        }
      }
      console.error("All ABI candidates failed. Last error:", lastErr);
      setStatus("Mint failed. Please provide ABI or correct mint signature.");
      alert("Mint failed. Provide ABI / exact mint() signature for this contract.");
    } catch (e: any) {
      console.error(e);
      setStatus("Mint failed.");
      alert(e?.message || "Mint failed.");
    }
  };

  return (
    <div>
      <button onClick={onMint} style={{ background: "#2563eb", color: "#fff", padding: "10px 14px", borderRadius: 8 }}>Mint NFT</button>
      {status && <p style={{ marginTop: 8, fontSize: 13, color: "#475569" }}>{status}</p>}
      {txHash && state.chainId && (
        <p style={{ marginTop: 8 }}>
          Tx: <a href={`${CHAINS[state.chainId].explorer}/tx/${txHash}`} target="_blank" rel="noreferrer">{txHash}</a>
        </p>
      )}
    </div>
  );
}
