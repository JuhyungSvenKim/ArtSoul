from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str = ""
    supabase_url: str = "https://chorbmxylvhofievnpti.supabase.co"
    supabase_service_key: str = ""
    # Supabase DB 직접 연결 (Settings > Database > Connection string)
    database_url: str = ""
    embedding_model: str = "models/text-embedding-004"
    gemini_model: str = "gemini-2.0-flash"

    class Config:
        env_file = ".env"


settings = Settings()
