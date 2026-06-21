import { useState } from 'react'
import ToggleSwitch from './components/ToggleSwitch'
import VoiceAssistant from './components/VoiceAssistant'
import ChatBot from './components/ChatBot'
import './App.css'

function App() {
  const [activeMode, setActiveMode] = useState('voice') // 'voice' | 'chat'

  return (
    <div className="app-container">
      <div className="background-glow" />

      <header className="app-header">
        <div className="app-title-row">
          <span className="app-logo">✦</span>
          <h1 className="app-title">AI Assistant Hub</h1>
        </div>
        <span className="status-badge">
          <span className="status-dot" /> Online
        </span>
      </header>

      <main className="app-main">
        <ToggleSwitch activeMode={activeMode} onModeChange={setActiveMode} />

        <div className="mode-panel">
          {activeMode === 'voice' ? <VoiceAssistant /> : <ChatBot />}
        </div>
      </main>

      <footer className="app-footer">
        Built with React, Flask &amp; Gemini API
      </footer>
    </div>
  )
}

export default App
