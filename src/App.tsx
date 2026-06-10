import { BrowserRouter } from 'react-router-dom'

import { AppShell } from '@/shared/layout/app-shell'
import { AppRoutes } from '@/app/routes'

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <AppRoutes />
      </AppShell>
    </BrowserRouter>
  )
}
