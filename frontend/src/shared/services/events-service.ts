import { apiClient } from '@/shared/services/api-client'
import type {
  CreateCategoryPayload,
  CreateEventPayload,
  Event,
  TicketCategory,
} from '@/shared/types/models'

export const eventsService = {
  listEvents() {
    return apiClient.listEvents()
  },

  getEvent(eventId: string) {
    return apiClient.getEvent(eventId)
  },

  createEvent(payload: CreateEventPayload) {
    return apiClient.createEvent(payload)
  },

  createCategory(eventId: string, payload: CreateCategoryPayload) {
    return apiClient.createCategory(eventId, payload)
  },

  subscribe(_callback?: () => void) {
    return () => undefined
  },

  listCategories(eventId: string): Promise<TicketCategory[]> {
    return this.getEvent(eventId).then((event: Event) => event.categories)
  },
}
