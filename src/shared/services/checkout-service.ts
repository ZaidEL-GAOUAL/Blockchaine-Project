import { checkoutByCard } from '@/shared/mocks/store'
import { withDelay } from '@/shared/services/helpers'
import type { CardCheckoutPayload } from '@/shared/types/models'

export const checkoutService = {
  payByCard(payload: CardCheckoutPayload) {
    return withDelay(() => checkoutByCard(payload), 550)
  },
}
