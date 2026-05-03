from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_INSECURE_DEFAULTS = {"", "change-me-in-production"}
_MIN_SECRET_LEN = 32


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    app_version: str = "0.1.0"
    debug: bool = False

    wazuh_host: str = "https://localhost:55000"
    wazuh_indexer_host: str = "https://localhost:9200"
    wazuh_user: str = "wazuh"
    wazuh_pass: str = ""

    secret_key: str = "change-me-in-production"  # noqa: S105
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    database_url: str = "sqlite+aiosqlite:///./data/siem.db"

    cors_origins: list[str] = ["http://localhost:8080", "http://localhost:5173"]

    cookie_secure: bool = False
    trusted_proxy: bool = False

    @field_validator("secret_key")
    @classmethod
    def _validate_secret_key(cls, v: str) -> str:
        if v in _INSECURE_DEFAULTS or len(v) < _MIN_SECRET_LEN:
            msg = "SECRET_KEY must be a random value of at least 32 characters"
            raise ValueError(msg)
        return v


settings = Settings()
