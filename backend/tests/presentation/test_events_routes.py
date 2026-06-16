import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_event_service
from app.domain.models import Event, TicketCategory
from app.domain.services import EventService
from app.main import app
from tests.fakes import FakeContractDeployer, FakeEventRepository


@pytest.fixture
def client():
    seed = Event(
        id="aurora-city-live",
        title="Aurora City Live",
        organizer="Nova Nights",
        date="2026-09-18T20:30:00.000Z",
        venue="Grand Hall, Paris",
        categories=[
            TicketCategory(
                id="aurora-general",
                event_id="aurora-city-live",
                name="General",
                symbol="GEN",
                price_eth=0.01,
                price_eur=10,
                max_supply=100,
                contract_address="0x1111111111111111111111111111111111111111",
            )
        ],
    )
    repo = FakeEventRepository([seed])
    deployer = FakeContractDeployer(address="0xDEADBEEF")
    app.dependency_overrides[get_event_service] = lambda: EventService(
        repo, deployer
    )
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_list_events(client):
    resp = client.get("/events")
    assert resp.status_code == 200
    assert resp.json()[0]["id"] == "aurora-city-live"


def test_get_event_404(client):
    resp = client.get("/events/nope")
    assert resp.status_code == 404


def test_create_event_returns_camelcase(client):
    resp = client.post(
        "/events",
        json={
            "title": "Night Two",
            "organizer": "Nova",
            "date": "2026-10-01T20:00:00.000Z",
            "venue": "Hall B",
            "description": "d",
            "heroImage": "https://example.com/y.jpg",
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["id"] == "night-two"
    # contract with frontend is camelCase
    assert "heroImage" in body
    assert body["categories"] == []


def test_create_category_matches_frontend_contract(client):
    resp = client.post(
        "/events/aurora-city-live/categories",
        json={
            "name": "General Admission",
            "symbol": "AUR-GA",
            "description": "ga",
            "priceEth": 0.08,
            "priceEur": 49,
            "maxSupply": 500,
            "metadataUri": "ipfs://x",
            "benefits": ["NFT ticket"],
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    # exact shape the frontend api-client reads
    assert body["deployment"]["contractAddress"] == "0xDEADBEEF"
    assert body["deployment"]["symbol"] == "AUR-GA"
    assert body["category"]["contractAddress"] == "0xDEADBEEF"
    assert body["category"]["priceEth"] == 0.08
    assert body["category"]["mintedCount"] == 0


def test_create_category_unknown_event_404(client):
    resp = client.post(
        "/events/nope/categories",
        json={
            "name": "X",
            "symbol": "X",
            "priceEth": 0.1,
            "priceEur": 80,
            "maxSupply": 10,
        },
    )
    assert resp.status_code == 404


def test_card_checkout_mints_ticket(client):
    resp = client.post(
        "/checkout/card",
        json={
            "eventId": "aurora-city-live",
            "categoryId": "aurora-general",
            "quantity": 1,
            "cardholderName": "Zaid",
            "cardNumber": "4242424242424242",
            "expiration": "09/28",
            "cvc": "123",
            "walletAddress": "0x2222222222222222222222222222222222222222",
        },
    )

    assert resp.status_code == 201
    assert resp.json()["txHash"] == "0xFAKEMINT"


def test_card_checkout_unknown_category_404(client):
    resp = client.post(
        "/checkout/card",
        json={
            "eventId": "aurora-city-live",
            "categoryId": "missing",
            "quantity": 1,
            "cardholderName": "Zaid",
            "cardNumber": "4242424242424242",
            "expiration": "09/28",
            "cvc": "123",
            "walletAddress": "0x2222222222222222222222222222222222222222",
        },
    )

    assert resp.status_code == 404
