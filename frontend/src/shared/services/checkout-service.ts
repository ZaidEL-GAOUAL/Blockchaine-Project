import { checkoutByCard, type ResolvedPurchaseContext } from '@/shared/mocks/store'
import { withDelay } from '@/shared/services/helpers'
import type { CardCheckoutPayload } from '@/shared/types/models'

export const checkoutService = {
  payByCard(payload: CardCheckoutPayload, resolved?: ResolvedPurchaseContext) {
    return withDelay(() => checkoutByCard(payload, resolved), 550)
  },
}
