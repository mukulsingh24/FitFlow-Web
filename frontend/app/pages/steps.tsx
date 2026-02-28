'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../../firebaseConfig'
import GlassNav from '@/app/components/GlassNav'

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.12 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return { ref, visible }
}
function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useReveal()
  return <div ref={ref} className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-14'} ${className}`}>{children}</div>
}

type DaySteps = { date: string; steps: number }

const DAILY_GOAL = 10000

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
function pct(steps: number) {
  return Math.min(100, Math.round((steps / DAILY_GOAL) * 100))
}

export default function StepsSyncPage() {
  const router = useRouter()
  const [dark, setDark] = useState(true)
  const [loading, setLoading] = useState(true)
  const [stepsData, setStepsData] = useState<DaySteps[]>([])
  const [todaySteps, setTodaySteps] = useState(0)
  const [showDownload, setShowDownload] = useState(false)

  useEffect(() => {
    const isAdmin = localStorage.getItem('fitflow_admin') === 'true'
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user && !isAdmin) { router.push('/auth/login'); return }
      setLoading(false)
    })
    const t = localStorage.getItem('fitflow_theme')
    if (t === 'light') setDark(false)
    try {
      const cached = localStorage.getItem('fitflow_steps')
      if (cached) {
        const parsed: DaySteps[] = JSON.parse(cached)
        setStepsData(parsed)
        const todayStr = new Date().toISOString().split('T')[0]
        const todayEntry = parsed.find(d => d.date === todayStr)
        if (todayEntry) setTodaySteps(todayEntry.steps)
      }
    } catch { /* ignore */ }
    return () => unsub()
  }, [router])

  const toggleTheme = () => { const n = !dark; setDark(n); localStorage.setItem('fitflow_theme', n ? 'dark' : 'light') }

  const [manualSteps, setManualSteps] = useState('')
  const handleManualAdd = () => {
    const val = parseInt(manualSteps)
    if (isNaN(val) || val <= 0) return
    const todayStr = new Date().toISOString().split('T')[0]
    const updated = [...stepsData]
    const idx = updated.findIndex(d => d.date === todayStr)
    if (idx >= 0) {
      updated[idx] = { ...updated[idx], steps: updated[idx].steps + val }
    } else {
      updated.push({ date: todayStr, steps: val })
    }
    setStepsData(updated)
    setTodaySteps((prev) => prev + val)
    localStorage.setItem('fitflow_steps', JSON.stringify(updated))
    setManualSteps('')
  }

  const bg = dark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
  const cardBg = dark ? 'border-white/10 bg-white/[.03]' : 'border-gray-200 bg-white'
  const mutedText = dark ? 'text-gray-500' : 'text-gray-400'
  const bodyText = dark ? 'text-gray-400' : 'text-gray-500'
  const orbOpacity = dark ? '' : 'opacity-30'

  const weekTotal = stepsData.reduce((sum, d) => sum + d.steps, 0)
  const weekAvg = stepsData.length > 0 ? Math.round(weekTotal / stepsData.length) : 0
  const maxSteps = Math.max(...stepsData.map(d => d.steps), DAILY_GOAL)

  if (loading) return (
    <div className={`flex min-h-screen items-center justify-center ${bg}`}>
      <div className={`h-14 w-14 animate-spin rounded-full border-4 ${dark ? 'border-white/20 border-t-white' : 'border-gray-300 border-t-gray-700'}`} />
    </div>
  )

  return (
    <div className={`relative min-h-screen w-full ${bg} selection:bg-white/20`}>
      <style jsx global>{`
        @keyframes stepPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.04); } }
        @keyframes walkBounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes fillBar { from { width: 0; } }
        @keyframes countUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes phonePulse { 0%,100% { transform: scale(1) rotate(-3deg); } 50% { transform: scale(1.06) rotate(3deg); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .step-pulse { animation: stepPulse 2s ease-in-out infinite; }
        .walk-bounce { animation: walkBounce 1.2s ease-in-out infinite; }
        .fill-bar { animation: fillBar 1s ease-out both; }
        .count-up { animation: countUp .6s ease-out both; }
        .phone-pulse { animation: phonePulse 3s ease-in-out infinite; }
        .shimmer-bg { background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,.06) 40%, rgba(255,255,255,.12) 50%, rgba(255,255,255,.06) 60%, transparent 100%); background-size: 200% 100%; animation: shimmer 3s ease-in-out infinite; }
      `}</style>

      <div className={`pointer-events-none fixed -left-32 top-20 h-96 w-96 rounded-full bg-green-500/[.07] blur-[140px] ${orbOpacity}`} />
      <div className={`pointer-events-none fixed -right-32 bottom-20 h-80 w-80 rounded-full bg-emerald-500/[.07] blur-[120px] ${orbOpacity}`} />

      <GlassNav dark={dark} toggleTheme={toggleTheme} />

      <section className="px-6 pt-10 pb-6 text-center">
        <Reveal>
          <div className="walk-bounce mb-4 inline-block text-6xl">🚀</div>
          <h1 className="text-4xl font-black uppercase tracking-tight md:text-6xl">
            FitFlow <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">App</span>
          </h1>
          <p className={`mt-3 text-base ${bodyText}`}>Track steps, sync workouts & crush your goals — all from the FitFlow mobile app.</p>
        </Reveal>
      </section>

      <div className="mx-auto max-w-5xl px-6 pb-20 space-y-8">

        <Reveal>
          <div className={`relative overflow-hidden rounded-3xl border p-8 md:p-10 text-center ${cardBg}`}>
            <div className="pointer-events-none absolute inset-0 shimmer-bg" />
            <div className="relative z-10">
              <div className="phone-pulse mb-6 inline-block text-7xl">📱</div>
              <h2 className="text-2xl font-black uppercase md:text-3xl">
                Get the <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">FitFlow App</span>
              </h2>
              <p className={`mt-3 max-w-lg mx-auto text-sm ${bodyText}`}>
                Automatic step counting, real-time workout tracking, AI nutrition scanning, and smart health insights — all in your pocket.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => setShowDownload(true)}
                  className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-green-500/25 transition-all hover:scale-105 hover:shadow-green-500/40 active:scale-95"
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download FitFlow App
                </button>
              </div>

              <div className={`mt-6 flex justify-center gap-6 text-xs font-semibold uppercase tracking-widest ${mutedText}`}>
                <span className="flex items-center gap-1.5">
                  <span className="text-base">🤖</span> Android
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-base">🍎</span> iOS
                </span>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: '👣', title: 'Auto Step Tracking', desc: 'Your phone counts every step. No wearable needed — just carry your phone.', gradient: 'from-green-500/10 to-emerald-500/10 border-green-500/20' },
              { icon: '🏋️', title: 'Workout Sync', desc: 'Log workouts, track sets & reps, and monitor your progress over time.', gradient: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20' },
              { icon: '📸', title: 'AI Food Scanner', desc: 'Snap a photo of your meal to instantly get calories and macros.', gradient: 'from-orange-500/10 to-amber-500/10 border-orange-500/20' },
              { icon: '💤', title: 'Sleep & Recovery', desc: 'Track sleep patterns and recovery to optimise your training schedule.', gradient: 'from-purple-500/10 to-violet-500/10 border-purple-500/20' },
            ].map(f => (
              <div key={f.title} className={`rounded-3xl border bg-gradient-to-br p-6 transition hover:-translate-y-1 hover:shadow-lg ${f.gradient}`}>
                <span className="text-4xl mb-3 block">{f.icon}</span>
                <h3 className="text-sm font-bold uppercase tracking-wider">{f.title}</h3>
                <p className={`mt-2 text-xs ${bodyText}`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal>
          <div className={`rounded-3xl border p-8 text-center ${cardBg}`}>
            <p className={`text-[10px] font-semibold uppercase tracking-[.3em] ${mutedText}`}>Today&apos;s Steps</p>
            <div className="step-pulse mt-4">
              <span className="text-6xl font-black md:text-8xl count-up bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                {todaySteps.toLocaleString()}
              </span>
            </div>
            <p className={`mt-2 text-sm ${bodyText}`}>Goal: {DAILY_GOAL.toLocaleString()} steps</p>

            <div className="mx-auto mt-6 w-48 h-48 relative">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke={dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke="url(#stepGrad)" strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - pct(todaySteps) / 100)}`}
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="stepGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black">{pct(todaySteps)}%</span>
                <span className={`text-[10px] uppercase tracking-widest ${mutedText}`}>Complete</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className={`rounded-2xl border p-4 ${dark ? 'border-white/5 bg-white/[.02]' : 'border-gray-100 bg-gray-50'}`}>
                <p className="text-2xl font-black text-green-400">{(todaySteps * 0.0008).toFixed(1)}</p>
                <p className={`text-[9px] font-semibold uppercase tracking-widest ${mutedText}`}>km walked</p>
              </div>
              <div className={`rounded-2xl border p-4 ${dark ? 'border-white/5 bg-white/[.02]' : 'border-gray-100 bg-gray-50'}`}>
                <p className="text-2xl font-black text-emerald-400">{Math.round(todaySteps * 0.04)}</p>
                <p className={`text-[9px] font-semibold uppercase tracking-widest ${mutedText}`}>kcal burned</p>
              </div>
              <div className={`rounded-2xl border p-4 ${dark ? 'border-white/5 bg-white/[.02]' : 'border-gray-100 bg-gray-50'}`}>
                <p className="text-2xl font-black text-teal-400">{Math.round(todaySteps * 0.0006 * 60)}</p>
                <p className={`text-[9px] font-semibold uppercase tracking-widest ${mutedText}`}>min active</p>
              </div>
            </div>
          </div>
        </Reveal>

        {stepsData.length > 0 && (
          <Reveal>
            <div className={`rounded-3xl border p-8 ${cardBg}`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold">Last 7 Days</h2>
                  <p className={`text-sm ${bodyText}`}>Avg: {weekAvg.toLocaleString()} steps / day</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-400">{weekTotal.toLocaleString()}</p>
                  <p className={`text-[9px] uppercase tracking-widest ${mutedText}`}>Total steps</p>
                </div>
              </div>

              <div className="flex items-end gap-2 h-48">
                {stepsData.map((d, i) => {
                  const height = maxSteps > 0 ? (d.steps / maxSteps) * 100 : 0
                  const isToday = d.date === new Date().toISOString().split('T')[0]
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-2" style={{ animationDelay: `${i * 80}ms` }}>
                      <span className={`text-[10px] font-bold ${isToday ? 'text-green-400' : mutedText}`}>
                        {d.steps > 0 ? (d.steps >= 1000 ? `${(d.steps / 1000).toFixed(1)}k` : d.steps) : '\u2014'}
                      </span>
                      <div className={`w-full rounded-t-xl transition-all duration-700 ease-out fill-bar ${
                        isToday
                          ? 'bg-gradient-to-t from-green-500 to-emerald-400'
                          : d.steps >= DAILY_GOAL
                            ? 'bg-gradient-to-t from-green-600 to-green-400'
                            : dark ? 'bg-white/10' : 'bg-gray-200'
                      }`} style={{ height: `${Math.max(height, 4)}%` }} />
                      <span className={`text-[9px] font-semibold uppercase ${isToday ? 'text-green-400' : mutedText}`}>
                        {formatDate(d.date).split(',')[0]}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className={`mt-4 flex items-center gap-2 text-[10px] ${mutedText}`}>
                <span className="h-0.5 w-4 bg-green-500/40 rounded" />
                <span>Daily goal: {DAILY_GOAL.toLocaleString()}</span>
              </div>
            </div>
          </Reveal>
        )}

        <Reveal>
          <div className={`rounded-3xl border p-8 ${cardBg}`}>
            <h2 className="text-lg font-bold mb-2">Manual Entry</h2>
            <p className={`text-sm mb-5 ${bodyText}`}>Add your steps manually from your phone&apos;s health app or pedometer.</p>
            <div className="flex gap-3">
              <input
                type="number"
                value={manualSteps}
                onChange={(e) => setManualSteps(e.target.value)}
                placeholder="Enter steps"
                className={`flex-1 rounded-2xl border px-5 py-3 text-lg font-semibold outline-none transition-all ${
                  dark
                    ? 'border-white/10 bg-white/5 text-white placeholder-gray-600 focus:border-green-500/50 focus:bg-white/10'
                    : 'border-gray-200 bg-gray-50 text-black placeholder-gray-400 focus:border-green-500/50 focus:bg-white'
                }`}
              />
              <button
                onClick={handleManualAdd}
                className="rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 font-bold text-white shadow-lg shadow-green-500/20 transition-all hover:scale-105 hover:shadow-green-500/40 active:scale-95"
              >
                + Add
              </button>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className={`relative overflow-hidden rounded-3xl border p-8 ${dark ? 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-green-500/5' : 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50'}`}>
            <div className="pointer-events-none absolute inset-0 shimmer-bg" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
              <div className="text-6xl phone-pulse">🎉</div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-black uppercase tracking-wide">FitFlow Mobile App — Coming Soon!</h3>
                <p className={`mt-2 text-sm ${bodyText}`}>
                  Auto step tracking, push notifications, offline mode, wearable sync, and more. We&apos;re building the ultimate fitness companion.
                </p>
              </div>
              <button
                onClick={() => setShowDownload(true)}
                className={`shrink-0 rounded-2xl px-6 py-3 text-sm font-bold transition-all hover:scale-105 ${dark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}
              >
                Notify Me
              </button>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { emoji: '🔥', title: 'Stay Consistent', desc: 'Walking 10,000 steps daily burns ~400-500 extra calories.', color: 'from-orange-500/10 to-red-500/10 border-orange-500/20' },
              { emoji: '💪', title: 'Health Benefits', desc: 'Regular walking reduces heart disease risk by 30% and boosts mood.', color: 'from-blue-500/10 to-violet-500/10 border-blue-500/20' },
              { emoji: '🏆', title: 'Set Goals', desc: 'Start with 5,000 steps if 10k feels too much. Build up gradually!', color: 'from-green-500/10 to-emerald-500/10 border-green-500/20' },
            ].map(card => (
              <div key={card.title} className={`rounded-3xl border bg-gradient-to-br p-6 text-center transition hover:-translate-y-1 hover:shadow-lg ${card.color}`}>
                <span className="text-4xl mb-3 block">{card.emoji}</span>
                <h3 className="text-sm font-bold uppercase tracking-wider">{card.title}</h3>
                <p className={`mt-2 text-xs ${bodyText}`}>{card.desc}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {showDownload && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4" onClick={() => setShowDownload(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-md rounded-3xl border p-8 text-center shadow-2xl ${dark ? 'border-white/10 bg-gray-950' : 'border-gray-200 bg-white'}`}
          >
            <button onClick={() => setShowDownload(false)} className={`absolute top-4 right-4 h-8 w-8 rounded-full flex items-center justify-center transition hover:scale-110 ${dark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="phone-pulse mb-6 inline-block text-7xl">📱</div>
            <h3 className="text-2xl font-black uppercase">Coming Soon!</h3>
            <div className="mt-4 mx-auto h-1 w-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500" />
            <p className={`mt-6 text-sm leading-relaxed ${bodyText}`}>
              The <strong className={dark ? 'text-white' : 'text-black'}>FitFlow Mobile App</strong> is currently in development. We&apos;re crafting an incredible experience with auto step tracking, AI-powered insights, and seamless wearable integration.
            </p>
            <p className="mt-4 text-lg font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              &quot;Great things take time — your fitness revolution is loading!&quot;
            </p>
            <div className={`mt-6 rounded-2xl border p-4 ${dark ? 'border-white/5 bg-white/[.02]' : 'border-gray-100 bg-gray-50'}`}>
              <p className={`text-xs ${mutedText}`}>Expected Launch</p>
              <p className="text-lg font-black mt-1">Q3 2025</p>
            </div>
            <button
              onClick={() => setShowDownload(false)}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 py-3 font-bold text-white shadow-lg shadow-green-500/20 transition-all hover:scale-105 hover:shadow-green-500/40"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
