'use client'
import React, { useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect, useWalletClient, useChainId, useSwitchChain } from 'wagmi'
import { ethers } from 'ethers'

const EMOJIS = ['😊','😐','😢','😡','🤩'] as const
type EmojiId = 0 | 1 | 2 | 3 | 4

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x56043447bef8a243f16d9fd88ce00c4f14837778'
const BASE_RPC = process.env.NEXT_PUBLIC_BASE_RPC || 'https://mainnet.base.org'
const BASE_CHAIN_ID = 8453

const ABI = [
  'function setMood(uint8 emojiId)',
  'function getPopularMoodToday() view returns (uint8)'
]

export default function Home() {
  const { address, isConnected } = useAccount()
  const { connectors, connectAsync } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: walletClient } = useWalletClient()
  const chainId = useChainId()
  const { switchChainAsync } = useSwitchChain()

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

  async function ensureBase() {
    try {
      if (chainId !== BASE_CHAIN_ID && switchChainAsync) {
        await switchChainAsync({ chainId: BASE_CHAIN_ID })
      }
    } catch (e) { console.warn('switchChain failed', e) }
  }

  async function getEthersSigner() {
    if (!walletClient) throw new Error('No wallet client')
    const eip1193 = {
      request: (args: any) => walletClient.request(args)
    } as any
    const provider = new ethers.providers.Web3Provider(eip1193)
    return provider.getSigner()
  }

  async function setMood(emojiId: EmojiId) {
    try {
      if (!isConnected) {
        // show first available connector list
        const first = connectors[0]
        if (!first) throw new Error('No wallet connectors available')
        await connectAsync({ connector: first })
        return
      }

      await ensureBase()
      const signer = await getEthersSigner()
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
        <div>
          {connectors.map((c) => (
            <button key={c.uid} onClick={() => connectAsync({ connector: c })}>
              🔌 Connect {c.name}
            </button>
          ))}
        </div>
      ) : (
        <div>
          Connected: {address?.slice(0,6)}...{address?.slice(-4)}{' '}
          <button onClick={() => disconnect()}>Disconnect</button>
        </div>
      )}

      <h3>Select your current mood:</h3>
      {EMOJIS.map((emoji, i) => (
        <button key={i} onClick={() => setMood(i as EmojiId)}>{emoji}</button>
      ))}

      <p>{txStatus}</p>

      <div className="card">
        <h2>Most popular mood today</h2>
        <div style={{ fontSize: 40 }}>{popularMood !== null ? EMOJIS[popularMood] : '...'}</div>
        <div className="badge">Base Mainnet</div>
      </div>
    </div>
  )
}
