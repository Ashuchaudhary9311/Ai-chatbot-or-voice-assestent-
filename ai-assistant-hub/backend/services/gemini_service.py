"""
Gemini service layer.

Wraps all communication with Google's Generative AI (Gemini) API behind a
small class so that routes never talk to the external API directly.
This keeps the HTTP/JSON details of Gemini in one place, makes the service
easy to mock in tests, and means swapping providers later only touches
this file.
"""

import logging
import time
import requests

from config.settings import settings

logger = logging.getLogger(__name__)

# Ordered fallback list — tested and confirmed working models only.
# gemini-1.5-flash has been REMOVED from the API (causes 404).
# gemini-2.0-flash and gemini-2.0-flash-lite have 0 free-tier quota (429).
# gemini-2.5-flash-lite is confirmed working on the free tier.
FALLBACK_MODELS = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash-lite-001",
    "gemini-2.0-flash",
]


class GeminiServiceError(Exception):
    """Raised when the Gemini API call fails or returns something unexpected."""
    pass


class GeminiService:
    """Thin client around the Gemini generateContent REST endpoint."""

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.timeout_seconds = 30
        self.max_retries = 1
        self.retry_delay = 2  # seconds between retries

    def _get_api_url(self, model: str) -> str:
        return (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model}:generateContent"
        )

    def generate_response(self, user_message: str, conversation_history: list | None = None) -> str:
        """
        Send a user message (plus optional prior turns) to Gemini and return
        the model's text reply. Tries multiple models if quota is exceeded.

        Args:
            user_message: The latest message typed or spoken by the user.
            conversation_history: Optional list of {"role": "user"/"model", "text": "..."}
                                   dicts giving short-term context for the current session.

        Returns:
            The AI-generated reply as plain text.

        Raises:
            GeminiServiceError: if all models fail or the response can't be parsed.
        """
        contents = self._build_contents(user_message, conversation_history)

        # Build model list: try the configured model first, then fallbacks
        primary_model = settings.GEMINI_MODEL
        models_to_try = [primary_model] + [m for m in FALLBACK_MODELS if m != primary_model]

        last_error = None
        for model in models_to_try:
            api_url = self._get_api_url(model)
            logger.info("Trying model: %s", model)
            try:
                result = self._call_api(api_url, contents, model)
                logger.info("Success with model: %s", model)
                return result
            except GeminiServiceError as exc:
                last_error = exc
                error_str = str(exc)
                # Continue to next model for quota/rate/not-found errors
                if any(code in error_str for code in ["429", "404", "503"]) or \
                   any(word in error_str.lower() for word in ["quota", "rate limit", "not found", "exhausted"]):
                    logger.warning("Model '%s' failed (%s), trying next fallback...", model, error_str[:80])
                    continue
                else:
                    raise  # Auth error, bad request, etc. — don't retry

        # All models exhausted
        raise GeminiServiceError(
            "All AI models are currently unavailable. "
            "Your API key may have zero free-tier quota. "
            "Please visit https://aistudio.google.com/app/apikey to generate a fresh key, "
            "or enable billing at https://console.cloud.google.com/billing"
        )

    def _call_api(self, api_url: str, contents: list, model: str) -> str:
        """Make the actual HTTP request to Gemini with retry logic."""
        system_instruction = {
            "parts": [{"text": "You are a voice and chat assistant. Keep your responses very short, to the point, and maximum 1-2 lines long. Do NOT use any special characters, markdown formatting, asterisks, or emojis. Provide plain text only."}]
        }
        
        for attempt in range(self.max_retries + 1):
            try:
                response = requests.post(
                    f"{api_url}?key={self.api_key}",
                    json={"system_instruction": system_instruction, "contents": contents},
                    timeout=self.timeout_seconds,
                )

                # Handle specific HTTP error codes with clear messages
                if response.status_code == 429:
                    try:
                        error_body = response.json().get("error", {})
                        message = error_body.get("message", "Rate limit exceeded.")
                    except Exception:
                        message = "Rate limit exceeded."
                    logger.warning("Gemini 429 on model '%s'", model)
                    raise GeminiServiceError(f"429 quota exceeded: {message[:200]}")

                if response.status_code == 404:
                    logger.warning("Gemini 404 — model '%s' not found or removed.", model)
                    raise GeminiServiceError(f"404 not found: model '{model}' does not exist.")

                if response.status_code == 400:
                    try:
                        error_body = response.json().get("error", {})
                        message = error_body.get("message", "Bad request.")
                    except Exception:
                        message = "Bad request."
                    logger.error("Gemini 400 Bad Request on model '%s': %s", model, message)
                    raise GeminiServiceError(f"Invalid request: {message}")

                if response.status_code == 403:
                    logger.error("Gemini 403 Forbidden — API key invalid or lacks permissions.")
                    raise GeminiServiceError(
                        "Access denied (403). Your Gemini API key is invalid or lacks permissions. "
                        "Generate a new one at https://aistudio.google.com/app/apikey"
                    )

                if response.status_code == 503:
                    if attempt < self.max_retries:
                        logger.warning("Gemini 503 on model '%s', retrying in %ds...", model, self.retry_delay)
                        time.sleep(self.retry_delay)
                        continue
                    raise GeminiServiceError("503 The AI service is temporarily unavailable. Try again shortly.")

                response.raise_for_status()
                return self._extract_text(response.json())

            except requests.exceptions.Timeout:
                if attempt < self.max_retries:
                    logger.warning("Gemini timeout on model '%s', retrying...", model)
                    time.sleep(self.retry_delay)
                    continue
                raise GeminiServiceError("The AI service took too long to respond. Please try again.")

            except requests.exceptions.ConnectionError:
                raise GeminiServiceError(
                    "Cannot connect to the AI service. Please check your internet connection."
                )

            except requests.exceptions.HTTPError as exc:
                raise GeminiServiceError(f"HTTP error from AI service: {exc}")

            except GeminiServiceError:
                raise  # Already clean — bubble up

            except requests.exceptions.RequestException as exc:
                raise GeminiServiceError(f"Network error: {exc}")

        raise GeminiServiceError("Failed to get a response after retries.")

    @staticmethod
    def _build_contents(user_message: str, conversation_history: list | None) -> list:
        """Convert our simple history format into Gemini's `contents` schema."""
        contents = []

        if conversation_history:
            for turn in conversation_history:
                role = turn.get("role", "user")
                text = turn.get("text", "")
                if text.strip():  # Skip empty turns
                    contents.append({
                        "role": role,
                        "parts": [{"text": text}],
                    })

        contents.append({
            "role": "user",
            "parts": [{"text": user_message}],
        })
        return contents

    @staticmethod
    def _extract_text(payload: dict) -> str:
        """Pull the plain text reply out of Gemini's nested response structure."""
        try:
            candidates = payload.get("candidates", [])
            if not candidates:
                finish_reason = payload.get("promptFeedback", {}).get("blockReason", "")
                if finish_reason:
                    raise GeminiServiceError(f"Request blocked by safety filters: {finish_reason}")
                raise GeminiServiceError("No response candidates returned by the AI service.")

            content = candidates[0].get("content", {})
            parts = content.get("parts", [])
            text = "".join(part.get("text", "") for part in parts).strip()

            if not text:
                raise GeminiServiceError("The AI returned an empty response. Please rephrase and try again.")

            return text
        except GeminiServiceError:
            raise
        except (KeyError, IndexError, TypeError) as exc:
            logger.error("Unexpected Gemini response shape: %s", payload)
            raise GeminiServiceError("Received an unexpected response from the AI service.") from exc


# Single shared instance used across the app
gemini_service = GeminiService()
