import type {
  CardCheckoutPayload,
  CreateCategoryPayload,
  CreateEventPayload,
  Event,
  TicketCategory,
} from '@/shared/types/models'

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const defaultApiBaseUrl = 'http://localhost:8000'
const apiBaseUrl = (configuredApiBaseUrl || defaultApiBaseUrl)?.replace(/\/$/, '')

interface CreateCategoryApiResponse {
  category: TicketCategory
  deployment: {
    contractAddress: string
    symbol: string
  }
}

interface CardCheckoutApiResponse {
  txHash: string
}

export const apiClient = {
  isConfigured() {
    return Boolean(apiBaseUrl)
  },

  async listEvents() {
    if (!apiBaseUrl) {
      throw new Error('VITE_API_BASE_URL is not configured.')
    }

    const response = await fetch(`${apiBaseUrl}/events`)

    if (!response.ok) {
      throw new Error(`Could not load events. API returned ${response.status}.`)
    }

    return (await response.json()) as Event[]
  },

  async getEvent(eventId: string) {
    if (!apiBaseUrl) {
      throw new Error('VITE_API_BASE_URL is not configured.')
    }

    const response = await fetch(`${apiBaseUrl}/events/${encodeURIComponent(eventId)}`)

    if (!response.ok) {
      throw new Error(`Could not load event. API returned ${response.status}.`)
    }

    return (await response.json()) as Event
  },

  async createEvent(payload: CreateEventPayload) {
    if (!apiBaseUrl) {
      throw new Error('VITE_API_BASE_URL is not configured.')
    }

    const response = await fetch(`${apiBaseUrl}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Event creation failed with status ${response.status}.`)
    }

    return (await response.json()) as Event
  },

  async createCategory(eventId: string, payload: CreateCategoryPayload) {
    if (!apiBaseUrl) {
      throw new Error('VITE_API_BASE_URL is not configured.')
    }

    const response = await fetch(
      `${apiBaseUrl}/events/${encodeURIComponent(eventId)}/categories`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    )

    if (!response.ok) {
      throw new Error(`Category deployment failed with status ${response.status}.`)
    }

    return (await response.json()) as CreateCategoryApiResponse
  },

  async payByCard(payload: CardCheckoutPayload) {
    if (!apiBaseUrl) {
      throw new Error('VITE_API_BASE_URL is not configured.')
    }

    const response = await fetch(`${apiBaseUrl}/checkout/card`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Card checkout failed with status ${response.status}.`)
    }

    return (await response.json()) as CardCheckoutApiResponse
  },
}
