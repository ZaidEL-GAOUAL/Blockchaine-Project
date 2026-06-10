"""Application settings.

All configuration and secrets come from the environment (loaded from a
gitignored `.env` in development). Nothing sensitive is hardcoded.
"""

from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_TICKET_ARTIFACT_PATH = (
    REPO_ROOT / "blockchain" / "out" / "Ticket.sol" / "Ticket.json"
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- MongoDB ---
    mongo_user: str = "admin"
    mongo_password: str = "changeme"
    mongo_host: str = "localhost"
    mongo_port: int = 27017
    mongo_db: str = "ticketing"

    # --- Blockchain (used later for deploy / mint / withdraw) ---
    rpc_url: str = "https://ethereum-sepolia-rpc.publicnode.com/"
    deployer_private_key: str = ""
    contract_deployer_mode: str = "auto"
    ticket_artifact_path: str = str(DEFAULT_TICKET_ARTIFACT_PATH)

    # --- IPFS / Pinata (used later) ---
    pinata_jwt: str = ""

    # --- CORS: where the frontend runs in dev ---
    frontend_origin: str = "http://localhost:5173"

    @property
    def mongo_uri(self) -> str:
        return (
            f"mongodb://{self.mongo_user}:{self.mongo_password}"
            f"@{self.mongo_host}:{self.mongo_port}/"
        )

    @property
    def use_web3_deployer(self) -> bool:
        mode = self.contract_deployer_mode.lower()
        if mode == "web3":
            return True
        if mode == "placeholder":
            return False
        return bool(self.deployer_private_key)

    @property
    def resolved_ticket_artifact_path(self) -> str:
        path = Path(self.ticket_artifact_path)
        if path.is_absolute():
            return str(path)
        return str((BACKEND_ROOT / path).resolve())


settings = Settings()
