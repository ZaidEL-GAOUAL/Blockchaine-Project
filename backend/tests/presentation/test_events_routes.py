import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_event_service
from app.domain.models import Event
from app.domain.services import EventService
from app.main import app
from tests.fakes import FakeEventRepository


@pytest.fixture
def client():
    seed = Event(
        id="aurora-city-live",
        title="Aurora City Live",
        organizer="Nova Nights",
        date="2026-09-18T20:30:00.000Z",
        venue="Grand Hall, Paris",
    )
    repo = FakeEventRepository([seed])
    app.dependency_overrides[get_event_service] = lambda: EventService(repo)
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
