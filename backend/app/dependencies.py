"""Dependency injection wiring.

FastAPI's `Depends` is the composition root: it builds the concrete
infrastructure (Mongo repo) and injects it into the domain service, which the
routes receive. Swapping the implementation (e.g. a fake in tests) is a single
`app.dependency_overrides[...]` away.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.domain.ports import ContractDeployer, EventRepository
from app.domain.services import EventService
from app.infrastructure.blockchain import PlaceholderContractDeployer
from app.infrastructure.mongo_repository import MongoEventRepository


def get_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.db


def get_event_repository(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
) -> EventRepository:
    return MongoEventRepository(db)


def get_contract_deployer() -> ContractDeployer:
    # Placeholder for now; swap for a Web3ContractDeployer once the
    # Solidity contract is compiled.
    return PlaceholderContractDeployer()


def get_event_service(
    repo: Annotated[EventRepository, Depends(get_event_repository)],
    deployer: Annotated[ContractDeployer, Depends(get_contract_deployer)],
) -> EventService:
    return EventService(repo, deployer)


EventServiceDep = Annotated[EventService, Depends(get_event_service)]
