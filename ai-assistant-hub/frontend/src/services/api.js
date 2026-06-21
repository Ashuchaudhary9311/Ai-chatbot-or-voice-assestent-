/**
 * API service layer.
 *
 * Every network call to the Flask backend goes through this file.
 * Components never call axios directly - this keeps the base URL,
 * error handling, and request shape in one place so it's easy to
 * change later (e.g. adding auth headers, switching base URL for prod).
 */

import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Send a chat message (from typing or voice) to the backend and get the
 * AI's reply back.
 *
 * @param {string} message - The user's message text.
 * @param {Array<{role: string, text: string}>} history - Recent conversation turns for context.
 * @returns {Promise<string>} The AI's reply text.
 */
export async function sendChatMessage(message, history = []) {
  try {
    const response = await apiClient.post('/api/chat', { message, history })
    return response.data.response
  } catch (error) {
    if (error.response) {
      const status = error.response.status
      const serverMsg = error.response.data?.error

      if (status === 429) {
        throw new Error(
          serverMsg ||
          '⚠️ API quota exceeded. Your Gemini API free-tier limit is 0. ' +
          'Please visit https://aistudio.google.com to check your quota or generate a new key.'
        )
      }
      if (status === 403) {
        throw new Error('🔑 Invalid API key. Please check your Gemini API key in the backend .env file.')
      }
      throw new Error(serverMsg || 'Something went wrong on the server.')
    } else if (error.request) {
      throw new Error('🔌 Could not reach the server. Is the Flask backend running on port 5000?')
    } else {
      throw new Error('An unexpected error occurred while sending your message.')
    }
  }
}
