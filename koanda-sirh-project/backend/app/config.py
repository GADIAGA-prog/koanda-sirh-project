"""Configuration centrale (lue depuis les variables d'environnement)."""
import os


class Settings:
    # Base de données : SQLite par défaut, PostgreSQL en production via DATABASE_URL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./koanda_sirh.db")

    # Sécurité JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-change-me-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

    # Mot de passe par défaut des comptes de démonstration
    DEMO_PASSWORD: str = os.getenv("DEMO_PASSWORD", "koanda2026")

    # CORS (front-end)
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "*").split(",")


settings = Settings()
