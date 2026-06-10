import '@testing-library/jest-dom/vitest'
import { beforeEach } from 'vitest'

import { resetStore } from '@/shared/mocks/store'

beforeEach(() => {
  resetStore()
})
