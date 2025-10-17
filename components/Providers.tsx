'use client'
import React from 'react'
import { AppKitProvider } from '@reown/appkit/react'
import { base } from 'viem/chains'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppKitProvider chains={[base]} appName="MoodCaster">
      {children}
    </AppKitProvider>
  )
}
