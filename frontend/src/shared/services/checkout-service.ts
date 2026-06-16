import { apiClient } from '@/shared/services/api-client'
import type { CardCheckoutPayload } from '@/shared/types/models'

export const checkoutService = {
  payByCard(payload: CardCheckoutPayload) {
    return apiClient.payByCard(payload)
  },
}
