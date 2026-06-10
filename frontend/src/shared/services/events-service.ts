import {
  createCategory,
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

export const eventsService = {
  listEvents() {
    return withDelay(() => getStoreState().events)
  },

  getEvent(eventId: string) {
    return withDelay(() => {
      const event = getStoreState().events.find((item) => item.id === eventId)

      if (!event) {
        throw new Error('Event not found.')
      }

      return event
    })
  },

  createEvent(payload: CreateEventPayload) {
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

        const category = createCategory(eventId, payload, contractAddress)

        return {
          category: {
            ...category,
            ...response.category,
            contractAddress,
          },
          deployment: {
            contractAddress,
            symbol: response.deployment?.symbol ?? payload.symbol,
          },
        }
      })
    }

    return withDelay(() => {
      const deployment = deployContractMock(payload.symbol)
      const category = createCategory(eventId, payload, deployment.contractAddress)

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
