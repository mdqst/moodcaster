'use client'
import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { useAppKit } from '@reown/appkit'

const EMOJIS = ['😊','😐','😢','😡','🤩'] as const
type EmojiId = 0 | 1 | 2 | 3 | 4

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x56043447bef8a243f16d9fd88ce00c4f14837778'
const BASE_RPC = process.env.NEXT_PUBLIC_BASE_RPC || 'https://mainnet.base.org'

const ABI = [
  'function setMood(uint8 emojiId)',
  'function getPopularMoodToday() view returns (uint8)'
]

export default function Home() {
  const { isConnected, address, provider, connect, disconnect } = useAppKit()
  const [popularMood, setPopularMood] = useState<number | null>(null)
  const [txStatus, setTxStatus] = useState<string>('')

  useEffect(() => { fetchPopularMood() }, [])

  async function fetchPopularMood() {
    try {
      const rpc = new ethers.providers.JsonRpcProvider(BASE_RPC)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, rpc)
      const mood = await contract.getPopularMoodToday()
      setPopularMood(Number(mood))
    } catch (e) { console.error(e) }
  }

  async function setMood(emojiId: EmojiId) {
    try {
      if (!isConnected) return connect()
      if (!provider) throw new Error('no provider')
      const ethersProvider = new ethers.providers.Web3Provider(provider as any)
      const signer = ethersProvider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer)
      const tx = await contract.setMood(emojiId)
      setTxStatus('⏳ Sending transaction...')
      await tx.wait()
      setTxStatus('✅ Mood recorded onchain!')
      fetchPopularMood()
    } catch (e) {
      console.error(e)
      setTxStatus('❌ Failed to send transaction')
    }
  }

  return (
    <div>
      <h1>MoodCaster</h1>
      {!isConnected ? (
        <button onClick={() => connect()}>🔌 Connect Wallet</button>
      ) : (
        <div>
          Connected: {address?.slice(0,6)}...{address?.slice(-4)} 
          <button onClick={() => disconnect()}>Disconnect</button>
        </div>
      )}
      <h3>Select your current mood:</h3>
      {EMOJIS.map((emoji, i) => (
        <button key={i} onClick={() => setMood(i as EmojiId)}>{emoji}</button>
      ))}
      <p>{txStatus}</p>
      <h2>Most popular mood today:</h2>
      <h1>{popularMood !== null ? EMOJIS[popularMood] : '...'}</h1>
    </div>
  )
}
