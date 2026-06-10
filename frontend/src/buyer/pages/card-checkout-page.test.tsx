import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import App from '@/App'

function renderCardCheckout() {
  window.history.pushState(
    {},
    'Card checkout',
    '/checkout/card?eventId=aurora-city-live&categoryId=aurora-general&quantity=2',
  )

  return render(<App />)
}

describe('card checkout page', () => {
  it('shows validation errors for incomplete data', async () => {
    renderCardCheckout()

    const submitButton = await screen.findByRole('button', {
      name: 'Confirm card checkout',
    })

    await userEvent.click(submitButton)

    expect(
      await screen.findByText('Please fix the highlighted fields before continuing.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Cardholder name is required.')).toBeInTheDocument()
  })

  it('submits a fake payment and shows success state', async () => {
    renderCardCheckout()

    await userEvent.type(
      await screen.findByLabelText('Cardholder name'),
      'Zaid El Gaoual',
    )
    await userEvent.type(screen.getByLabelText('Fake card number'), '4242424242424242')
    await userEvent.type(
      screen.getByLabelText('Wallet address'),
      '0xA81E3D0A5C0FFEE00000000000000000C0DE123',
    )
    await userEvent.type(screen.getByLabelText('Expiration'), '09/28')
    await userEvent.type(screen.getByLabelText('CVC'), '123')

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Confirm card checkout',
      }),
    )

    expect(await screen.findByText('Fake payment accepted')).toBeInTheDocument()
  })
})
