import type { AppProps } from 'next/app'
import '../styles/globals.css'
import { AppKitProvider } from '@reown/appkit'
import { base } from 'viem/chains'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppKitProvider chains={[base]} appName="MoodCaster">
      <Component {...pageProps} />
    </AppKitProvider>
  )
}
