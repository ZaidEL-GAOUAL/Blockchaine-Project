# Ticketing Backend - NFT ticketing platform

FastAPI + MongoDB API for the NFT ticketing practice. Serves event/ticket data
to the React frontend, deploys NFT contracts for ticket categories, and mints
tickets after an off-chain card payment.

## Stack
- **FastAPI** (async) - REST API + auto Swagger at `/docs`
- **MongoDB** via **motor** (async driver)
- **web3.py** - blockchain interaction (deploy / mint / withdraw)
- **pydantic-settings** - config & secrets from env

## Architecture (3 layers)
```
app/
  presentation/   # HTTP routes only - validate, call service, map errors
  domain/         # business logic; depends on ports (abstract), never on infra
    models.py     # pydantic models, serialised camelCase to match the frontend
    ports.py      # abstract interfaces (EventRepository, ...)
    services.py   # use cases (EventService)
  infrastructure/ # concrete adapters (Mongo repo, blockchain client, IPFS)
  dependencies.py # DI composition root (FastAPI Depends)
  config.py       # settings / secrets
```
Routes depend on the **domain service**, which depends on a **port**, which the
**infra** implements. Tests swap real adapters for in-memory fakes via
`app.dependency_overrides`.

## Run it
The database runs in Docker; the API runs on your machine (faster to iterate).

```bash
# 1. secrets - create your local .env from the template
cp .env.example .env        # then edit values if needed

# 2. database - start MongoDB in Docker (detached)
docker compose up -d        # Mongo on localhost:27017
#   docker compose ps       -> check it's running
#   docker compose logs -f  -> follow logs
#   docker compose down     -> stop (keeps data)
#   docker compose down -v  -> stop AND wipe the database volume

# 3. deps
pip install -e ".[dev]"     # app + test tools (or: uv sync)

# 4. API - runs on the host, connects to Mongo at localhost
uvicorn app.main:app --reload
# -> http://localhost:8000/docs
```

## Inspect the database (MongoDB Compass)
Connect Compass with this connection string (matches the .env defaults):
```
mongodb://admin:changeme@localhost:27017/?authSource=admin
```
- `admin` / `changeme` = `MONGO_USER` / `MONGO_PASSWORD` from your `.env`
- `authSource=admin` is required: the root user is created in the `admin`
  database, even though the app stores data in the `ticketing` database.

Once connected, open the **`ticketing`** database -> **`events`** collection to
see documents created via the API.

## Tests
```bash
uv run --extra dev python -m pytest
```

## API contract (matches frontend `frontend/src/shared/types/models.ts`)
| Method | Route | Description |
|---|---|---|
| GET | `/events` | list events |
| POST | `/events` | create event |
| GET | `/events/{id}` | get one event (with categories) |
| GET | `/events/{id}/categories` | list ticket categories |
| POST | `/events/{id}/categories` | create category, deploys NFT contract, returns `{category, deployment}` |
| POST | `/checkout/card` | accepts card checkout data and mints tickets to the buyer wallet |
| GET | `/health` | liveness |

`POST /events/{id}/categories` and `POST /checkout/card` use the
`Web3ContractDeployer`. `DEPLOYER_PRIVATE_KEY` must be set to a Sepolia wallet
that owns the deployed category contracts. If the private key or compiled
artifact is missing, the API returns a clear error instead of fake data.

## Real Sepolia category deployment

Compile the Solidity contract first:

```bash
cd ../blockchain
forge build
```

Then set these values in `backend/.env`:

```bash
RPC_URL=https://ethereum-sepolia-rpc.publicnode.com/
DEPLOYER_PRIVATE_KEY=your_private_key
TICKET_ARTIFACT_PATH=../blockchain/out/Ticket.sol/Ticket.json
```

Now `POST /events/{id}/categories` deploys one new `Ticket.sol` ERC721
contract for that category and stores the real contract address. `POST
/checkout/card` then calls `mint(address,uint256)` on that contract.
