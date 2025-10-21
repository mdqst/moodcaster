import { sdk } from "https://esm.sh/@farcaster/miniapp-sdk@0.1.10";
import * as viem from "https://esm.sh/viem@2.12.3";
import { createAppKit } from "https://cdn.jsdelivr.net/npm/@reown/appkit@1.8.10/+esm";
import { base } from "https://cdn.jsdelivr.net/npm/@reown/appkit/networks@1.8.10/+esm";

const CONTRACT_ADDRESS = "0x56043447bef8a243f16d9fd88ce00c4f14837778";
const BASE_CHAIN_ID_HEX = "0x2105"; // Base Mainnet
const EMOJIS = ["😊", "😐", "😢", "😡", "🤩"];
const REOWN_PROJECT_ID = "169bbbc4ed82469ef09184744a7bcb4f";

const MOOD_ABI = [
  {
    type: "function",
    name: "setMood",
    stateMutability: "nonpayable",
    inputs: [
      { name: "user", type: "address" },
      { name: "emojiId", type: "uint256" }
    ],
    outputs: []
  }
];

const state = { provider: null, account: null, chainId: null, isInMiniApp: false, appKit: null };
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

function toast(msg, t = 3000, type = "info") {
  const el = $("#toast");
  el.textContent = msg;
  el.className = `toast ${type}`;
  if (t) setTimeout(() => (el.className = "toast"), t);
}

function shortAddr(a) { return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—"; }
function setBadges() {
  $("#fc-indicator").textContent = state.isInMiniApp ? "Farcaster" : "Web";
  $("#network").textContent = state.chainId ? `Chain ${parseInt(state.chainId, 16)}` : "Chain –";
  $("#account").textContent = state.account ? shortAddr(state.account) : "Account –";
}

async function initReown() {
  if (state.appKit) return state.appKit;
  state.appKit = createAppKit({
    projectId: REOWN_PROJECT_ID,
    networks: [base],
    defaultNetwork: base,
    features: { analytics: false }
  });
  return state.appKit;
}

async function getProvider() {
  try {
    const isIn = await sdk.isInMiniApp();
    state.isInMiniApp = !!isIn;
    if (isIn) {
      const p = await sdk.wallet.getEthereumProvider();
      if (p) return p;
    }
  } catch {}
  if (state.appKit?.getWalletProvider) {
    const p = state.appKit.getWalletProvider();
    if (p) return p;
  }
  return null;
}

async function ensureConnected() {
  state.provider = await getProvider();
  if (!state.provider) {
    const appKit = await initReown();
    await appKit.open();
    state.provider = await getProvider();
  }
  if (!state.provider) throw new Error("No provider found. Try Reown or Farcaster!");
  const accounts = await state.provider.request({ method: "eth_requestAccounts" });
  state.account = accounts?.[0] || null;
  state.chainId = await state.provider.request({ method: "eth_chainId" });
  setBadges();
}

async function ensureBaseNetwork() {
  if (state.chainId === BASE_CHAIN_ID_HEX) return;
  try {
    await state.provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: BASE_CHAIN_ID_HEX }] });
  } catch {
    await state.provider.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: BASE_CHAIN_ID_HEX,
        chainName: "Base Mainnet",
        nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
        rpcUrls: ["https://mainnet.base.org"],
        blockExplorerUrls: ["https://basescan.org"]
      }]
    });
  }
  state.chainId = await state.provider.request({ method: "eth_chainId" });
  if (state.chainId !== BASE_CHAIN_ID_HEX) throw new Error("Failed to switch to Base");
  setBadges();
}

async function sendMoodTx(emojiId) {
  await ensureConnected();
  await ensureBaseNetwork();
  const { encodeFunctionData, getAddress } = viem;
  const user = getAddress(state.account);
  const data = encodeFunctionData({ abi: MOOD_ABI, functionName: "setMood", args: [user, BigInt(emojiId)] });
  const tx = { from: user, to: CONTRACT_ADDRESS, data };
  toast("Sending transaction… confirm in wallet.", 4000);
  const hash = await state.provider.request({ method: "eth_sendTransaction", params: [tx] });
  toast(`Transaction sent: ${hash.slice(0, 10)}…`, 4000, "success");
  bumpLocalStats(emojiId);
}

function todayKey() { return new Date().toISOString().slice(0, 10); }
function bumpLocalStats(id) {
  const key = `mood-stats:${todayKey()}`;
  const data = JSON.parse(localStorage.getItem(key) || "{}");
  data[id] = (data[id] || 0) + 1;
  localStorage.setItem(key, JSON.stringify(data));
  renderStats();
}
function renderStats() {
  const data = JSON.parse(localStorage.getItem(`mood-stats:${todayKey()}`) || "{}");
  let top = -1, topId = null;
  for (let i = 0; i < 5; i++) {
    const v = data[i] || 0; $(`#c${i}`).textContent = v;
    if (v > top) { top = v; topId = i; }
  }
  $("#top-today").textContent = top > 0 ? `Today's winner: ${EMOJIS[topId]} (${top})` : "No data yet for today";
}

function wireUI() {
  $$("#moods button").forEach((b) => {
    b.addEventListener("click", async () => {
      const id = parseInt(b.dataset.id, 10);
      try { b.disabled = true; await sendMoodTx(id); }
      catch (e) { toast(e.message || "Transaction failed", 5000, "error"); }
      finally { b.disabled = false; }
    });
  });
  $("#connectBtn").addEventListener("click", async () => {
    try { await ensureConnected(); toast("Wallet connected", 2000, "success"); }
    catch (e) { toast(e.message || "Connection failed", 5000, "error"); }
  });
}

async function boot() {
  renderStats(); setBadges(); wireUI();
  try {
    state.isInMiniApp = await sdk.isInMiniApp();
    if (state.isInMiniApp) {
      state.provider = await sdk.wallet.getEthereumProvider();
      if (state.provider) {
        const acc = await state.provider.request({ method: "eth_accounts" });
        if (acc?.[0]) { state.account = acc[0]; state.chainId = await state.provider.request({ method: "eth_chainId" }); }
      }
    }
  } catch {}
  setBadges();
}

boot();
