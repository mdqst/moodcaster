'use client'
import React from 'react'
import { WagmiProvider } from 'wagmi'
import { wagmiConfig } from '../lib/appkit'

export default function Providers({ children }: { children: React.ReactNode }) {
  return <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
}
