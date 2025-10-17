import type { AppProps } from 'next/app'
import '../styles/globals.css'
import dynamic from 'next/dynamic'

const Providers = dynamic(() => import('../components/Providers'), { ssr: false })

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Providers>
      <Component {...pageProps} />
    </Providers>
  )
}
