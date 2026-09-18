import type { FC } from 'react'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatBubbleProps {
  message: Message
  isTyping?: boolean
}

/** Format a Date as HH:MM */
function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * Renders a single chat bubble.
 *
 * - User messages: right-aligned, forest-green background.
 * - Assistant messages: left-aligned, white surface with a subtle border.
 * - When `isTyping` is true the content is replaced with an animated
 *   three-dot indicator (used while waiting for the API response).
 */
const ChatBubble: FC<ChatBubbleProps> = ({ message, isTyping = false }) => {
  const isUser = message.role === 'user'

  return (
    <div
      className={`flex w-full items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar / icon */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold
          ${isUser
            ? 'bg-forest-600 text-white'
            : 'bg-earth-100 border border-earth-200 text-forest-700'
          }`}
        aria-hidden="true"
      >
        {isUser ? 'You' : '🌿'}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
          ${isUser
            ? 'rounded-br-sm bg-forest-600 text-white'
            : 'rounded-bl-sm bg-white border border-earth-200 text-earth-800 shadow-sm'
          }`}
      >
        {isTyping ? (
          /* Animated three-dot typing indicator */
          <span className="flex items-center gap-1 py-0.5" aria-label="Assistant is typing">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="inline-block h-2 w-2 rounded-full bg-earth-400 animate-bounce"
                style={{ animationDelay: `${delay}ms`, animationDuration: '900ms' }}
              />
            ))}
          </span>
        ) : (
          /* Message content — preserve newlines */
          <span className="whitespace-pre-wrap">{message.content}</span>
        )}

        {/* Timestamp */}
        <p
          className={`mt-1 text-[10px] select-none
            ${isUser ? 'text-forest-200 text-right' : 'text-earth-400'}`}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  )
}

export default ChatBubble
