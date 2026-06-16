import { render, screen } from '@testing-library/react'

import App from '@/App'

function renderRoute(route: string) {
  window.history.pushState({}, 'Test page', route)
  return render(<App />)
}

describe('app routing', () => {
  it('renders the landing page', async () => {
    renderRoute('/')

    expect(await screen.findByText('Aurora City Live')).toBeInTheDocument()
    expect(screen.getByText('Explore tickets')).toBeInTheDocument()
  })

  it('renders the seller dashboard route', async () => {
    renderRoute('/seller')

    expect(await screen.findByText('Create events and deploy categories')).toBeInTheDocument()
  })
})
