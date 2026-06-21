"""
Chatbot & Voice Assistant routes.

Both the chatbot UI and the voice assistant UI hit the same /api/chat
endpoint - the only difference is whether the frontend captured the
message via typing or via the browser's SpeechRecognition API. Keeping
one endpoint avoids duplicating the Gemini call logic for two "modes".
"""

import logging
from flask import Blueprint, request, jsonify

from services.gemini_service import gemini_service, GeminiServiceError

logger = logging.getLogger(__name__)

chatbot_bp = Blueprint("chatbot", __name__, url_prefix="/api")


@chatbot_bp.route("/chat", methods=["POST"])
def chat():
    """
    Accepts a user message and optional conversation history,
    forwards it to Gemini, and returns the AI's reply.

    Request body:
        {
            "message": "Hello AI",
            "history": [{"role": "user", "text": "..."}, {"role": "model", "text": "..."}]
        }

    Response body:
        { "response": "Hello, how can I help you?" }
    """
    payload = request.get_json(silent=True)

    if not payload or "message" not in payload:
        logger.warning("Chat request missing 'message' field")
        return jsonify({"error": "Request body must include a 'message' field."}), 400

    user_message = payload["message"].strip() if isinstance(payload["message"], str) else ""

    if not user_message:
        return jsonify({"error": "Message cannot be empty."}), 400

    if len(user_message) > 4000:
        return jsonify({"error": "Message is too long. Please keep it under 4000 characters."}), 400

    history = payload.get("history", [])

    try:
        ai_reply = gemini_service.generate_response(user_message, history)
    except GeminiServiceError as exc:
        error_msg = str(exc)
        logger.error("Gemini service error: %s", error_msg)
        # Use 429 status for quota errors so frontend can differentiate
        if "429" in error_msg or "quota" in error_msg.lower() or "rate limit" in error_msg.lower():
            return jsonify({"error": "⚠️ API quota exceeded. Please check your Gemini API plan at https://aistudio.google.com — your free tier limit may be 0. Try generating a new API key or enabling billing."}), 429
        return jsonify({"error": error_msg}), 502

    return jsonify({"response": ai_reply}), 200


@chatbot_bp.route("/health", methods=["GET"])
def health_check():
    """Simple endpoint to verify the API is up - handy for quick demos."""
    return jsonify({"status": "ok", "service": "AI Assistant Hub backend"}), 200
