import type {
  CreateCategoryPayload,
  TicketCategory,
} from '@/shared/types/models'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')

interface CreateCategoryApiResponse {
  category?: Partial<TicketCategory>
  deployment?: {
    contractAddress?: string
    symbol?: string
  }
  contractAddress?: string
}

export const apiClient = {
  isConfigured() {
    return Boolean(apiBaseUrl)
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
}
