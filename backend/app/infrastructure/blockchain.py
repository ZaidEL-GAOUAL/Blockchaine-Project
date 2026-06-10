"""Contract deployer implementations.

`PlaceholderContractDeployer` does NOT touch any blockchain. It returns a
deterministic, fake-but-address-shaped string so the full create-category flow
(API + DB + frontend) works end-to-end before the Solidity contract exists.

When the Forge contract is ready, add a `Web3ContractDeployer` here that:
  - loads the compiled ABI + bytecode,
  - sends a deploy transaction signed with settings.deployer_private_key,
  - waits for the receipt and returns receipt.contractAddress.
Swap it in `app/dependencies.py` — services and routes stay untouched.
"""

from __future__ import annotations

import hashlib

from app.domain.ports import ContractDeployer


class PlaceholderContractDeployer(ContractDeployer):
    async def deploy_ticket_contract(
        self,
        *,
        name: str,
        symbol: str,
        max_supply: int,
        price_wei: int,
    ) -> str:
        seed = f"{name}|{symbol}|{max_supply}|{price_wei}".encode()
        digest = hashlib.sha256(seed).hexdigest()[:40]
        return f"0x{digest}"
