# 🤖 AI Assistant Hub

A full-stack AI application combining a **Voice Assistant** and a **Chatbot** in one modern, futuristic interface — powered by **React**, **Flask**, and **Google Gemini API**.


![Mode](https://img.shields.io/badge/Modes-Voice%20%2B%20Chat-00d9ff) ![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Flask%20%7C%20Gemini-00ffcc)

---

## ✨ Features

- 🎙️ **Voice Assistant Mode** — speak naturally, get spoken AI replies back
  - Browser `SpeechRecognition` for speech-to-text
  - Browser `SpeechSynthesis` for text-to-speech
  - Animated glowing orb with Listening / Thinking / Speaking states
  - Keyboard shortcuts: `Space`/`Enter` to speak, `Esc` to stop
- 💬 **Chatbot Mode** — classic chat UI with typing indicator and message history
- 🔁 **Animated toggle switch** to flip between modes instantly
- 🌌 **Dark, neon glassmorphism UI** inspired by sci-fi voice interfaces
- 🔐 **Secure API key handling** via environment variables — never hardcoded
- 🧱 **Clean separation of concerns** — Flask blueprints + service layer, React components + API service layer

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (Vite), Axios, Custom CSS3 animations |
| Backend | Python, Flask, Flask-CORS |
| AI | Google Gemini API (`gemini-2.0-flash`) |
| Browser APIs | SpeechRecognition, SpeechSynthesis |

---

## 📁 Project Structure

```
ai-assistant-hub/
│
├── backend/
│   ├── app.py                   # Flask entry point (app factory)
│   ├── routes/
│   │   └── chatbot_routes.py    # /api/chat and /api/health endpoints
│   ├── services/
│   │   └── gemini_service.py    # Gemini API wrapper class
│   ├── config/
│   │   └── settings.py          # Env-based configuration
│   ├── .env.example
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ToggleSwitch.jsx
    │   │   ├── VoiceAssistant.jsx
    │   │   ├── ChatBot.jsx
    │   │   ├── Message.jsx
    │   │   └── Loader.jsx
    │   ├── services/
    │   │   └── api.js           # Axios client for backend communication
    │   ├── App.jsx
    │   └── App.css
    ├── index.html
    ├── .env.example
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A Google Gemini API key — get one free at [Google AI Studio](https://aistudio.google.com/app/apikey)
- Chrome or Edge (best support for the Speech Recognition API)

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
# then open .env and paste your Gemini API key

python app.py
```

The backend runs on `http://localhost:5000`.

### 2. Frontend Setup

```bash
cd frontend
npm install

cp .env.example .env   # default already points to localhost:5000

npm run dev
```

The frontend runs on `http://localhost:5173`.

Open that URL in your browser, allow microphone access, and try both modes.

---

## 🔌 API Reference

### `POST /api/chat`

**Request**
```json
{
  "message": "Hello AI",
  "history": [
    { "role": "user", "text": "Hi" },
    { "role": "model", "text": "Hello! How can I help?" }
  ]
}
```

**Response**
```json
{ "response": "Hello, how can I help you today?" }
```

### `GET /api/health`

Returns `{ "status": "ok" }` — useful for quickly verifying the backend is running.

---

## 🔮 Future Enhancements

- [ ] Persistent chat history (database-backed)
- [ ] User accounts and saved conversations
- [ ] Streaming Gemini responses (token-by-token)
- [ ] Voice selection / pitch & speed controls
- [ ] Deploy backend (Render/Railway) + frontend (Vercel)

---

## 📄 License

MIT License — free to use and modify.

---

**Built by [Ashutosh Chaudhary](https://www.linkedin.com/in/ashutosh-chaudhary9311)**
