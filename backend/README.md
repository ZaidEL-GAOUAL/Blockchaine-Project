# Backend

This folder is intentionally reserved for the backend/API work developed by the backend teammate.

The frontend can already call the category deployer endpoint when `VITE_API_BASE_URL` is set in `frontend/.env.local`.

Expected endpoint:

```text
POST /events/:eventId/categories
```

Expected request body:

```json
{
  "name": "VIP",
  "symbol": "VIP",
  "description": "VIP ticket category",
  "priceEth": 0.1,
  "priceEur": 80,
  "maxSupply": 100,
  "metadataUri": "ipfs://...",
  "benefits": ["Collectible NFT ticket"]
}
```

Expected response body:

```json
{
  "category": {},
  "deployment": {
    "contractAddress": "0x..."
  }
}
```

The frontend will store the returned `contractAddress` and use it for the buyer ETH checkout.
