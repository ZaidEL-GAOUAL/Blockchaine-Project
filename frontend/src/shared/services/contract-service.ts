import {
  getStoreState,
  purchaseTickets,
  recordPurchaseReceipt,
  subscribeToStore,
} from '@/shared/mocks/store'
import { withDelay } from '@/shared/services/helpers'
import type {
  ContractPurchasePayload,
  Event,
  TicketCategory,
} from '@/shared/types/models'

export const contractService = {
  buyTickets(payload: ContractPurchasePayload) {
    return withDelay(
      () =>
        purchaseTickets({
          ...payload,
          purchaseMethod: 'ETH',
        }),
      500,
    )
  },

  getOwnedTickets(account: string) {
    return withDelay(
      () =>
        getStoreState().ownedTickets.filter(
          (ticket) => ticket.walletAddress.toLowerCase() === account.toLowerCase(),
        ),
      260,
    )
  },

  recordConfirmedPurchase(payload: {
    event: Event
    category: TicketCategory
    quantity: number
    account: string
    txHash: string
  }) {
    return recordPurchaseReceipt({
      event: payload.event,
      category: payload.category,
      quantity: payload.quantity,
      walletAddress: payload.account,
      txHash: payload.txHash,
    })
  },

  withdraw(contractAddress: string) {
    return withDelay(
      () => ({
        contractAddress,
        txHash: `0xWDR${contractAddress.slice(-6)}`,
      }),
      240,
    )
  },

  subscribe(callback: () => void) {
    return subscribeToStore(callback)
  },
}
