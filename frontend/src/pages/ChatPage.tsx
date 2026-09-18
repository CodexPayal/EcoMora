import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import ChatBubble, { type Message } from '../components/ChatBubble'

/** Generate a simple unique id using the browser's built-in crypto API. */
const newId = () => crypto.randomUUID()

const GREETING: Message = {
  id: 'greeting',
  role: 'assistant',
  content:
    "Hi! I'm EcoMora's biodiversity expert 🌿 Ask me anything about local wildlife, plants, fungi, or ecosystems — I'll do my best to help!",
  timestamp: new Date(),
}

export default function ChatPage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([GREETING])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const threadRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom whenever messages change or typing indicator appears
  useEffect(() => {
    const el = threadRef.current
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, isLoading])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg: Message = {
      id: newId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    // Build history from current messages (exclude the greeting placeholder id)
    const history = messages
      .filter((m) => m.id !== 'greeting')
      .map((m) => ({ role: m.role, content: m.content }))

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const { data } = await client.post<{ response: string }>('/chat', {
        message: text,
        history,
      })

      const assistantMsg: Message = {
        id: newId(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      setError('Failed to get a response. Please try again.')
    } finally {
      setIsLoading(false)
      // Refocus input for the next message
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [input, isLoading, messages])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Send on Enter (without Shift for newline)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col bg-earth-50">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                               */}
      {/* ------------------------------------------------------------------ */}
      <header className="shrink-0 border-b border-earth-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg p-1.5 text-earth-500 hover:bg-earth-100 hover:text-earth-700 transition-colors"
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">🌿</span>
            <div>
              <h1 className="text-base font-semibold text-forest-800 leading-tight">
                Biodiversity Expert
              </h1>
              <p className="text-xs text-earth-500">Powered by EcoMora AI</p>
            </div>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Message thread                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div
        ref={threadRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-6"
        aria-live="polite"
        aria-label="Conversation thread"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}

          {/* Typing indicator — shown while waiting for the API */}
          {isLoading && (
            <ChatBubble
              message={{
                id: 'typing',
                role: 'assistant',
                content: '',
                timestamp: new Date(),
              }}
              isTyping
            />
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Error banner                                                          */}
      {/* ------------------------------------------------------------------ */}
      {error && (
        <div className="shrink-0 border-t border-red-200 bg-red-50 px-4 py-2 text-center text-sm text-red-600">
          {error}{' '}
          <button
            type="button"
            className="underline hover:no-underline"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Sticky input bar                                                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="shrink-0 border-t border-earth-200 bg-white px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
        <div className="mx-auto flex max-w-3xl items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about local wildlife, plants, ecosystems…"
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none rounded-xl border border-earth-300 bg-earth-50
                       px-4 py-2.5 text-sm text-earth-900 placeholder:text-earth-400
                       focus:border-forest-500 focus:outline-none focus:ring-2
                       focus:ring-forest-200 disabled:opacity-50
                       max-h-32 overflow-y-auto"
            style={{
              // Auto-grow textarea up to max-h via scrollHeight
              height: 'auto',
            }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = `${Math.min(el.scrollHeight, 128)}px`
            }}
            aria-label="Chat message input"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl
                       bg-forest-600 text-white hover:bg-forest-700 transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            {isLoading ? (
              <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg"
                fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24"
                fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-earth-400">
          Press <kbd className="rounded bg-earth-100 px-1 font-mono text-[10px]">Enter</kbd> to
          send · <kbd className="rounded bg-earth-100 px-1 font-mono text-[10px]">Shift+Enter</kbd>{' '}
          for new line
        </p>
      </div>
    </div>
  )
}
