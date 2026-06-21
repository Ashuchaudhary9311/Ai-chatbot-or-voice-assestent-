import { useState, useRef, useEffect, useCallback } from 'react'
import Message from './Message'
import Loader from './Loader'
import { sendChatMessage } from '../services/api'
import './VoiceAssistant.css'

// Browser Speech Recognition API has vendor prefixes depending on browser
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

/**
 * Voice Assistant mode.
 *
 * Flow: mic button -> browser SpeechRecognition converts speech to text
 * -> text sent to Flask backend -> Flask calls Gemini -> reply displayed
 * AND spoken back via the browser's SpeechSynthesis API.
 */
function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [history, setHistory] = useState([]) // {sender, text, timestamp}
  const [errorMessage, setErrorMessage] = useState('')
  const [isSupported, setIsSupported] = useState(true)

  const recognitionRef = useRef(null)
  const historyEndRef = useRef(null)

  // Set up the SpeechRecognition instance once on mount
  useEffect(() => {
    if (!SpeechRecognition) {
      setIsSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript
      setTranscript(spokenText)
      handleUserUtterance(spokenText)
    }

    recognition.onerror = (event) => {
      setErrorMessage(`Microphone error: ${event.error}. Please check permissions and try again.`)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-scroll to the latest message
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  const startListening = () => {
    if (!recognitionRef.current || isListening || isThinking) return
    setErrorMessage('')
    setTranscript('')
    setIsListening(true)
    recognitionRef.current.start()
  }

  const stopListening = () => {
    if (!recognitionRef.current) return
    recognitionRef.current.stop()
    setIsListening(false)
  }

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return

    // Cancel any in-progress speech before starting new speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    utterance.pitch = 1
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }, [])

  const handleUserUtterance = async (spokenText) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setHistory((prev) => [...prev, { sender: 'user', text: spokenText, timestamp }])
    setIsThinking(true)
    setErrorMessage('')

    try {
      const conversationContext = history.map((turn) => ({
        role: turn.sender === 'user' ? 'user' : 'model',
        text: turn.text,
      }))

      const aiReply = await sendChatMessage(spokenText, conversationContext)

      setHistory((prev) => [
        ...prev,
        { sender: 'ai', text: aiReply, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ])
      speak(aiReply)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsThinking(false)
    }
  }

  // Keyboard shortcuts: Space/Enter to start, Esc to stop - matches the
  // original Jarvis-style UI behavior from the reference project.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.code === 'Space' || event.code === 'Enter') && !isListening) {
        event.preventDefault()
        startListening()
      } else if (event.code === 'Escape' && isListening) {
        stopListening()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening])

  const orbStatusLabel = isListening
    ? "I'm listening..."
    : isThinking
    ? 'Thinking...'
    : isSpeaking
    ? 'Speaking...'
    : "What's on your mind?"

  if (!isSupported) {
    return (
      <div className="voice-assistant-container">
        <p className="voice-unsupported">
          Your browser doesn't support the Speech Recognition API. Please use Chrome or Edge for the Voice Assistant mode.
        </p>
      </div>
    )
  }

  return (
    <div className="voice-assistant-container">
      <div className="orb-wrapper">
        <div className={`orb-ring orb-ring-outer ${isListening ? 'pulse' : ''}`} />
        <div className={`orb-ring orb-ring-inner ${isListening ? 'pulse' : ''}`} />
        <button
          className={`orb ${isListening ? 'orb-listening' : ''} ${isThinking ? 'orb-thinking' : ''} ${isSpeaking ? 'orb-speaking' : ''}`}
          onClick={isListening ? stopListening : startListening}
          aria-label={isListening ? 'Stop listening' : 'Start listening'}
        >
          <span className="orb-icon">{isListening ? '●' : '🎙'}</span>
        </button>
      </div>

      <h2 className="orb-status">{orbStatusLabel}</h2>

      {transcript && !isThinking && (
        <p className="orb-subtext">You said: "{transcript}"</p>
      )}

      <div className="voice-hint-bar">
        💡 Press <kbd>Space</kbd> or <kbd>Enter</kbd> to speak, <kbd>Esc</kbd> to stop
      </div>

      {errorMessage && <p className="voice-error">{errorMessage}</p>}

      <div className="voice-history">
        {history.map((turn, index) => (
          <Message key={index} sender={turn.sender} text={turn.text} timestamp={turn.timestamp} />
        ))}
        {isThinking && <Loader label="Thinking..." />}
        <div ref={historyEndRef} />
      </div>
    </div>
  )
}

export default VoiceAssistant
