# Blockchaine Project

This repository is split into:

- `frontend/`: Vite + React ticketing app
- `backend/`: FastAPI + MongoDB API developed by the backend teammate

The frontend is styled with a warm `caffeine`-inspired theme and covers both buyer and seller flows, plus a real Wagmi wallet connection for the ETH checkout path.

## Included flows

- Buyer landing page with a featured event
- Event details with ticket category selection
- ETH checkout with Wagmi wallet connection
- Fake card checkout that still mints to a wallet address
- My Tickets page filtered by wallet ownership
- Seller dashboard
- Seller event creation
- Seller ticket-category creation linked to an optional backend deployer API
- Real injected-wallet connection with Wagmi
- Optional real on-chain `buy` and `ticketsOf` calls when a deployed ticket contract is configured

## Stack

- Vite
- React
- React Router
- Tailwind CSS
- TypeScript
- Wagmi
- Vitest + Testing Library

## Run locally

```bash
cd frontend
npm install
npm run dev
```

## Optional API and contract configuration

Create `frontend/.env.local` if you want category creation to call the backend deployer and the ETH checkout to talk to a real deployed contract:

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_TICKET_CHAIN_ID=11155111
VITE_CONTRACT_AURORA_GENERAL=0xYourDeployedTicketContract
VITE_CONTRACT_AURORA_LOUNGE=0xYourOtherDeployedTicketContract
```

When `VITE_API_BASE_URL` is set, the seller category form calls:

```text
POST /events/:eventId/categories
```

Expected response shape:

```json
{
  "category": {},
  "deployment": {
    "contractAddress": "0x..."
  }
}
```

The configured contract is expected to expose:

- `buy(uint256 quantity)` payable
- `ticketsOf(address account)` view returns `uint256[]`

## Test and build

```bash
cd frontend
npm run test
npm run build
```

## Notes

- If `VITE_API_BASE_URL` is missing, category creation falls back to the local mock deployer.
- The course says `ERC720`, but the Solidity skeleton and OpenZeppelin import are `ERC721`; this frontend supports the course assumption: one category is represented by one ticket contract address.
