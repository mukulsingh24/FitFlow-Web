'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

type Message = { role: 'user' | 'assistant'; content: string }

/* Hide on auth routes and landing — user must be logged in */
const HIDDEN_ROUTES = ['/auth/login', '/auth/register', '/auth/forgot', '/auth/verification']

export default function FitBro() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Yo what's up! I'm FitBro 💪 Your personal fitness buddy. Ask me anything about workouts, nutrition, or crushing your fitness goals! Let's gooo 🔥" },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])
  useEffect(() => { if (open) inputRef.current?.focus() }, [open])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    const userMsg: Message = { role: 'user', content: text }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)
    try {
      const history = updatedMessages.filter((_, i) => i > 0).map((m) => ({ role: m.role, content: m.content }))
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: history.slice(0, -1) }),
      })
      const data = await res.json()
      if (data.success) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.error || 'Oops, something went wrong bro! Try again 💪' }])
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: "Can't reach the server right now 😅 Make sure the backend is running!" }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  // Don't render on auth pages or landing
  if (pathname === '/' || HIDDEN_ROUTES.some((r) => pathname.startsWith(r))) return null

  return (
    <>
      {/* ── Floating button — bottom RIGHT ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open FitBro chat"
        style={{ animation: open ? 'none' : 'fitBroPulse 2s ease-in-out infinite' }}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-fuchsia-500/30 transition-all duration-300 hover:scale-110 hover:shadow-fuchsia-500/50 active:scale-95 hover:rounded-xl"
      >
        <style jsx>{`
          @keyframes fitBroPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(192,132,252,.5); }
            50% { box-shadow: 0 0 0 10px rgba(192,132,252,0); }
          }
        `}</style>
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          /* Dumbbell / fitness icon */
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 6.5a2 2 0 0 1 3 0l8 8a2 2 0 0 1-3 3l-8-8a2 2 0 0 1 0-3z" />
            <path d="M14.5 6.5a2 2 0 0 0-3 0l-8 8a2 2 0 0 0 3 3l8-8a2 2 0 0 0 0-3z" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
        )}
      </button>

      {/* ── Chat panel — bottom RIGHT ── */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[500px] w-[380px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a]/95 shadow-2xl shadow-black/60 backdrop-blur-xl"
          style={{ animation: 'fitBroSlideUp .3s ease-out' }}>
          <style jsx>{`
            @keyframes fitBroSlideUp {
              from { opacity: 0; transform: translateY(20px) scale(.95); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>

          {/* Header */}
          <div className="flex items-center gap-3 border-b border-white/10 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 px-5 py-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-lg font-bold">
              🏋️
            </div>
            <div className="flex-1">
              <p className="text-sm font-extrabold text-white tracking-wide">FitBro</p>
              <p className="text-[11px] text-white/70">Your AI Fitness Buddy</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-green-400 shadow shadow-green-400/60" />
              <span className="text-[10px] text-green-200 font-medium">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 scrollbar-thin scrollbar-thumb-white/10">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-fuchsia-500/20 text-xs">🏋️</div>
                )}
                <div className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'rounded-br-sm bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white'
                    : 'rounded-bl-sm bg-white/[0.07] text-gray-200'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-fuchsia-500/20 text-xs">🏋️</div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-white/[0.07] px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-fuchsia-400 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-fuchsia-400 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-fuchsia-400 [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/10 bg-black/40 px-4 py-3">
            <div className="flex items-center gap-2 rounded-2xl bg-white/[0.06] px-4 py-2 ring-1 ring-white/5 focus-within:ring-fuchsia-500/40 transition-all">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask FitBro anything..."
                disabled={loading}
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white transition hover:opacity-90 disabled:opacity-30"
                aria-label="Send"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
