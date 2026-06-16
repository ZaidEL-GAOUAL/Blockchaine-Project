"""Ports: abstract interfaces the domain depends on.

The domain layer declares *what* it needs (these ABCs); the infrastructure
layer provides *how* (Mongo, in-memory, etc.). This is what makes the
services trivially testable with mocks / fakes and satisfies the
"dependency injection" expectation from the subject.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from app.domain.models import Event, TicketCategory


class ContractDeploymentError(Exception):
    """Raised when deploying a ticket contract fails."""


class ContractDeploymentConfigError(ContractDeploymentError):
    """Raised when the deployment adapter is missing required configuration."""


class EventRepository(ABC):
    @abstractmethod
    async def list_events(self) -> list[Event]: ...

    @abstractmethod
    async def get_event(self, event_id: str) -> Event | None: ...

    @abstractmethod
    async def event_id_exists(self, event_id: str) -> bool: ...

    @abstractmethod
    async def insert_event(self, event: Event) -> Event: ...

    @abstractmethod
    async def add_category(
        self, event_id: str, category: TicketCategory
    ) -> TicketCategory: ...

    @abstractmethod
    async def increment_category_minted_count(
        self, event_id: str, category_id: str, quantity: int
    ) -> None: ...


class ContractDeployer(ABC):
    """Deploys an NFT ticket contract for one category and returns its address.

    The domain depends on this abstraction only. The production implementation
    uses web3.py; tests provide fakes through dependency injection.
    """

    @abstractmethod
    async def deploy_ticket_contract(
        self,
        *,
        name: str,
        symbol: str,
        max_supply: int,
        metadata_uri: str,
        price_wei: int,
    ) -> str: ...

    @abstractmethod
    async def mint_tickets(
        self,
        *,
        contract_address: str,
        recipient: str,
        quantity: int,
    ) -> str: ...
