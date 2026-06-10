import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import App from '@/App'

describe('create event page', () => {
  it('creates a seller event and exposes the next step', async () => {
    window.history.pushState({}, 'Create event', '/seller/events/new')
    render(<App />)

    await userEvent.type(await screen.findByLabelText('Event title'), 'Ledger Bloom')
    await userEvent.type(screen.getByLabelText('Organizer'), 'Coded Nights')
    await userEvent.type(screen.getByLabelText('Date and time'), '2026-11-20T19:30')
    await userEvent.type(screen.getByLabelText('Venue'), 'Paris Expo')

    await userEvent.click(screen.getByRole('button', { name: 'Create event' }))

    expect(await screen.findByText('Event created successfully')).toBeInTheDocument()
    expect(screen.getByText('Add first ticket category')).toBeInTheDocument()
  })
})
