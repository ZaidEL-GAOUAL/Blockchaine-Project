"""Application settings.

All configuration and secrets come from the environment (loaded from a
gitignored `.env` in development). Nothing sensitive is hardcoded.
"""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- MongoDB ---
    mongo_user: str = "admin"
    mongo_password: str = "changeme"
    mongo_host: str = "localhost"
    mongo_port: int = 27017
    mongo_db: str = "ticketing"

    # --- Blockchain (used later for deploy / mint / withdraw) ---
    rpc_url: str = "http://127.0.0.1:8545"
    deployer_private_key: str = ""

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


settings = Settings()
