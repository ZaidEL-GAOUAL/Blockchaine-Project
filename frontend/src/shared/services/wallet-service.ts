import { DEFAULT_WALLET_ADDRESS } from '@/shared/mocks/data'
import { getStoreState, setWalletSession, subscribeToStore } from '@/shared/mocks/store'
import { withDelay } from '@/shared/services/helpers'

export const walletService = {
  getSession() {
    return withDelay(() => getStoreState().wallet, 120)
  },

  connect() {
    return withDelay(
      () =>
        setWalletSession({
          account: DEFAULT_WALLET_ADDRESS,
          isConnected: true,
          network: 'Sepolia',
        }),
      220,
    )
  },

  disconnect() {
    return withDelay(
      () =>
        setWalletSession({
          account: null,
          isConnected: false,
          network: 'Sepolia',
        }),
      120,
    )
  },

  subscribe(callback: () => void) {
    return subscribeToStore(callback)
  },
}
