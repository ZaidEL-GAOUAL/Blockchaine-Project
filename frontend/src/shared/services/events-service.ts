import {
  createCategory as createMockCategory,
  createEvent,
  deployContractMock,
  getStoreState,
  subscribeToStore,
} from '@/shared/mocks/store'
import { apiClient } from '@/shared/services/api-client'
import { withDelay } from '@/shared/services/helpers'
import type {
  CreateCategoryPayload,
  CreateEventPayload,
  Event,
  TicketCategory,
} from '@/shared/types/models'

function slugifyCategoryId(eventId: string, categoryName: string) {
  const slug = categoryName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  return `${eventId}-${slug || 'category'}`
}

function buildApiCategory(
  eventId: string,
  payload: CreateCategoryPayload,
  contractAddress: string,
  category?: Partial<TicketCategory>,
): TicketCategory {
  const fallback: TicketCategory = {
    id: slugifyCategoryId(eventId, payload.name),
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

  return {
    ...fallback,
    ...category,
    eventId: category?.eventId ?? eventId,
    contractAddress: category?.contractAddress ?? contractAddress,
  }
}

export const eventsService = {
  listEvents() {
    if (apiClient.isConfigured()) {
      return apiClient.listEvents()
    }

    return withDelay(() => getStoreState().events)
  },

  getEvent(eventId: string) {
    if (apiClient.isConfigured()) {
      return apiClient.getEvent(eventId)
    }

    return withDelay(() => {
      const event = getStoreState().events.find((item) => item.id === eventId)

      if (!event) {
        throw new Error('Event not found.')
      }

      return event
    })
  },

  createEvent(payload: CreateEventPayload) {
    if (apiClient.isConfigured()) {
      return apiClient.createEvent(payload)
    }

    return withDelay(() => createEvent(payload), 350)
  },

  createCategory(eventId: string, payload: CreateCategoryPayload) {
    if (apiClient.isConfigured()) {
      return apiClient.createCategory(eventId, payload).then((response) => {
        const contractAddress =
          response.deployment?.contractAddress ?? response.contractAddress

        if (!contractAddress) {
          throw new Error('The category API did not return a contract address.')
        }

        return {
          category: buildApiCategory(eventId, payload, contractAddress, response.category),
          deployment: {
            contractAddress,
            symbol: response.deployment?.symbol ?? payload.symbol,
          },
        }
      })
    }

    return withDelay(() => {
      const deployment = deployContractMock(payload.symbol)
      const category = createMockCategory(eventId, payload, deployment.contractAddress)

      return {
        category,
        deployment,
      }
    }, 400)
  },

  subscribe(callback: () => void) {
    return subscribeToStore(callback)
  },

  listCategories(eventId: string): Promise<TicketCategory[]> {
    return this.getEvent(eventId).then((event: Event) => event.categories)
  },
}
