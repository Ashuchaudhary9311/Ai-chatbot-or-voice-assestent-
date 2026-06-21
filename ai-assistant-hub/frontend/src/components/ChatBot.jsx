import { useState, useRef, useEffect } from 'react'
import Message from './Message'
import { sendChatMessage } from '../services/api'
import './ChatBot.css'

/**
 * Text-based chatbot mode. Shares the same /api/chat backend endpoint
 * as VoiceAssistant - only difference is input comes from typing
 * instead of speech recognition.
 */
function ChatBot() {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hi! I'm your AI assistant. Ask me anything.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = async () => {
    const trimmedMessage = inputValue.trim()
    if (!trimmedMessage || isTyping) return

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const updatedMessages = [...messages, { sender: 'user', text: trimmedMessage, timestamp }]

    setMessages(updatedMessages)
    setInputValue('')
    setErrorMessage('')
    setIsTyping(true)

    try {
      const conversationContext = updatedMessages.map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        text: msg.text,
      }))

      const aiReply = await sendChatMessage(trimmedMessage, conversationContext.slice(0, -1))

      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: aiReply, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ])
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsTyping(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chatbot-container">
      <div className="chatbot-messages">
        {messages.map((msg, index) => (
          <Message key={index} sender={msg.sender} text={msg.text} timestamp={msg.timestamp} />
        ))}

        {isTyping && (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}

        {errorMessage && <p className="chatbot-error">{errorMessage}</p>}

        <div ref={messagesEndRef} />
      </div>

      <div className="chatbot-input-bar">
        <input
          ref={inputRef}
          type="text"
          className="chatbot-input"
          placeholder="Type your message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isTyping}
        />
        <button
          className="chatbot-send-btn"
          onClick={handleSend}
          disabled={isTyping || !inputValue.trim()}
          aria-label="Send message"
        >
          ➤
        </button>
      </div>
    </div>
  )
}

export default ChatBot
