# MoodCaster Miniapp (Next.js + TypeScript)

Express your mood onchain with emojis — and see what the Farcaster community feels today.

## Stack
- Next.js 14 + TypeScript
- Farcaster Miniapps SDK
- Ethers v5
- Base Mainnet

## Contract
Assumed ABI:
- `function setMood(uint8 emojiId)`
- `function getPopularMoodToday() view returns (uint8)`
- Event: `MoodSet(address indexed user, uint8 emojiId)`

> Deployed contract address: `0x56043447bef8a243f16d9fd88ce00c4f14837778` (Base)

## Getting Started

1. Install deps
```bash
npm i
```

2. Copy env file
```bash
cp .env.example .env.local
# Optionally edit values
```

3. Run dev
```bash
npm run dev
```

4. Open http://localhost:3000

## Deploy
- Push to GitHub
- Deploy on Vercel
- Ensure manifest is hosted at: `https://YOUR_DOMAIN/.well-known/farcaster.json`
- Update `iconUrl` and `url` fields inside the manifest with your domain.

## API: Leaderboard
`GET /api/leaderboard` — scans `MoodSet` events over last ~50k blocks and filters those within 24h window, returning counts and percentages for each emoji.

> For production: consider caching this endpoint (e.g., Vercel Edge Config / KV / cron) to reduce RPC calls.

## Notes
- UI texts are in English.
- No Tailwind; minimal CSS in `styles/globals.css`.
- If your contract ABI differs, update `ABI` arrays in `pages/index.tsx` and event names in `pages/api/leaderboard.ts`.
