"""Event routes (presentation layer).

Thin: validate input, call the domain service, translate domain errors to HTTP.
No business logic here. Every route is documented so FastAPI's Swagger UI
(/docs) exposes them for testing, as required by the subject.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.dependencies import EventServiceDep
from app.domain.models import (
    CreateCategoryPayload,
    CreateCategoryResponse,
    CreateEventPayload,
    Deployment,
    Event,
    TicketCategory,
)
from app.domain.ports import ContractDeploymentError
from app.domain.services import EventNotFoundError

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[Event], summary="List all events")
async def list_events(service: EventServiceDep) -> list[Event]:
    return await service.list_events()


@router.post(
    "",
    response_model=Event,
    status_code=status.HTTP_201_CREATED,
    summary="Create an event",
)
async def create_event(
    payload: CreateEventPayload, service: EventServiceDep
) -> Event:
    return await service.create_event(payload)


@router.get("/{event_id}", response_model=Event, summary="Get one event")
async def get_event(event_id: str, service: EventServiceDep) -> Event:
    try:
        return await service.get_event(event_id)
    except EventNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Event not found."
        )


@router.get(
    "/{event_id}/categories",
    response_model=list[TicketCategory],
    summary="List ticket categories for an event",
)
async def list_categories(
    event_id: str, service: EventServiceDep
) -> list[TicketCategory]:
    try:
        return await service.list_categories(event_id)
    except EventNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Event not found."
        )


@router.post(
    "/{event_id}/categories",
    response_model=CreateCategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a ticket category (deploys its NFT contract)",
)
async def create_category(
    event_id: str,
    payload: CreateCategoryPayload,
    service: EventServiceDep,
) -> CreateCategoryResponse:
    try:
        category = await service.create_category(event_id, payload)
    except EventNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Event not found."
        )
    except ContractDeploymentError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        )
    return CreateCategoryResponse(
        category=category,
        deployment=Deployment(
            contract_address=category.contract_address,
            symbol=category.symbol,
        ),
    )
