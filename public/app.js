// ==== CONFIG ====
const CONTRACT_ADDRESS = "0x56043447bef8a243f16d9fd88ce00c4f14837778";
const BASE_CHAIN_ID_HEX = "0x2105"; // 8453
const EMOJIS = ["😊", "😐", "😢", "😡", "🤩"];
const REOWN_PROJECT_ID = "169bbbc4ed82469ef09184744a7bcb4f";

const MOOD_ABI = [
  {
    "type": "function",
    "name": "setMood",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "user", "type": "address" },
      { "name": "emojiId", "type": "uint256" }
    ],
    "outputs": []
  }
];

const state = {
  provider: null,
  account: null,
  chainId: null,
  isInMiniApp: false,
  appKit: null
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function toast(msg, t = 3000, type = "info") {
  const el = $("#toast");
  el.textContent = msg;
  el.className = `toast ${type}`;
  if (t) setTimeout(() => (el.className = "toast"), t);
}

function todayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function bumpLocalStats(emojiId) {
  const key = `mood-stats:${todayKey()}`;
  const data = JSON.parse(localStorage.getItem(key) || "{}");
  data[emojiId] = (data[emojiId] || 0) + 1;
  localStorage.setItem(key, JSON.stringify(data));
  renderStats();
}

function renderStats() {
  const data = JSON.parse(localStorage.getItem(`mood-stats:${todayKey()}`) || "{}");
  let topId = null, topVal = -1;
  for (let i = 0; i < 5; i++) {
    const v = data[i] || 0;
    $(`#c${i}`).textContent = v;
    if (v > topVal) { topVal = v; topId = i; }
  }
  $("#top-today").textContent = topVal > 0 ? `Today's winner: ${EMOJIS[topId]} (${topVal})` : "No data yet for today";
}

function shortAddr(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "—";
}

function setBadges() {
  $("#fc-indicator").textContent = state.isInMiniApp ? "Farcaster" : "Web";
  $("#network").textContent = state.chainId ? `Chain ${parseInt(state.chainId, 16)}` : "Chain –";
  $("#account").textContent = state.account ? shortAddr(state.account) : "Account –";
}

async function initReown() {
  if (state.appKit) return state.appKit;
  const { createAppKit, base } = window.ReownAppKit;
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
    if (window.FARCASTER_SDK) {
      const isIn = await window.FARCASTER_SDK.isInMiniApp();
      state.isInMiniApp = !!isIn;
      if (isIn) {
        const p = await window.FARCASTER_SDK.wallet.getEthereumProvider();
        if (p) return p;
      }
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
  if (!state.provider) throw new Error("No provider found. Try Reown or Farcaster.");
  const accounts = await state.provider.request({ method: "eth_requestAccounts" });
  state.account = accounts?.[0] || null;
  state.chainId = await state.provider.request({ method: "eth_chainId" });
  setBadges();
}

async function ensureBaseNetwork() {
  if (state.chainId === BASE_CHAIN_ID_HEX) return;
  try {
    await state.provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_CHAIN_ID_HEX }]
    });
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
  const { encodeFunctionData, getAddress } = window.viem;
  const user = getAddress(state.account);
  const data = encodeFunctionData({
    abi: MOOD_ABI,
    functionName: "setMood",
    args: [user, BigInt(emojiId)]
  });
  const tx = { from: user, to: CONTRACT_ADDRESS, data };
  toast("Sending transaction… confirm in wallet.", 4000);
  const hash = await state.provider.request({ method: "eth_sendTransaction", params: [tx] });
  toast(`Transaction sent: ${hash.slice(0, 10)}…`, 4000, "success");
  bumpLocalStats(emojiId);
}

function wireUI() {
  $$("#moods button").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = parseInt(btn.getAttribute("data-id"), 10);
      try {
        btn.disabled = true;
        await sendMoodTx(id);
      } catch (e) {
        console.error(e);
        toast(e.message || "Transaction failed", 5000, "error");
      } finally {
        btn.disabled = false;
      }
    });
  });
  $("#connectBtn").addEventListener("click", async () => {
    try {
      await ensureConnected();
      toast("Wallet connected", 2000, "success");
    } catch (e) {
      toast(e.message || "Connection failed", 5000, "error");
    }
  });
}

async function boot() {
  renderStats();
  setBadges();
  wireUI();
  try {
    if (window.FARCASTER_SDK) {
      state.isInMiniApp = await window.FARCASTER_SDK.isInMiniApp();
      if (state.isInMiniApp) {
        state.provider = await window.FARCASTER_SDK.wallet.getEthereumProvider();
        if (state.provider) {
          const acc = await state.provider.request({ method: "eth_accounts" });
          if (acc?.[0]) {
            state.account = acc[0];
            state.chainId = await state.provider.request({ method: "eth_chainId" });
          }
        }
      }
    }
  } catch (e) { console.warn(e); }
  setBadges();
}

boot();
