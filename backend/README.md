# Ticketing Backend - NFT ticketing platform

FastAPI + MongoDB API for the NFT ticketing practice. Serves event/ticket data
to the React frontend and (in later steps) deploys NFT contracts, mints on
card payment, and reads ownership from chain.

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
uv run pytest
```

## API contract (matches frontend `frontend/src/shared/types/models.ts`)
| Method | Route | Description |
|---|---|---|
| GET | `/events` | list events |
| POST | `/events` | create event |
| GET | `/events/{id}` | get one event (with categories) |
| GET | `/events/{id}/categories` | list ticket categories |
| POST | `/events/{id}/categories` | create category, deploys NFT contract, returns `{category, deployment}` |
| GET | `/health` | liveness |

> The contract deployment behind `POST /events/{id}/categories` is currently a
> **placeholder** (`PlaceholderContractDeployer`) returning a fake address, so
> the frontend integration works before the Solidity contract exists. Replace
> it with a `Web3ContractDeployer` (see `app/infrastructure/blockchain.py`)
> using `../blockchain/out/Ticket.sol/Ticket.json` once the Forge contract is
> compiled. No change is needed in services/routes.
>
> Coming next: `POST /events/pay` (card checkout + mint),
> `GET /tickets?account=` (owned tickets),
> `POST /categories/{id}/withdraw` (seller collects ETH).
