from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    app_version: str = "0.1.0"
    debug: bool = False

    wazuh_host: str = "https://localhost:55000"
    wazuh_indexer_host: str = "https://localhost:9200"
    wazuh_user: str = "wazuh"
    wazuh_pass: str = ""

    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    database_url: str = "sqlite+aiosqlite:///./data/siem.db"

    cors_origins: list[str] = ["http://localhost:8080", "http://localhost:5173"]


settings = Settings()
