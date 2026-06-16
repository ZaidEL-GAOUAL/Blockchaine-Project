import {
  DEFAULT_WALLET_ADDRESS,
  seedEvents,
} from '@/shared/mocks/data'
import { slugify } from '@/shared/lib/utils'
import type {
  CardCheckoutPayload,
  ContractPurchasePayload,
  ContractPurchaseResult,
  CreateCategoryPayload,
  CreateEventPayload,
  Event,
  OwnedTicket,
  PurchaseMethod,
  TicketCategory,
  WalletSession,
} from '@/shared/types/models'

const STORAGE_KEY = 'blockchaine-project-store'
const STORE_EVENT = 'blockchaine:store-updated'

interface StoreState {
  events: Event[]
  ownedTickets: OwnedTicket[]
  wallet: WalletSession
  counters: {
    event: number
    category: number
    token: number
    contract: number
  }
}

const seedState: StoreState = {
  events: seedEvents,
  ownedTickets: [
    {
      id: 'owned-1001',
      tokenId: 1001,
      eventId: 'aurora-city-live',
      eventTitle: 'Aurora City Live',
      categoryId: 'aurora-general',
      categoryName: 'General Admission',
      walletAddress: DEFAULT_WALLET_ADDRESS,
      contractAddress: '0xCAFFE100000000000000000000000000000001',
      purchaseMethod: 'ETH',
    },
  ],
  wallet: {
    account: null,
    isConnected: false,
    network: 'Sepolia',
  },
  counters: {
    event: 2,
    category: 3,
    token: 1002,
    contract: 3,
  },
}

let memoryStore = clone(seedState)

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function emitStoreUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(STORE_EVENT))
  }
}

function readPersistedStore() {
  if (typeof window === 'undefined') {
    return clone(memoryStore)
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY)
  if (!rawValue) {
    return clone(seedState)
  }

  try {
    return JSON.parse(rawValue) as StoreState
  } catch {
    return clone(seedState)
  }
}

function writePersistedStore(nextState: StoreState) {
  memoryStore = clone(nextState)

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState))
  }

  emitStoreUpdate()
}

export function subscribeToStore(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  window.addEventListener(STORE_EVENT, callback)
  return () => window.removeEventListener(STORE_EVENT, callback)
}

export function resetStore() {
  memoryStore = clone(seedState)

  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY)
  }
}

export function getStoreState() {
  const nextState = readPersistedStore()
  memoryStore = clone(nextState)
  return nextState
}

export function setWalletSession(session: WalletSession) {
  const state = getStoreState()
  const nextState = { ...state, wallet: session }
  writePersistedStore(nextState)
  return nextState.wallet
}

function buildContractAddress(counter: number) {
  return `0xCAFFE1000000000000000000000000000000${String(counter).padStart(2, '0')}`
}

function createOwnedTickets({
  category,
  event,
  quantity,
  walletAddress,
  purchaseMethod,
  startToken,
}: {
  category: TicketCategory
  event: Pick<Event, 'id' | 'title'>
  quantity: number
  walletAddress: string
  purchaseMethod: PurchaseMethod
  startToken: number
}) {
  return Array.from({ length: quantity }, (_, index) => ({
    id: `owned-${startToken + index}`,
    tokenId: startToken + index,
    eventId: event.id,
    eventTitle: event.title,
    categoryId: category.id,
    categoryName: category.name,
    walletAddress,
    contractAddress: category.contractAddress,
    purchaseMethod,
  }))
}

function ensureCategoryCapacity(category: TicketCategory, quantity: number) {
  if (category.mintedCount + quantity > category.maxSupply) {
    throw new Error('Selected quantity exceeds remaining supply.')
  }
}

function findEventAndCategory(state: StoreState, categoryId: string) {
  for (const event of state.events) {
    const category = event.categories.find((item) => item.id === categoryId)
    if (category) {
      return { event, category }
    }
  }

  throw new Error('Ticket category not found.')
}

// Categories loaded from the backend API do not exist in the local mock store,
// so callers can pass the already-resolved event/category to skip the seed lookup.
export interface ResolvedPurchaseContext {
  event: Pick<Event, 'id' | 'title'>
  category: TicketCategory
}

export function purchaseTickets(
  payload: ContractPurchasePayload & { purchaseMethod: PurchaseMethod },
  resolved?: ResolvedPurchaseContext,
): ContractPurchaseResult {
  const state = getStoreState()
  const { event, category } = resolved ?? findEventAndCategory(state, payload.categoryId)

  if (payload.quantity <= 0) {
    throw new Error('Quantity must be at least 1.')
  }

  ensureCategoryCapacity(category, payload.quantity)

  const startToken = state.counters.token
  const mintedTokenIds = Array.from(
    { length: payload.quantity },
    (_, index) => startToken + index,
  )

  const nextEvents = state.events.map((item) =>
    item.id === event.id
      ? {
          ...item,
          categories: item.categories.map((ticketCategory) =>
            ticketCategory.id === category.id
              ? {
                  ...ticketCategory,
                  mintedCount: ticketCategory.mintedCount + payload.quantity,
                }
              : ticketCategory,
          ),
        }
      : item,
  )

  const nextOwnedTickets = [
    ...state.ownedTickets,
    ...createOwnedTickets({
      category,
      event,
      quantity: payload.quantity,
      walletAddress: payload.account,
      purchaseMethod: payload.purchaseMethod,
      startToken,
    }),
  ]

  writePersistedStore({
    ...state,
    events: nextEvents,
    ownedTickets: nextOwnedTickets,
    counters: {
      ...state.counters,
      token: startToken + payload.quantity,
    },
  })

  return {
    txHash: `0xTX${String(startToken).padStart(6, '0')}`,
    mintedTokenIds,
  }
}

export function createEvent(payload: CreateEventPayload) {
  const state = getStoreState()
  const nextIdBase = slugify(payload.title) || `event-${state.counters.event}`
  const nextEventId = state.events.some((event) => event.id === nextIdBase)
    ? `${nextIdBase}-${state.counters.event}`
    : nextIdBase

  const nextEvent: Event = {
    id: nextEventId,
    title: payload.title,
    organizer: payload.organizer,
    date: payload.date,
    venue: payload.venue,
    description: payload.description,
    heroImage: payload.heroImage,
    heroEyebrow: 'New seller event',
    categories: [],
  }

  writePersistedStore({
    ...state,
    events: [nextEvent, ...state.events],
    counters: {
      ...state.counters,
      event: state.counters.event + 1,
    },
  })

  return nextEvent
}

export function createCategory(
  eventId: string,
  payload: CreateCategoryPayload,
  contractAddress: string,
) {
  const state = getStoreState()
  const event = state.events.find((item) => item.id === eventId)

  if (!event) {
    throw new Error('Event not found.')
  }

  const nextIdBase = slugify(`${eventId}-${payload.name}`) || `category-${state.counters.category}`
  const nextCategoryId = event.categories.some((category) => category.id === nextIdBase)
    ? `${nextIdBase}-${state.counters.category}`
    : nextIdBase

  const nextCategory: TicketCategory = {
    id: nextCategoryId,
    eventId,
    name: payload.name,
    symbol: payload.symbol,
    description: payload.description,
    priceEth: payload.priceEth,
    priceEur: payload.priceEur,
    maxSupply: payload.maxSupply,
    mintedCount: 0,
    metadataUri: payload.metadataUri,
    contractAddress,
    benefits: payload.benefits,
  }

  writePersistedStore({
    ...state,
    events: state.events.map((item) =>
      item.id === eventId
        ? { ...item, categories: [...item.categories, nextCategory] }
        : item,
    ),
    counters: {
      ...state.counters,
      category: state.counters.category + 1,
    },
  })

  return nextCategory
}

export function deployContractMock(symbol: string) {
  const state = getStoreState()
  const nextAddress = buildContractAddress(state.counters.contract)

  writePersistedStore({
    ...state,
    counters: {
      ...state.counters,
      contract: state.counters.contract + 1,
    },
  })

  return {
    contractAddress: nextAddress,
    symbol,
  }
}

export function checkoutByCard(
  payload: CardCheckoutPayload,
  resolved?: ResolvedPurchaseContext,
) {
  if (!payload.walletAddress.startsWith('0x')) {
    throw new Error('Wallet address must start with 0x.')
  }

  return purchaseTickets(
    {
      categoryId: payload.categoryId,
      quantity: payload.quantity,
      account: payload.walletAddress,
      purchaseMethod: 'CARD',
    },
    resolved,
  )
}
