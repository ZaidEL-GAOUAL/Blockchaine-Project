import pytest

from app.domain.ports import ContractDeploymentConfigError
from app.infrastructure.blockchain import (
    PlaceholderContractDeployer,
    Web3ContractDeployer,
)


async def test_placeholder_address_depends_on_metadata_uri():
    deployer = PlaceholderContractDeployer()

    first = await deployer.deploy_ticket_contract(
        name="VIP",
        symbol="VIP",
        max_supply=100,
        metadata_uri="ipfs://first",
        price_wei=10,
    )
    second = await deployer.deploy_ticket_contract(
        name="VIP",
        symbol="VIP",
        max_supply=100,
        metadata_uri="ipfs://second",
        price_wei=10,
    )

    assert first != second


async def test_web3_deployer_requires_private_key():
    deployer = Web3ContractDeployer(
        rpc_url="https://ethereum-sepolia-rpc.publicnode.com/",
        private_key="",
        artifact_path="missing.json",
    )

    with pytest.raises(ContractDeploymentConfigError):
        await deployer.deploy_ticket_contract(
            name="VIP",
            symbol="VIP",
            max_supply=100,
            metadata_uri="ipfs://vip",
            price_wei=10,
        )


async def test_web3_deployer_requires_compiled_artifact(tmp_path):
    deployer = Web3ContractDeployer(
        rpc_url="https://ethereum-sepolia-rpc.publicnode.com/",
        private_key="1" * 64,
        artifact_path=str(tmp_path / "missing.json"),
    )

    with pytest.raises(ContractDeploymentConfigError, match="forge build"):
        await deployer.deploy_ticket_contract(
            name="VIP",
            symbol="VIP",
            max_supply=100,
            metadata_uri="ipfs://vip",
            price_wei=10,
        )
