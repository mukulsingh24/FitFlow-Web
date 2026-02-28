'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../../firebaseConfig'
import GlassNav from '@/app/components/GlassNav'

/* ── Scroll-reveal ── */
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

/* ── Types ── */
type DaySteps = { date: string; steps: number }

/* ── Constants ── */
const GOOGLE_FIT_SCOPES = 'https://www.googleapis.com/auth/fitness.activity.read'
const STEPS_DATA_SOURCE = 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps'
const DAILY_GOAL = 10000

/* ── Helpers ── */
function startOfDayMs(d: Date) {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c.getTime()
}
function endOfDayMs(d: Date) {
  const c = new Date(d)
  c.setHours(23, 59, 59, 999)
  return c.getTime()
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
function pct(steps: number) {
  return Math.min(100, Math.round((steps / DAILY_GOAL) * 100))
}

/* ═══════ STEPS SYNC PAGE ═══════ */
export default function StepsSyncPage() {
  const router = useRouter()
  const [dark, setDark] = useState(true)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [stepsData, setStepsData] = useState<DaySteps[]>([])
  const [todaySteps, setTodaySteps] = useState(0)
  const [error, setError] = useState('')
  const [showSetup, setShowSetup] = useState(false)

  // Auth guard
  useEffect(() => {
    const isAdmin = localStorage.getItem('fitflow_admin') === 'true'
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user && !isAdmin) { router.push('/auth/login'); return }
      setLoading(false)
    })
    const t = localStorage.getItem('fitflow_theme')
    if (t === 'light') setDark(false)
    // Restore cached steps data
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

  /* ── Google OAuth for Fitness API ── */
  const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_FIT_CLIENT_ID || ''

  const handleGoogleFitAuth = useCallback(() => {
    if (!CLIENT_ID) {
      setError('Google Fit Client ID not configured. Add NEXT_PUBLIC_GOOGLE_FIT_CLIENT_ID to your .env.local')
      return
    }
    const redirectUri = window.location.origin + '/steps'
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent(GOOGLE_FIT_SCOPES)}` +
      `&prompt=consent`
    window.location.href = authUrl
  }, [CLIENT_ID])

  // Parse token from URL hash on redirect
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1))
      const token = params.get('access_token')
      if (token) {
        setAccessToken(token)
        window.history.replaceState(null, '', window.location.pathname)
      }
    }
  }, [])

  /* ── Fetch steps from Google Fit REST API ── */
  const fetchSteps = useCallback(async (token: string) => {
    setSyncing(true)
    setError('')
    try {
      const now = new Date()
      const days: DaySteps[] = []

      // Fetch last 7 days
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now)
        day.setDate(day.getDate() - i)
        const startMs = startOfDayMs(day)
        const endMs = endOfDayMs(day)

        const res = await fetch(
          `https://www.googleapis.com/fitness/v1/users/me/dataSources/${encodeURIComponent(STEPS_DATA_SOURCE)}/datasets/${startMs * 1000000}-${endMs * 1000000}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )

        if (res.status === 401) {
          setError('Session expired. Please connect Google Fit again.')
          setAccessToken(null)
          setSyncing(false)
          return
        }

        if (!res.ok) {
          // If this specific data source fails, try aggregate
          break
        }

        const data = await res.json()
        let dayTotal = 0
        if (data.point) {
          for (const pt of data.point) {
            if (pt.value) {
              for (const v of pt.value) {
                if (v.intVal) dayTotal += v.intVal
              }
            }
          }
        }
        days.push({ date: day.toISOString().split('T')[0], steps: dayTotal })
      }

      // If direct approach didn't work, try aggregate API
      if (days.length === 0) {
        const aggRes = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            aggregateBy: [{ dataTypeName: 'com.google.step_count.delta' }],
            bucketByTime: { durationMillis: 86400000 },
            startTimeMillis: startOfDayMs(new Date(now.getTime() - 6 * 86400000)),
            endTimeMillis: endOfDayMs(now),
          }),
        })

        if (aggRes.status === 401) {
          setError('Session expired. Please connect Google Fit again.')
          setAccessToken(null)
          setSyncing(false)
          return
        }

        if (!aggRes.ok) {
          const errData = await aggRes.json().catch(() => ({}))
          throw new Error(errData.error?.message || 'Failed to fetch step data')
        }

        const aggData = await aggRes.json()
        if (aggData.bucket) {
          for (const bucket of aggData.bucket) {
            const startDate = new Date(parseInt(bucket.startTimeMillis))
            let total = 0
            if (bucket.dataset) {
              for (const ds of bucket.dataset) {
                if (ds.point) {
                  for (const pt of ds.point) {
                    if (pt.value) {
                      for (const v of pt.value) {
                        if (v.intVal) total += v.intVal
                      }
                    }
                  }
                }
              }
            }
            days.push({ date: startDate.toISOString().split('T')[0], steps: total })
          }
        }
      }

      setStepsData(days)
      localStorage.setItem('fitflow_steps', JSON.stringify(days))
      const todayStr = new Date().toISOString().split('T')[0]
      const todayEntry = days.find(d => d.date === todayStr)
      setTodaySteps(todayEntry?.steps || 0)
    } catch (err: any) {
      setError(err.message || 'Failed to sync steps')
    } finally {
      setSyncing(false)
    }
  }, [])

  // Auto-fetch when token is available
  useEffect(() => {
    if (accessToken) fetchSteps(accessToken)
  }, [accessToken, fetchSteps])

  /* ── Manual entry for users without Google Fit ── */
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

  /* ── Theme vars ── */
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
        .step-pulse { animation: stepPulse 2s ease-in-out infinite; }
        .walk-bounce { animation: walkBounce 1.2s ease-in-out infinite; }
        .fill-bar { animation: fillBar 1s ease-out both; }
        .count-up { animation: countUp .6s ease-out both; }
      `}</style>

      {/* Orbs */}
      <div className={`pointer-events-none fixed -left-32 top-20 h-96 w-96 rounded-full bg-green-500/[.07] blur-[140px] ${orbOpacity}`} />
      <div className={`pointer-events-none fixed -right-32 bottom-20 h-80 w-80 rounded-full bg-emerald-500/[.07] blur-[120px] ${orbOpacity}`} />

      <GlassNav dark={dark} toggleTheme={toggleTheme} />

      {/* ── Hero Section ── */}
      <section className="px-6 pt-10 pb-6 text-center">
        <Reveal>
          <div className="walk-bounce mb-4 inline-block text-6xl">🚶</div>
          <h1 className="text-4xl font-black uppercase tracking-tight md:text-6xl">
            Steps <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">Sync</span>
          </h1>
          <p className={`mt-3 text-base ${bodyText}`}>Connect Google Fit to sync your daily steps. Track your progress and reach your goals.</p>
        </Reveal>
      </section>

      <div className="mx-auto max-w-5xl px-6 pb-20 space-y-8">

        {/* ── Error ── */}
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* ── Connect / Sync row ── */}
        <Reveal>
          <div className={`flex flex-col md:flex-row items-center gap-4 rounded-3xl border p-6 ${cardBg}`}>
            <div className="flex-1">
              <h2 className="text-lg font-bold">Google Fit Connection</h2>
              <p className={`text-sm mt-1 ${bodyText}`}>
                {accessToken ? 'Connected! Step data is being synced.' : 'Connect your Google account to automatically sync steps from Google Fit.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {accessToken ? (
                <>
                  <span className="flex items-center gap-2 text-sm font-medium text-green-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse" /> Connected
                  </span>
                  <button
                    onClick={() => fetchSteps(accessToken)}
                    disabled={syncing}
                    className={`rounded-2xl px-5 py-3 text-sm font-bold transition-all hover:scale-105 ${dark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'} ${syncing ? 'opacity-60' : ''}`}
                  >
                    {syncing ? 'Syncing...' : 'Refresh'}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleGoogleFitAuth}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-green-500/20 transition-all hover:scale-105 hover:shadow-green-500/40"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" />
                  </svg>
                  Connect Google Fit
                </button>
              )}
            </div>
          </div>
        </Reveal>

        {/* ── Today's Progress ── */}
        <Reveal>
          <div className={`rounded-3xl border p-8 text-center ${cardBg}`}>
            <p className={`text-[10px] font-semibold uppercase tracking-[.3em] ${mutedText}`}>Today&apos;s Steps</p>
            <div className="step-pulse mt-4">
              <span className="text-6xl font-black md:text-8xl count-up bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                {todaySteps.toLocaleString()}
              </span>
            </div>
            <p className={`mt-2 text-sm ${bodyText}`}>Goal: {DAILY_GOAL.toLocaleString()} steps</p>

            {/* Progress ring */}
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

            {/* Stats ribbon */}
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

        {/* ── Weekly Chart ── */}
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

              {/* Bar chart */}
              <div className="flex items-end gap-2 h-48">
                {stepsData.map((d, i) => {
                  const height = maxSteps > 0 ? (d.steps / maxSteps) * 100 : 0
                  const isToday = d.date === new Date().toISOString().split('T')[0]
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-2" style={{ animationDelay: `${i * 80}ms` }}>
                      <span className={`text-[10px] font-bold ${isToday ? 'text-green-400' : mutedText}`}>
                        {d.steps > 0 ? (d.steps >= 1000 ? `${(d.steps / 1000).toFixed(1)}k` : d.steps) : '—'}
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

              {/* Goal line label */}
              <div className={`mt-4 flex items-center gap-2 text-[10px] ${mutedText}`}>
                <span className="h-0.5 w-4 bg-green-500/40 rounded" />
                <span>Daily goal: {DAILY_GOAL.toLocaleString()}</span>
              </div>
            </div>
          </Reveal>
        )}

        {/* ── Manual Entry ── */}
        <Reveal>
          <div className={`rounded-3xl border p-8 ${cardBg}`}>
            <h2 className="text-lg font-bold mb-2">Manual Entry</h2>
            <p className={`text-sm mb-5 ${bodyText}`}>Don&apos;t have Google Fit connected? Add your steps manually from your phone&apos;s health app.</p>
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

        {/* ── Setup Guide ── */}
        <Reveal>
          <div className={`rounded-3xl border p-8 ${cardBg}`}>
            <button
              onClick={() => setShowSetup(v => !v)}
              className="flex w-full items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">📱</span>
                <div className="text-left">
                  <h2 className="text-lg font-bold">How to Set Up Google Fit on Your Phone</h2>
                  <p className={`text-sm ${bodyText}`}>Step-by-step guide to start syncing</p>
                </div>
              </div>
              <svg className={`h-6 w-6 transition-transform duration-300 ${showSetup ? 'rotate-180' : ''} ${mutedText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div className={`overflow-hidden transition-all duration-500 ${showSetup ? 'mt-6 max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {/* Android */}
              <div className="mb-8">
                <h3 className="flex items-center gap-2 text-base font-bold mb-4">
                  <span className="text-xl">🤖</span> Android Setup
                </h3>
                <div className="space-y-3">
                  {[
                    { step: '1', text: 'Install Google Fit from the Google Play Store if not already installed.', icon: '📥' },
                    { step: '2', text: 'Open Google Fit and sign in with the same Google account you use for FitFlow.', icon: '🔑' },
                    { step: '3', text: 'Go to Profile → Settings → Manage Connected Apps.', icon: '⚙️' },
                    { step: '4', text: 'Enable "Track your activities" — this uses your phone\'s accelerometer to count steps.', icon: '👟' },
                    { step: '5', text: 'Keep Google Fit running in the background (don\'t force-close the app).', icon: '📊' },
                    { step: '6', text: 'Come back here and tap "Connect Google Fit" to sync your data.', icon: '🔄' },
                  ].map(s => (
                    <div key={s.step} className={`flex items-start gap-4 rounded-2xl border p-4 transition ${dark ? 'border-white/5 bg-white/[.02] hover:bg-white/[.04]' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-400 text-sm font-black">{s.step}</span>
                      <div>
                        <span className="text-lg mr-2">{s.icon}</span>
                        <span className={`text-sm ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{s.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* iOS */}
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold mb-4">
                  <span className="text-xl">🍎</span> iOS Setup
                </h3>
                <div className="space-y-3">
                  {[
                    { step: '1', text: 'Install Google Fit from the App Store.', icon: '📥' },
                    { step: '2', text: 'Open Google Fit and sign in with your Google account.', icon: '🔑' },
                    { step: '3', text: 'Allow Google Fit to access Apple Health data when prompted.', icon: '❤️' },
                    { step: '4', text: 'Go to iPhone Settings → Privacy → Motion & Fitness → enable Fitness Tracking.', icon: '⚙️' },
                    { step: '5', text: 'In Apple Health → Sources → Google Fit → enable all categories.', icon: '📊' },
                    { step: '6', text: 'Come back here and tap "Connect Google Fit" to sync.', icon: '🔄' },
                  ].map(s => (
                    <div key={s.step} className={`flex items-start gap-4 rounded-2xl border p-4 transition ${dark ? 'border-white/5 bg-white/[.02] hover:bg-white/[.04]' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-400 text-sm font-black">{s.step}</span>
                      <div>
                        <span className="text-lg mr-2">{s.icon}</span>
                        <span className={`text-sm ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{s.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className={`mt-8 rounded-2xl border p-5 ${dark ? 'border-amber-500/20 bg-amber-500/5' : 'border-amber-200 bg-amber-50'}`}>
                <h4 className="flex items-center gap-2 text-sm font-bold text-amber-400 mb-3">
                  <span>💡</span> Pro Tips
                </h4>
                <ul className={`space-y-2 text-sm ${dark ? 'text-amber-200/80' : 'text-amber-800'}`}>
                  <li>• Make sure your phone has step tracking hardware (most modern phones do).</li>
                  <li>• Steps sync may take a few minutes after you first install Google Fit.</li>
                  <li>• For best accuracy, carry your phone in your pocket while walking.</li>
                  <li>• If using a smartwatch (Wear OS, Fitbit), it will auto-sync to Google Fit.</li>
                  <li>• Samsung Health users: install &quot;Health Sync&quot; app to bridge data to Google Fit.</li>
                </ul>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── Motivational Cards ── */}
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
    </div>
  )
}
