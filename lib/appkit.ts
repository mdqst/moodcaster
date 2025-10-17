import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { base } from 'viem/chains'

export const wagmiAdapter = new WagmiAdapter({
  chains: [base],
})

export const wagmiConfig = wagmiAdapter.wagmiConfig
