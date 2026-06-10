# Blockchain

Basic Forge project for the NFT ticket contract used by the ticketing app.

The course idea is: one event can have several ticket categories, and each
ticket category is one deployed ERC721 contract.

## Install

Dependencies are committed as Forge submodules. After cloning the repo, run:

```bash
git submodule update --init --recursive
```

The required course dependency was added with:

```bash
forge install OpenZeppelin/openzeppelin-contracts-upgradeable
```

## Test

```bash
forge test
```

## Deploy To Sepolia

Create a local `.env` file or export these variables in your shell:

```bash
SEPOLIA_RPC=https://ethereum-sepolia-rpc.publicnode.com/
PRIVATE_KEY=your_wallet_private_key
TICKET_NAME="Demo Ticket"
TICKET_SYMBOL=DTIX
MAX_SUPPLY=100
TICKET_URI=ipfs://your-metadata-uri
PRICE_WEI=10000000000000000
```

Then deploy:

```bash
source .env
forge script script/Deploy.s.sol --rpc-url "$SEPOLIA_RPC" --broadcast
```

After deployment, copy the contract address into the event category in the
backend/frontend configuration.
