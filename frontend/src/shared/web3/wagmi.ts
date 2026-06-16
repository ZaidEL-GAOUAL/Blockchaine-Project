import { createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { mainnet, sepolia } from 'wagmi/chains'

export const supportedChains = [sepolia, mainnet] as const

export const defaultTicketChainId = Number(
  import.meta.env.VITE_TICKET_CHAIN_ID ?? sepolia.id,
)
const sepoliaRpcUrl =
  import.meta.env.VITE_SEPOLIA_RPC_URL?.trim() ||
  'https://ethereum-sepolia-rpc.publicnode.com'

export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(sepoliaRpcUrl),
  },
})

export function getRequiredChain() {
  return supportedChains.find((chain) => chain.id === defaultTicketChainId) ?? sepolia
}

export function getKnownChainName(chainId?: number) {
  return supportedChains.find((chain) => chain.id === chainId)?.name ?? 'Unknown network'
}
