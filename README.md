# Blockchaine Project Frontend

Frontend-only Vite + React prototype for the blockchain course ticketing project. The app is styled with a warm `caffeine`-inspired theme and covers both buyer and seller flows with mocked data.

## Included flows

- Buyer landing page with a featured event
- Event details with ticket category selection
- Mock ETH checkout
- Fake card checkout that still mints to a wallet address
- My Tickets page filtered by wallet ownership
- Seller dashboard
- Seller event creation
- Seller ticket-category creation with mock contract deployment

## Stack

- Vite
- React
- React Router
- Tailwind CSS
- TypeScript
- Vitest + Testing Library

## Run locally

```bash
npm install
npm run dev
```

## Test and build

```bash
npm run test
npm run build
```

## Notes

- The app is frontend-only for now.
- All data is mocked through local services and a small browser-backed store.
- The service layer is shaped so real API and blockchain integrations can replace the mocks later without rewriting the UI.
