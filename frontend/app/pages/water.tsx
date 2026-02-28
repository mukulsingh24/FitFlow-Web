'use client'

import React, { useEffect, useRef, useState } from 'react'
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

/* ── Preset cup sizes ── */
const CUP_SIZES = [
  { label: 'Small', ml: 150, icon: '🥤' },
  { label: 'Medium', ml: 250, icon: '🥛' },
  { label: 'Large', ml: 500, icon: '🫗' },
  { label: 'Bottle', ml: 750, icon: '🍶' },
]

type WaterEntry = { ml: number; time: string }

/* ═══════ WATER TRACKER PAGE ═══════ */
export default function WaterTrackerPage() {
  const router = useRouter()
  const [dark, setDark] = useState(true)
  const [goalMl, setGoalMl] = useState(3000) // default 3L
  const [entries, setEntries] = useState<WaterEntry[]>([])
  const [customMl, setCustomMl] = useState('')
  const [showGoalEdit, setShowGoalEdit] = useState(false)
  const [newGoal, setNewGoal] = useState('')
  const [profileName, setProfileName] = useState('')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (cur) => { if (!cur) router.push('/auth/login') })
    const t = localStorage.getItem('fitflow_theme')
    if (t === 'light') setDark(false)
    // Restore water data from localStorage
    try {
      const saved = localStorage.getItem('fitflow_water_today')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Only restore if same day
        if (parsed.date === new Date().toDateString()) {
          setEntries(parsed.entries || [])
        }
      }
      const goal = localStorage.getItem('fitflow_water_goal')
      if (goal) setGoalMl(parseInt(goal))
      const p = localStorage.getItem('fitflow_profile')
      if (p) { const d = JSON.parse(p); if (d.displayName) setProfileName(d.displayName) }
    } catch { /* ignore */ }
    return () => unsub()
  }, [router])

  // Persist entries whenever they change
  useEffect(() => {
    localStorage.setItem('fitflow_water_today', JSON.stringify({ date: new Date().toDateString(), entries }))
  }, [entries])

  const toggleTheme = () => { const n = !dark; setDark(n); localStorage.setItem('fitflow_theme', n ? 'dark' : 'light') }

  const addWater = (ml: number) => {
    if (ml <= 0) return
    setEntries((prev) => [...prev, { ml, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
  }

  const removeLastEntry = () => {
    setEntries((prev) => prev.slice(0, -1))
  }

  const updateGoal = () => {
    const g = parseInt(newGoal)
    if (g > 0) {
      setGoalMl(g)
      localStorage.setItem('fitflow_water_goal', g.toString())
    }
    setShowGoalEdit(false)
    setNewGoal('')
  }

  const totalMl = entries.reduce((s, e) => s + e.ml, 0)
  const progress = Math.min((totalMl / goalMl) * 100, 100)
  const glasses = Math.floor(totalMl / 250)

  /* ── Theme ── */
  const bg = dark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
  const cardBg = dark ? 'border-white/10 bg-white/[.03]' : 'border-gray-200 bg-white'
  const mutedText = dark ? 'text-gray-500' : 'text-gray-400'
  const bodyText = dark ? 'text-gray-400' : 'text-gray-500'
  const orbOpacity = dark ? '' : 'opacity-30'
  const footerBg = dark ? 'border-white/10 bg-white/[.02]' : 'border-gray-200 bg-gray-100'
  const userName = profileName || 'U'

  return (
    <div className={`relative min-h-screen w-full ${bg} selection:bg-white/20`}>

      <style jsx global>{`
        @keyframes fadeUp{0%{opacity:0;transform:translateY(32px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes pulseSlow{0%,100%{opacity:.12}50%{opacity:.25}}
        @keyframes waterWave{0%{transform:translateX(0) translateZ(0) scaleY(1)}50%{transform:translateX(-25%) translateZ(0) scaleY(0.55)}100%{transform:translateX(-50%) translateZ(0) scaleY(1)}}
        @keyframes dropFall{0%{transform:translateY(-10px);opacity:0}60%{opacity:1}100%{transform:translateY(0);opacity:1}}
        .anim-fadeUp{animation:fadeUp .85s ease-out both}
        .pulse-slow{animation:pulseSlow 6s ease-in-out infinite}
        .water-wave{animation:waterWave 6s linear infinite}
        .drop-fall{animation:dropFall .4s ease-out both}
      `}</style>

      {/* Orbs */}
      <div className={`pointer-events-none absolute -left-20 top-40 h-80 w-80 rounded-full bg-cyan-500/10 blur-[140px] pulse-slow ${orbOpacity}`} />
      <div className={`pointer-events-none absolute -right-20 bottom-40 h-72 w-72 rounded-full bg-blue-500/10 blur-[120px] pulse-slow ${orbOpacity}`} />

      {/* Nav */}
      <GlassNav dark={dark} toggleTheme={toggleTheme} userName={userName} />

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
        <div className={`pointer-events-none absolute -right-20 top-10 h-60 w-60 rounded-full ${dark ? 'bg-cyan-500/10' : 'bg-cyan-200/40'} blur-[120px] pulse-slow`} />
        <div className="relative z-10 anim-fadeUp">
          <p className={`mb-4 inline-block rounded-full border px-5 py-1.5 text-[11px] font-semibold uppercase tracking-[.3em] ${dark ? 'border-white/20 bg-white/5 text-gray-300' : 'border-gray-300 bg-gray-100 text-gray-600'}`}>
            Hydration Tracker
          </p>
          <h2 className="text-4xl font-black uppercase leading-tight md:text-7xl">
            Water <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent">Tracker</span>
          </h2>
          <p className={`mx-auto mt-4 max-w-xl md:text-lg ${bodyText}`}>
            Stay hydrated, stay healthy. Track every glass and hit your daily water goal.
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="relative pb-20">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal className="grid grid-cols-1 gap-6 lg:grid-cols-5">

            {/* ── Water bottle visual ── */}
            <div className={`lg:col-span-2 rounded-3xl border p-8 flex flex-col items-center ${cardBg}`}>
              {/* Bottle visualization */}
              <div className="relative mx-auto h-72 w-36 overflow-hidden rounded-3xl border-2 border-cyan-500/30 bg-black/20">
                {/* Water fill */}
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-500 to-cyan-400/80 transition-all duration-700 ease-out"
                  style={{ height: `${progress}%` }}
                >
                  {/* Wave effect */}
                  <div className="absolute -top-2 left-0 h-4 w-[200%] opacity-40">
                    <svg viewBox="0 0 1200 40" className="water-wave h-full w-full">
                      <path d="M0,20 C150,40 350,0 500,20 C650,40 850,0 1000,20 C1150,40 1200,20 1200,20 L1200,40 L0,40 Z" fill="currentColor" className="text-cyan-300" />
                    </svg>
                  </div>
                </div>
                {/* Percentage label */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-3xl font-black ${progress > 50 ? 'text-white' : dark ? 'text-white' : 'text-gray-700'}`}>
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>

              {/* Stats under bottle */}
              <div className="mt-6 w-full space-y-2 text-center">
                <p className="text-2xl font-black text-cyan-400">{totalMl} ml</p>
                <p className={`text-sm ${mutedText}`}>of {goalMl} ml goal</p>
                <p className={`text-xs ${mutedText}`}>≈ {glasses} glasses (250ml each)</p>
                {totalMl >= goalMl && (
                  <p className="mt-2 text-sm font-bold text-green-400 drop-fall">🎉 Goal reached! Great job staying hydrated!</p>
                )}
              </div>

              {/* Edit goal */}
              <button
                onClick={() => setShowGoalEdit((v) => !v)}
                className={`mt-4 text-xs font-medium transition hover:underline ${dark ? 'text-cyan-400' : 'text-cyan-600'}`}
              >
                {showGoalEdit ? 'Cancel' : 'Edit Daily Goal'}
              </button>
              {showGoalEdit && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder={goalMl.toString()}
                    className={`w-24 rounded-xl border px-3 py-2 text-sm outline-none ${dark ? 'bg-white/[.06] border-white/10 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                  />
                  <span className={`text-xs ${mutedText}`}>ml</span>
                  <button onClick={updateGoal} className="rounded-xl bg-cyan-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-cyan-400">Set</button>
                </div>
              )}
            </div>

            {/* ── Quick add buttons ── */}
            <div className={`lg:col-span-3 rounded-3xl border p-8 ${cardBg}`}>
              <h3 className="text-lg font-bold uppercase tracking-wide">Quick Add</h3>
              <p className={`mt-1 text-sm ${mutedText}`}>Tap a size to log water instantly</p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {CUP_SIZES.map((cup) => (
                  <button
                    key={cup.label}
                    onClick={() => addWater(cup.ml)}
                    className={`group flex items-center gap-3 rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5 ${
                      dark
                        ? 'border-white/10 bg-white/[.03] hover:bg-cyan-500/10 hover:border-cyan-500/30'
                        : 'border-gray-200 bg-white hover:bg-cyan-50 hover:border-cyan-300'
                    }`}
                  >
                    <span className="text-3xl transition-transform group-hover:scale-125">{cup.icon}</span>
                    <div className="text-left">
                      <p className="text-sm font-bold">{cup.label}</p>
                      <p className={`text-xs ${mutedText}`}>{cup.ml} ml</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div className="mt-6">
                <p className={`text-xs font-semibold uppercase tracking-widest ${mutedText}`}>Custom Amount</p>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    value={customMl}
                    onChange={(e) => setCustomMl(e.target.value)}
                    placeholder="e.g. 350"
                    className={`flex-1 rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-cyan-500 ${dark ? 'bg-white/[.06] border-white/10 text-white placeholder:text-gray-500' : 'bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-400'}`}
                  />
                  <span className={`text-sm ${mutedText}`}>ml</span>
                  <button
                    onClick={() => { addWater(parseInt(customMl) || 0); setCustomMl('') }}
                    className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-400 hover:scale-105"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Undo last */}
              {entries.length > 0 && (
                <button
                  onClick={removeLastEntry}
                  className={`mt-4 text-xs font-medium transition hover:underline ${dark ? 'text-red-400' : 'text-red-500'}`}
                >
                  ↩ Undo last entry ({entries[entries.length - 1].ml} ml)
                </button>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Today's log ── */}
      {entries.length > 0 && (
        <section className="pb-20">
          <Reveal className="mx-auto max-w-5xl px-6">
            <p className={`text-[10px] font-semibold uppercase tracking-[.35em] ${mutedText}`}>Today&apos;s Log</p>
            <h3 className="mt-3 text-2xl font-black uppercase">Water Intake History</h3>
            <div className="mt-6 space-y-2">
              {[...entries].reverse().map((entry, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded-2xl border px-5 py-3 transition drop-fall ${cardBg} ${
                    dark ? 'hover:bg-white/[.06]' : 'hover:bg-gray-50'
                  }`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">💧</span>
                    <div>
                      <p className="text-sm font-semibold">{entry.ml} ml</p>
                      <p className={`text-xs ${mutedText}`}>{entry.time}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${dark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                    +{entry.ml} ml
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* ── Hydration tips ── */}
      <section className="pb-20">
        <Reveal className="mx-auto max-w-5xl px-6">
          <div className={`rounded-3xl border p-8 md:p-10 ${cardBg}`}>
            <p className="text-[10px] font-semibold uppercase tracking-[.35em] text-cyan-400">Hydration Tips</p>
            <h3 className="mt-3 text-xl font-bold uppercase">Stay On Track</h3>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                { icon: '⏰', tip: 'Drink a glass of water first thing in the morning' },
                { icon: '🍽️', tip: 'Have a glass 30 minutes before each meal' },
                { icon: '🏃', tip: 'Drink 200-300ml for every 20 min of exercise' },
                { icon: '📱', tip: 'Set hourly reminders to sip water throughout the day' },
                { icon: '🍉', tip: 'Eat water-rich foods like cucumbers, watermelon & oranges' },
                { icon: '🧊', tip: 'Keep a filled bottle visible at your desk' },
              ].map((t, i) => (
                <div key={i} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                  dark ? 'border-white/5 bg-white/[.03] hover:bg-white/[.06]' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}>
                  <span className="mt-0.5 text-lg">{t.icon}</span>
                  <span className={dark ? 'text-gray-300' : 'text-gray-700'}>{t.tip}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className={`border-t ${footerBg}`}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-12 md:flex-row">
          <div>
            <h2 className="text-lg font-black uppercase tracking-wider">FitFlow</h2>
            <p className={`mt-1 text-xs ${mutedText}`}>AI-Powered Edge-First Fitness Platform</p>
          </div>
          <p className={`text-xs ${dark ? 'text-gray-600' : 'text-gray-400'}`}>© {new Date().getFullYear()} FitFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
