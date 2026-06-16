export type PurchaseMethod = 'ON_CHAIN'

export interface TicketCategory {
  id: string
  eventId: string
  name: string
  symbol: string
  description: string
  priceEth: number
  priceEur: number
  maxSupply: number
  mintedCount: number
  metadataUri: string
  contractAddress: string
  benefits: string[]
}

export interface Event {
  id: string
  title: string
  organizer: string
  date: string
  venue: string
  description: string
  heroImage: string
  heroEyebrow: string
  categories: TicketCategory[]
}

export interface OwnedTicket {
  id: string
  tokenId: number
  eventId: string
  eventTitle: string
  categoryId: string
  categoryName: string
  walletAddress: string
  contractAddress: string
  purchaseMethod: PurchaseMethod
}

export interface WalletSession {
  account: string | null
  isConnected: boolean
  network: string
}

export interface CardCheckoutPayload {
  eventId: string
  categoryId: string
  quantity: number
  cardholderName: string
  cardNumber: string
  expiration: string
  cvc: string
  walletAddress: string
}

export interface CreateEventPayload {
  title: string
  organizer: string
  date: string
  venue: string
  description: string
  heroImage: string
}

export interface CreateCategoryPayload {
  name: string
  symbol: string
  description: string
  priceEth: number
  priceEur: number
  maxSupply: number
  metadataUri: string
  benefits: string[]
}

export interface ContractPurchasePayload {
  categoryId: string
  quantity: number
  account: string
}

export interface ContractPurchaseResult {
  txHash: string
  mintedTokenIds: number[]
}
