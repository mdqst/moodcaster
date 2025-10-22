# MoodCaster — Reown AppKit + Wagmi (Client-Only) ᵕ̈

- Next.js 14 + TypeScript
- Reown AppKit (wagmi adapter) + wagmi + viem
- Client-only rendering (no SSR) so Vercel build succeeds

## Install
```bash
npm install
```
## Dev
```bash
npm run dev
```
## Build
```bash
npm run build
```

### Notes
- Base mainnet chainId: 8453 (0x2105)
- Connect buttons render from available wagmi connectors (via Reown wagmi adapter)
- Transactions use ethers v5 + EIP-1193 bridge from viem wallet client
