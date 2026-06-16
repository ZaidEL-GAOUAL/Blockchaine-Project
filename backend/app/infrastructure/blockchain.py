"""Contract deployer implementations."""

from __future__ import annotations

import asyncio
import json
from pathlib import Path

from web3 import Web3

from app.domain.ports import (
    ContractDeployer,
    ContractDeploymentConfigError,
    ContractDeploymentError,
)


class Web3ContractDeployer(ContractDeployer):
    """Deploys the Forge Ticket contract to the configured EVM network."""

    def __init__(
        self,
        *,
        rpc_url: str,
        private_key: str,
        artifact_path: str,
        receipt_timeout_seconds: int = 180,
    ) -> None:
        self._rpc_url = rpc_url
        self._private_key = private_key
        self._artifact_path = Path(artifact_path)
        self._receipt_timeout_seconds = receipt_timeout_seconds

    async def deploy_ticket_contract(
        self,
        *,
        name: str,
        symbol: str,
        max_supply: int,
        metadata_uri: str,
        price_wei: int,
    ) -> str:
        return await asyncio.to_thread(
            self._deploy_sync,
            name,
            symbol,
            max_supply,
            metadata_uri,
            price_wei,
        )

    async def mint_tickets(
        self,
        *,
        contract_address: str,
        recipient: str,
        quantity: int,
    ) -> str:
        return await asyncio.to_thread(
            self._mint_sync,
            contract_address,
            recipient,
            quantity,
        )

    @staticmethod
    def _normalise_private_key(private_key: str) -> str:
        key = private_key.strip()
        if not key:
            raise ContractDeploymentConfigError(
                "DEPLOYER_PRIVATE_KEY is required for real contract deployment."
            )
        return key if key.startswith("0x") else f"0x{key}"

    def _load_artifact(self) -> tuple[list[dict], str]:
        if not self._artifact_path.exists():
            raise ContractDeploymentConfigError(
                f"Contract artifact not found at {self._artifact_path}. "
                "Run `forge build` from the blockchain folder first."
            )

        with self._artifact_path.open() as artifact_file:
            artifact = json.load(artifact_file)

        abi = artifact.get("abi")
        bytecode_value = artifact.get("bytecode", {})
        bytecode = (
            bytecode_value.get("object")
            if isinstance(bytecode_value, dict)
            else bytecode_value
        )

        if not abi or not bytecode:
            raise ContractDeploymentConfigError(
                "Ticket artifact must include both abi and bytecode."
            )

        if not bytecode.startswith("0x"):
            bytecode = f"0x{bytecode}"

        return abi, bytecode

    @staticmethod
    def _add_fee_fields(w3: Web3, tx_params: dict) -> None:
        try:
            latest_block = w3.eth.get_block("latest")
            base_fee = latest_block.get("baseFeePerGas")
            if base_fee is not None:
                priority_fee = w3.eth.max_priority_fee
                tx_params["maxPriorityFeePerGas"] = priority_fee
                tx_params["maxFeePerGas"] = (base_fee * 2) + priority_fee
                return
        except Exception:
            pass

        tx_params["gasPrice"] = w3.eth.gas_price

    def _deploy_sync(
        self,
        name: str,
        symbol: str,
        max_supply: int,
        metadata_uri: str,
        price_wei: int,
    ) -> str:
        private_key = self._normalise_private_key(self._private_key)
        abi, bytecode = self._load_artifact()
        w3 = Web3(Web3.HTTPProvider(self._rpc_url, request_kwargs={"timeout": 60}))

        if not w3.is_connected():
            raise ContractDeploymentError(
                f"Could not connect to blockchain RPC at {self._rpc_url}."
            )

        account = w3.eth.account.from_key(private_key)
        constructor = w3.eth.contract(abi=abi, bytecode=bytecode).constructor(
            name,
            symbol,
            max_supply,
            metadata_uri,
            price_wei,
        )

        tx_params = {
            "from": account.address,
            "nonce": w3.eth.get_transaction_count(account.address),
            "chainId": w3.eth.chain_id,
        }
        self._add_fee_fields(w3, tx_params)

        gas_estimate = constructor.estimate_gas({"from": account.address})
        tx_params["gas"] = int(gas_estimate * 1.2)

        transaction = constructor.build_transaction(tx_params)
        signed = account.sign_transaction(transaction)
        raw_transaction = getattr(signed, "raw_transaction", None) or getattr(
            signed, "rawTransaction"
        )

        tx_hash = w3.eth.send_raw_transaction(raw_transaction)
        receipt = w3.eth.wait_for_transaction_receipt(
            tx_hash, timeout=self._receipt_timeout_seconds
        )

        if receipt.get("status") != 1:
            raise ContractDeploymentError(
                f"Ticket deployment transaction failed: {tx_hash.hex()}."
            )

        contract_address = receipt.get("contractAddress")
        if not contract_address:
            raise ContractDeploymentError(
                f"Deployment receipt had no contract address: {tx_hash.hex()}."
            )

        return Web3.to_checksum_address(contract_address)

    def _mint_sync(
        self,
        contract_address: str,
        recipient: str,
        quantity: int,
    ) -> str:
        private_key = self._normalise_private_key(self._private_key)
        abi, _bytecode = self._load_artifact()
        w3 = Web3(Web3.HTTPProvider(self._rpc_url, request_kwargs={"timeout": 60}))

        if not w3.is_connected():
            raise ContractDeploymentError(
                f"Could not connect to blockchain RPC at {self._rpc_url}."
            )

        if not Web3.is_address(contract_address):
            raise ContractDeploymentError("Ticket category has an invalid contract address.")

        if not Web3.is_address(recipient):
            raise ContractDeploymentError("Buyer wallet address is invalid.")

        account = w3.eth.account.from_key(private_key)
        contract = w3.eth.contract(
            address=Web3.to_checksum_address(contract_address),
            abi=abi,
        )
        mint_call = contract.functions.mint(
            Web3.to_checksum_address(recipient),
            quantity,
        )

        tx_params = {
            "from": account.address,
            "nonce": w3.eth.get_transaction_count(account.address),
            "chainId": w3.eth.chain_id,
        }
        self._add_fee_fields(w3, tx_params)

        gas_estimate = mint_call.estimate_gas({"from": account.address})
        tx_params["gas"] = int(gas_estimate * 1.2)

        transaction = mint_call.build_transaction(tx_params)
        signed = account.sign_transaction(transaction)
        raw_transaction = getattr(signed, "raw_transaction", None) or getattr(
            signed, "rawTransaction"
        )

        tx_hash = w3.eth.send_raw_transaction(raw_transaction)
        receipt = w3.eth.wait_for_transaction_receipt(
            tx_hash, timeout=self._receipt_timeout_seconds
        )

        if receipt.get("status") != 1:
            raise ContractDeploymentError(
                f"Ticket mint transaction failed: {tx_hash.hex()}."
            )

        return tx_hash.hex()
