import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { getTweedConnector } from './tweedConnector'

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [await getTweedConnector()],

  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
