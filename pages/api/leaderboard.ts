import type { NextApiRequest, NextApiResponse } from 'next'
import { ethers } from 'ethers'

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x56043447bef8a243f16d9fd88ce00c4f14837778'
const BASE_RPC = process.env.NEXT_PUBLIC_BASE_RPC || 'https://mainnet.base.org'
const ABI = ['event MoodSet(address indexed user, uint8 emojiId)']

const provider = new ethers.providers.JsonRpcProvider(BASE_RPC)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider)

    const currentBlock = await provider.getBlockNumber()
    const latest = await provider.getBlock(currentBlock)
    const fromTime = (latest?.timestamp || Math.floor(Date.now()/1000)) - 24 * 60 * 60

    const fromBlock = Math.max(0, currentBlock - 50000)
    const events = await contract.queryFilter('MoodSet', fromBlock, currentBlock)

    const counts = [0,0,0,0,0]
    for (const ev of events) {
      const args: any = ev.args
      if (!args) continue
      const emojiId: number = Number(args.emojiId)
      if (emojiId < 0 || emojiId > 4) continue
      const b = await ev.getBlock()
      if (b && b.timestamp >= fromTime) counts[emojiId] += 1
    }

    const total = counts.reduce((a,b)=>a+b,0)
    const leaderboard = counts.map((c, i) => ({
      emojiId: i,
      count: c,
      percent: total ? ((c/total)*100).toFixed(1) : '0.0'
    }))

    res.status(200).json({ leaderboard, total, fromBlock, currentBlock })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to fetch leaderboard' })
  }
}
