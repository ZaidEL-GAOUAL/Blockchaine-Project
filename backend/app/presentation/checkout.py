"""Checkout routes (presentation layer)."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.dependencies import EventServiceDep
from app.domain.models import CardCheckoutPayload, CardCheckoutResponse
from app.domain.ports import ContractDeploymentError
from app.domain.services import (
    EventNotFoundError,
    TicketCategoryNotFoundError,
    TicketSupplyError,
)

router = APIRouter(prefix="/checkout", tags=["checkout"])


@router.post(
    "/card",
    response_model=CardCheckoutResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Accept an off-chain card checkout and mint tickets",
)
async def pay_by_card(
    payload: CardCheckoutPayload,
    service: EventServiceDep,
) -> CardCheckoutResponse:
    try:
        tx_hash = await service.pay_by_card(payload)
    except EventNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found.",
        )
    except TicketCategoryNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket category not found.",
        )
    except TicketSupplyError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except ContractDeploymentError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))

    return CardCheckoutResponse(tx_hash=tx_hash)
