"""
Application configuration.

Loads settings from environment variables (.env file) so that
secrets like API keys never get hardcoded or committed to source control.
"""

import os
from dotenv import load_dotenv

# Load variables from .env into the process environment
load_dotenv()


class Settings:
    """Central place for all configurable values used by the app."""

    # Gemini API
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    GEMINI_API_URL = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent"
    )

    # Flask
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = FLASK_ENV == "development"
    PORT = int(os.getenv("PORT", 5000))

    # CORS - which frontend origins are allowed to call this API
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

    @classmethod
    def validate(cls):
        """Fail fast on startup if required secrets are missing."""
        if not cls.GEMINI_API_KEY or cls.GEMINI_API_KEY == "your_gemini_api_key_here":
            raise RuntimeError(
                "GEMINI_API_KEY is not set or is still the placeholder value. "
                "Add your real Gemini API key to the backend/.env file before starting the server."
            )


settings = Settings
