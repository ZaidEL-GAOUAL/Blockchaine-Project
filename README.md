# Blockchaine Project

This repository is split into:

- `frontend/`: Vite + React ticketing app
- `backend/`: FastAPI + MongoDB API developed by the backend teammate
- `blockchain/`: Forge + Solidity ERC721 ticket contract

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
- Solidity + Foundry

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
VITE_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
VITE_CONTRACT_AURORA_GENERAL=0xYourDeployedTicketContract
VITE_CONTRACT_AURORA_LOUNGE=0xYourOtherDeployedTicketContract
```

`VITE_API_BASE_URL` defaults to `http://localhost:8000` outside tests, so the
frontend will use the local FastAPI backend by default when it is running.
`VITE_SEPOLIA_RPC_URL` defaults to the public Sepolia RPC above and is used for
wallet reads such as `ticketsOf(address)`.

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

For real category deployment, compile the Solidity artifact first:

```bash
cd blockchain
forge build
```

Then run the backend with `DEPLOYER_PRIVATE_KEY` set. The
`POST /events/:eventId/categories` route will deploy one `Ticket.sol` contract
for the new category on Sepolia and return the real address.

## Test and build

```bash
cd frontend
npm run test
npm run build
```

```bash
cd backend
uv run --extra dev python -m pytest
```

```bash
cd blockchain
forge test
```

## Notes

- Event listing, event detail, event creation, and category creation use the backend API by default.
- Fake card checkout and ticket ownership stay local/on-chain until the backend exposes those routes.
- The course says `ERC720` in some notes, but the Solidity skeleton and OpenZeppelin import are `ERC721`; this project follows the skeleton: one ticket category is represented by one deployed ticket contract.
