"""
AI Assistant Hub - Backend Entry Point

Run with:  python app.py

Uses the app factory pattern (create_app) so the app can be imported
and tested without immediately starting a server, and so configuration
stays out of the global scope.
"""

import logging
from flask import Flask
from flask_cors import CORS

from config.settings import settings
from routes.chatbot_routes import chatbot_bp


def configure_logging():
    """Set up consistent log formatting for the whole app."""
    logging.basicConfig(
        level=logging.DEBUG if settings.DEBUG else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )


def create_app() -> Flask:
    """Build and configure the Flask application."""
    configure_logging()
    settings.validate()

    app = Flask(__name__)

    # Allow the React dev server (and any deployed frontend origin) to call this API
    CORS(app, resources={r"/api/*": {"origins": settings.ALLOWED_ORIGINS}})

    app.register_blueprint(chatbot_bp)

    @app.errorhandler(404)
    def not_found(_error):
        return {"error": "Resource not found."}, 404

    @app.errorhandler(500)
    def server_error(_error):
        logging.getLogger(__name__).exception("Unhandled server error")
        return {"error": "Internal server error."}, 500

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=settings.PORT, debug=settings.DEBUG)
