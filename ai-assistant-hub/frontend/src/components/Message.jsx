import './Message.css'

/**
 * Single chat bubble. `sender` is either "user" or "ai" and controls
 * alignment + styling. Used by both ChatBot.jsx and VoiceAssistant.jsx
 * so the two modes look visually consistent.
 */
function Message({ sender, text, timestamp }) {
  const isUser = sender === 'user'

  return (
    <div className={`message-row ${isUser ? 'message-row-user' : 'message-row-ai'}`}>
      <div className={`message-bubble ${isUser ? 'message-bubble-user' : 'message-bubble-ai'}`}>
        <p className="message-text">{text}</p>
        {timestamp && <span className="message-timestamp">{timestamp}</span>}
      </div>
    </div>
  )
}

export default Message
