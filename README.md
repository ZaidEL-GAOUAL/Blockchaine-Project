# Blockchaine Project

This repository is split into:

- `frontend/`: Vite + React ticketing app
- `backend/`: FastAPI + MongoDB API developed by the backend teammate
- `blockchain/`: Forge + Solidity ERC721 ticket contract

The frontend is styled with a warm `caffeine`-inspired theme and covers buyer
and seller flows using the FastAPI backend and deployed ERC721 ticket contracts.

## Included flows

- Buyer landing page populated from the API
- Event details with ticket category selection
- ETH checkout with Wagmi wallet connection
- Fake card checkout that calls the backend mint route
- My Tickets page filtered by on-chain wallet ownership
- Seller dashboard
- Seller event creation
- Seller ticket-category creation linked to the backend deployer API
- Real injected-wallet connection with Wagmi
- Real on-chain `buy`, `mint`, and `ticketsOf` calls on deployed category contracts

## Stack

- Vite
- React
- React Router
- Tailwind CSS
- TypeScript
- Wagmi
- Vitest + Testing Library
- Solidity + Foundry
- FastAPI + MongoDB + web3.py

## Architecture

- `frontend/`: Vite + React app. It calls the API for events/categories/card checkout and reads ownership from deployed contracts with Wagmi.
- `backend/app/presentation`: FastAPI routes exposed in Swagger at `/docs`.
- `backend/app/domain`: Pydantic models, ports, and use cases. This layer depends on abstractions, not MongoDB or Web3 directly.
- `backend/app/infrastructure`: MongoDB repository and Web3 contract deployer/mint client.
- `blockchain/`: Forge project containing the ERC721 ticket contract, tests, and deploy script.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

## API and contract configuration

Create `frontend/.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_TICKET_CHAIN_ID=11155111
VITE_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

Create `backend/.env` from `backend/.env.example` and set:

```bash
RPC_URL=https://ethereum-sepolia-rpc.publicnode.com/
DEPLOYER_PRIVATE_KEY=your_sepolia_private_key
TICKET_ARTIFACT_PATH=../blockchain/out/Ticket.sol/Ticket.json
```

Never put private keys in frontend env files.

## API Routes

- `GET /events`
- `POST /events`
- `GET /events/{eventId}`
- `GET /events/{eventId}/categories`
- `POST /events/{eventId}/categories`
- `POST /checkout/card`
- `GET /health`

Swagger UI is available at `http://localhost:8000/docs`.

The ticket contract exposes:

- `buy(uint256 quantity)` payable
- `mint(address to, uint256 quantity)` only owner
- `ticketsOf(address account)` view returns `uint256[]`

For real category deployment, compile the Solidity artifact first:

```bash
cd blockchain
forge build
```

Then run the backend with `DEPLOYER_PRIVATE_KEY` set. `POST
/events/{eventId}/categories` deploys one `Ticket.sol` contract for the new
category on Sepolia and stores the real address. `POST /checkout/card` mints to
the buyer wallet through that stored contract address.

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

- The frontend does not seed static events at runtime; events and categories come from the API.
- Ticket ownership is read from chain with `ticketsOf(address)`.
- The course says `ERC720` in some notes, but the Solidity skeleton and OpenZeppelin import are `ERC721`; this project follows the skeleton: one ticket category is represented by one deployed ticket contract.
