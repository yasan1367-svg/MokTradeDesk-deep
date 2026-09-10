from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./trading_desk.db"
    APP_NAME: str = "MokTradeDesk"
    DEBUG: bool = True

    class Config:
        env_file = ".env"

settings = Settings()