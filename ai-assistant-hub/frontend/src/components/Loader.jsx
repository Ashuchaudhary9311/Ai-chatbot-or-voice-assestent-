import './Loader.css'

/**
 * Small reusable loading indicator, used while waiting on the Gemini API.
 * `label` lets callers customize the message (e.g. "Thinking..." vs "Listening...").
 */
function Loader({ label = 'Thinking...' }) {
  return (
    <div className="loader-container" role="status" aria-live="polite">
      <div className="loader-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <p className="loader-label">{label}</p>
    </div>
  )
}

export default Loader
