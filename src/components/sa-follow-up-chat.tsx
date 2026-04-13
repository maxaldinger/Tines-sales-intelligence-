'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  tool: string
  dealName: string | null
  contextSummary: string
  placeholder?: string
}

export default function SAFollowUpChat({ tool, dealName, contextSummary, placeholder }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)

    try {
      // Build the messages payload. For the first user message, prepend
      // a context exchange so the model has builder context.
      let apiMessages: Message[]
      if (messages.length === 0) {
        apiMessages = [
          { role: 'user', content: contextSummary },
          { role: 'assistant', content: 'Understood. I have the full context for this builder. How can I help you refine it?' },
          userMsg,
        ]
      } else {
        apiMessages = [
          { role: 'user', content: contextSummary },
          { role: 'assistant', content: 'Understood. I have the full context for this builder. How can I help you refine it?' },
          ...updated,
        ]
      }

      const res = await fetch('/api/sa-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, tool }),
      })

      if (!res.ok) throw new Error('Chat request failed')

      const data = await res.json()
      const assistantMsg: Message = { role: 'assistant', content: data.content ?? data.message ?? '' }
      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="border-t border-surface-border bg-surface-raised">
      {/* Message history */}
      {messages.length > 0 && (
        <div ref={scrollRef} className="max-h-64 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap
                  ${msg.role === 'user'
                    ? 'bg-tines text-white'
                    : 'bg-surface-raised border border-surface-border text-[#C8C0E0]'
                  }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-surface-raised border border-surface-border rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-tines rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-tines rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-tines rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input area */}
      <div className="px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? `Ask a follow-up about this ${tool}...`}
            rows={1}
            className="flex-1 resize-none rounded-lg border border-surface-border bg-surface-raised px-3 py-2
                       text-sm text-white placeholder-tines-dim focus:outline-none focus:border-tines/40
                       transition-colors"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-tines
                       text-white hover:bg-tines-hover disabled:opacity-40 disabled:cursor-not-allowed
                       transition-colors cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
