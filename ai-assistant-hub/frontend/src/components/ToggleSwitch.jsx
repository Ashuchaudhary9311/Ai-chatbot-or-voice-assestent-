import './ToggleSwitch.css'

/**
 * Animated pill-style toggle for switching between "Voice" and "Chat" modes.
 * Purely presentational - the parent (App) owns which mode is active.
 */
function ToggleSwitch({ activeMode, onModeChange }) {
  const isVoiceMode = activeMode === 'voice'

  return (
    <div className="toggle-switch" role="tablist" aria-label="Assistant mode">
      <button
        className={`toggle-option ${isVoiceMode ? 'active' : ''}`}
        onClick={() => onModeChange('voice')}
        role="tab"
        aria-selected={isVoiceMode}
      >
        🎙 Voice Assistant
      </button>
      <button
        className={`toggle-option ${!isVoiceMode ? 'active' : ''}`}
        onClick={() => onModeChange('chat')}
        role="tab"
        aria-selected={!isVoiceMode}
      >
        💬 Chatbot
      </button>
      <div className={`toggle-slider ${isVoiceMode ? 'left' : 'right'}`} />
    </div>
  )
}

export default ToggleSwitch
