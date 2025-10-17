import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { sdk } from '@farcaster/miniapp-sdk'
import { useAppKit } from '@reown/appkit'
import { ethers } from 'ethers'

const EMOJIS = ['😊','😐','😢','😡','🤩'] as const
type EmojiId = 0 | 1 | 2 | 3 | 4

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x56043447bef8a243f16d9fd88ce00c4f14837778'
const BASE_RPC = process.env.NEXT_PUBLIC_BASE_RPC || 'https://mainnet.base.org'

const ABI = [
  'function setMood(uint8 emojiId)',
  'function getPopularMoodToday() view returns (uint8)'
]

export default function Home() {
  const [popularMood, setPopularMood] = useState<number | null>(null)
  const [txStatus, setTxStatus] = useState<string>('')
  const [leaderboard, setLeaderboard] = useState<{ emojiId: number; count: number; percent: string }[]>([])

  const { isConnected, address, provider, connect, disconnect } = useAppKit()

  useEffect(() => {
    sdk.actions.ready()
    fetchPopularMood()
    fetchLeaderboard()
  }, [])

  async function fetchPopularMood() {
    try {
      const rpc = new ethers.providers.JsonRpcProvider(BASE_RPC)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, rpc)
      const mood: any = await contract.getPopularMoodToday()
      setPopularMood(Number(mood))
    } catch (e) {
      console.error(e)
    }
  }

  async function fetchLeaderboard() {
    try {
      const res = await fetch('/api/leaderboard')
      const data = await res.json()
      setLeaderboard(data.leaderboard || [])
    } catch (e) {
      console.error(e)
    }
  }

  async function setMood(emojiId: EmojiId) {
    try {
      if (!isConnected) {
        setTxStatus('🔌 Please connect wallet first')
        await connect()
        return
      }
      if (!provider) throw new Error('No provider from AppKit')

      const ethersProvider = new ethers.providers.Web3Provider(provider as any)
      const signer = ethersProvider.getSigner()
      const network = await ethersProvider.getNetwork()
      if (network.chainId !== 8453n && network.chainId !== 8453) {
        try {
          await (ethersProvider.provider as any).request?.({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x2105' }], // 8453 Base
          })
        } catch {}
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer)
      const tx = await contract.setMood(emojiId)
      setTxStatus('⏳ Sending transaction...')
      await tx.wait()
      setTxStatus('✅ Mood recorded onchain!')
      fetchPopularMood()
      fetchLeaderboard()

      // Auto-cast in Farcaster
      const emoji = EMOJIS[emojiId]
      const castText = `I'm feeling ${emoji} today onchain with MoodCaster ⚡️`
      const actions: any = sdk.actions
      if (actions?.openCastComposer) actions.openCastComposer({ text: castText })
    } catch (e) {
      console.error(e)
      setTxStatus('❌ Failed to send transaction')
    }
  }

  return (
    <div className="container">
      <Head>
        <title>MoodCaster</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Express your mood onchain and see top moods today." />
      </Head>

      <div className="h1">MoodCaster</div>

      {!isConnected ? (
        <button className="btn" onClick={() => connect()}>🔌 Connect Wallet</button>
      ) : (
        <div className="small">
          Connected: {address?.slice(0,6)}...{address?.slice(-4)}{' '}
          <button className="btn" onClick={() => disconnect()}>Disconnect</button>
        </div>
      )}

      <p>Select your current mood:</p>

      <div style={{ display: 'flex', gap: 12 }}>
        {EMOJIS.map((emoji, i) => (
          <button key={i} className="btn" onClick={() => setMood(i as EmojiId)}>
            {emoji}
          </button>
        ))}
      </div>

      {txStatus && <p className="status">{txStatus}</p>}

      <div className="card">
        <div className="h2">Most popular mood today</div>
        <div className="mood">{popularMood !== null ? EMOJIS[popularMood] : '…'}</div>
        <div className="small">Updated live after each transaction.</div>
      </div>

      {leaderboard.length > 0 && (
        <div className="card">
          <div className="h2">Top moods today</div>
          <ul className="list">
            {leaderboard
              .sort((a, b) => b.count - a.count)
              .map(({ emojiId, count, percent }) => (
                <li key={emojiId}>
                  <span>{EMOJIS[emojiId]}</span>
                  <span>{percent}% <span className="badge">{count}</span></span>
                </li>
              ))}
          </ul>
          <div className="small">24h rolling window based on onchain events.</div>
        </div>
      )}
    </div>
  )
}
