'use client'

import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import GlassNav from '@/app/components/GlassNav'

/* ── Types ── */
type FoodPrediction = {
  foodName: string
  calories: number
  confidence: number
  macros: { protein: number; carbs: number; fats: number }
  suggestions: string[]
  detailedAnalysis?: string
}

/* ── API helper ── */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function analyzeWithGroq(file: File): Promise<FoodPrediction> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip the data:image/...;base64, prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const res = await fetch(`${API_BASE}/api/food/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || 'Failed to analyze image');
  }

  const json = await res.json();
  return json.data as FoodPrediction;
}

/* ── Meal log item type ── */
type MealEntry = { prediction: FoodPrediction; fileName: string; time: string }

/* ── Scroll-reveal hook ── */
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

/* ════════════════════ FOOD TRACKER PAGE ════════════════════ */
export default function FoodTrackerPage() {
  const router = useRouter()
  const [selectedFileName, setSelectedFileName] = useState<string>('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [prediction, setPrediction] = useState<FoodPrediction | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [mealLog, setMealLog] = useState<MealEntry[]>([])
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('fitflow_theme')
    if (t === 'light') setDark(false)
  }, [])

  const toggleTheme = () => { const n = !dark; setDark(n); localStorage.setItem('fitflow_theme', n ? 'dark' : 'light') }

  /* ── Theme vars ── */
  const bg = dark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
  const navBg = dark ? 'bg-black/80 border-white/10' : 'bg-white/80 border-gray-200'
  const navText = dark ? 'text-gray-400' : 'text-gray-500'
  const cardBg = dark ? 'border-white/10 bg-white/[.03]' : 'border-gray-200 bg-white'
  const cardHover = dark ? 'hover:bg-white/[.06]' : 'hover:bg-gray-50'
  const mutedText = dark ? 'text-gray-500' : 'text-gray-400'
  const bodyText = dark ? 'text-gray-400' : 'text-gray-500'
  const accentBtn = dark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'
  const orbOpacity = dark ? '' : 'opacity-30'
  const overlayGrad = dark ? 'from-black via-black/70 to-black' : 'from-gray-50 via-gray-50/80 to-gray-50'
  const statBorder = dark ? 'border-white/10 bg-white/[.02]' : 'border-gray-200 bg-gray-100/50'
  const statCellBorder = dark ? 'border-white/5' : 'border-gray-200'
  const footerBg = dark ? 'border-white/10 bg-white/[.02]' : 'border-gray-200 bg-gray-100'

  const today = useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), [])

  const totalCalories = mealLog.reduce((s, e) => s + e.prediction.calories, 0)
  const totalProtein = mealLog.reduce((s, e) => s + e.prediction.macros.protein, 0)
  const totalCarbs = mealLog.reduce((s, e) => s + e.prediction.macros.carbs, 0)
  const totalFats = mealLog.reduce((s, e) => s + e.prediction.macros.fats, 0)

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setSelectedFileName(file.name)
    setPreviewUrl(URL.createObjectURL(file))
    setIsAnalyzing(true)
    setPrediction(null)
    setAnalysisError(null)
    try {
      const pred = await analyzeWithGroq(file)
      setPrediction(pred)
      setMealLog((prev) => [...prev, { prediction: pred, fileName: file.name, time: new Date().toLocaleTimeString() }])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Analysis failed'
      setAnalysisError(message)
      console.error('Food analysis error:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className={`relative w-full ${bg} selection:bg-white/20`}>

      {/* ── keyframes ── */}
      <style jsx global>{`
        @keyframes pulseLine{0%{stroke-dashoffset:800}100%{stroke-dashoffset:0}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}
        @keyframes fadeUp{0%{opacity:0;transform:translateY(32px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes pulseSlow{0%,100%{opacity:.12}50%{opacity:.25}}
        @keyframes scanLine{0%{top:-4px}100%{top:calc(100% + 4px)}}
        @keyframes glowPulse{0%,100%{filter:drop-shadow(0 0 6px rgba(239,68,68,.4))}50%{filter:drop-shadow(0 0 20px rgba(239,68,68,.8))}}
        .pulse-line{animation:pulseLine 3s linear infinite}
        .anim-float{animation:float 4s ease-in-out infinite}
        .anim-fadeUp{animation:fadeUp .85s ease-out both}
        .pulse-slow{animation:pulseSlow 6s ease-in-out infinite}
        .scan-line{animation:scanLine 1.6s ease-in-out infinite}
        .glow-pulse{animation:glowPulse 2s ease-in-out infinite}
      `}</style>

      {/* ══ Glass Nav ══ */}
      <GlassNav dark={dark} toggleTheme={toggleTheme} userName="" />

      {/* ══ HERO ══ */}
      <section className="relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden px-6 text-center">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2070&auto=format&fit=crop')" }} />
        <div className={`absolute inset-0 bg-gradient-to-b ${overlayGrad}`} />
        <div className={`pointer-events-none absolute -left-20 top-1/3 h-80 w-80 rounded-full bg-green-500/10 blur-[140px] pulse-slow ${orbOpacity}`} />
        <div className={`pointer-events-none absolute -right-20 bottom-1/4 h-72 w-72 rounded-full bg-cyan-500/10 blur-[120px] pulse-slow ${orbOpacity}`} />

        <div className="relative z-10 max-w-3xl anim-fadeUp">
          <p className={`mb-4 inline-block rounded-full border px-5 py-1.5 text-[11px] font-semibold uppercase tracking-[.3em] ${dark ? 'border-white/20 bg-white/5 text-gray-300' : 'border-gray-300 bg-gray-100 text-gray-600'}`}>AI Nutrition Vision</p>
          <h2 className="text-4xl font-black uppercase leading-tight md:text-7xl">
            Food <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">Tracker</span>
          </h2>
          <p className={`mx-auto mt-4 max-w-xl md:text-lg ${bodyText}`}>Upload a meal image and get instant AI-powered calorie &amp; macro insights. Your personal nutrition lab.</p>
          <p className={`mt-3 text-sm ${mutedText}`}>{today}</p>
        </div>

        <div className="absolute bottom-8 anim-float">
          <svg className={`h-8 w-8 ${dark ? 'text-white/30' : 'text-gray-400/50'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </section>

      {/* ══ Daily summary ribbon ══ */}
      <Reveal>
        <section className={`border-y ${statBorder}`}>
          <div className="mx-auto grid max-w-5xl grid-cols-2 md:grid-cols-4">
            {[
              { label: 'Calories', value: `${totalCalories} / 2500`, accent: 'text-orange-400' },
              { label: 'Protein', value: `${totalProtein}g / 140g`, accent: 'text-cyan-400' },
              { label: 'Carbs', value: `${totalCarbs}g / 280g`, accent: 'text-purple-400' },
              { label: 'Fats', value: `${totalFats}g / 70g`, accent: 'text-amber-400' },
            ].map((s) => (
              <div key={s.label} className={`flex flex-col items-center justify-center border-r py-10 last:border-0 transition hover:bg-white/[.04] ${statCellBorder}`}>
                <span className={`text-xl font-black md:text-2xl ${s.accent}`}>{s.value}</span>
                <span className={`mt-2 text-[10px] font-semibold uppercase tracking-[.2em] ${mutedText}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ══ UPLOAD SECTION ══ */}
      <section className="relative py-24 md:py-32">
        <div className={`pointer-events-none absolute -right-32 top-10 h-80 w-80 rounded-full bg-emerald-500/[.06] blur-[140px] ${orbOpacity}`} />
        <div className="mx-auto max-w-5xl px-6">
          <Reveal className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Upload card */}
            <div className={`lg:col-span-3 rounded-3xl border p-8 ${cardBg}`}>
              <h2 className="text-xl font-bold uppercase tracking-wide">Upload Meal Image</h2>
              <p className={`mt-1 text-sm ${mutedText}`}>Supports JPG, PNG, HEIC — powered by Groq AI</p>

              <label className={`group relative mt-6 flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed px-6 py-16 text-center transition ${dark ? 'border-white/20 bg-white/[.02] hover:border-white/40 hover:bg-white/[.04]' : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'}`}>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                {previewUrl ? (
                  <img src={previewUrl} alt="preview" className="mb-4 h-40 w-auto rounded-xl object-cover shadow-lg" />
                ) : (
                  <span className="mb-3 text-5xl">📷</span>
                )}
                <p className="text-sm font-semibold">Click or drop an image here</p>
                <p className={`mt-1 text-xs ${mutedText}`}>{selectedFileName || 'No file selected'}</p>

                {/* scan-line overlay while analysing */}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent scan-line" />
                    <span className="relative text-sm font-semibold text-green-300">Analyzing with FitFlow AI</span>
                  </div>
                )}

                {analysisError && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="rounded-xl bg-red-500/20 border border-red-500/40 px-5 py-4 text-center max-w-xs">
                      <p className="text-sm font-semibold text-red-300">Analysis Failed</p>
                      <p className="mt-1 text-xs text-red-200/70">{analysisError}</p>
                    </div>
                  </div>
                )}
              </label>
            </div>

            {/* Daily goal sidebar */}
            <div className={`lg:col-span-2 rounded-3xl border p-8 ${cardBg}`}>
              <h3 className="text-base font-bold uppercase tracking-wide">Daily Intake Goal</h3>
              <div className="mt-6 space-y-4">
                {[
                  { label: 'Calories', current: totalCalories, goal: 2500, color: 'bg-orange-500' },
                  { label: 'Protein', current: totalProtein, goal: 140, color: 'bg-cyan-500' },
                  { label: 'Carbs', current: totalCarbs, goal: 280, color: 'bg-purple-500' },
                  { label: 'Fats', current: totalFats, goal: 70, color: 'bg-amber-500' },
                ].map((g) => (
                  <div key={g.label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={bodyText}>{g.label}</span>
                      <span className="font-semibold">{g.current} / {g.goal}{g.label === 'Calories' ? ' kcal' : 'g'}</span>
                    </div>
                    <div className={`mt-1.5 h-2 w-full overflow-hidden rounded-full ${dark ? 'bg-white/10' : 'bg-gray-200'}`}>
                      <div className={`h-full rounded-full transition-all duration-700 ${g.color}`} style={{ width: `${Math.min((g.current / g.goal) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className={`mt-6 rounded-xl border px-4 py-3 text-xs ${dark ? 'border-white/5 bg-white/[.03] text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                <span className={`font-semibold ${dark ? 'text-white' : 'text-black'}`}>Water target:</span> 3.0 L — stay hydrated!
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ MODEL OUTPUT ══ */}
      {prediction && (
        <section className="pb-20">
          <Reveal className="mx-auto max-w-5xl px-6">
            <div className={`rounded-3xl border p-8 md:p-10 ${cardBg}`}>
              <p className="text-[10px] font-semibold uppercase tracking-[.35em] text-green-400">Groq Vision Analysis</p>
              <h3 className="mt-3 text-2xl font-black uppercase md:text-3xl">AI Analysis Result</h3>

              <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  { label: 'Detected Food', value: prediction.foodName },
                  { label: 'Calories', value: `${prediction.calories} kcal` },
                  { label: 'Confidence', value: `${prediction.confidence}%` },
                  { label: 'P / C / F', value: `${prediction.macros.protein}g / ${prediction.macros.carbs}g / ${prediction.macros.fats}g` },
                ].map((c) => (
                  <div key={c.label} className={`rounded-2xl border p-5 transition ${dark ? 'border-white/10 bg-white/[.04] hover:bg-white/[.07]' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}>
                    <p className={`text-[10px] font-semibold uppercase tracking-widest ${mutedText}`}>{c.label}</p>
                    <p className="mt-2 text-lg font-bold">{c.value}</p>
                  </div>
                ))}
              </div>

              <div className={`mt-6 rounded-2xl border p-5 ${dark ? 'border-green-500/20 bg-green-500/[.06]' : 'border-green-200 bg-green-50'}`}>
                <p className={`text-sm font-bold ${dark ? 'text-green-200' : 'text-green-700'}`}>AI Suggestions</p>
                <ul className="mt-3 space-y-2">
                  {prediction.suggestions.map((tip) => (
                    <li key={tip} className={`flex items-start gap-2 text-sm ${dark ? 'text-green-100/80' : 'text-green-700'}`}>
                      <span className="mt-0.5 text-green-400">→</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>

              {prediction.detailedAnalysis && (
                <div className={`mt-4 rounded-2xl border p-5 ${dark ? 'border-cyan-500/20 bg-cyan-500/[.06]' : 'border-cyan-200 bg-cyan-50'}`}>
                  <p className={`text-sm font-bold ${dark ? 'text-cyan-200' : 'text-cyan-700'}`}>Detailed Analysis</p>
                  <p className={`mt-2 text-sm leading-relaxed ${dark ? 'text-cyan-100/80' : 'text-cyan-700'}`}>{prediction.detailedAnalysis}</p>
                </div>
              )}
            </div>
          </Reveal>
        </section>
      )}

      {/* ══ MEAL LOG ══ */}
      {mealLog.length > 0 && (
        <section className="pb-24">
          <Reveal className="mx-auto max-w-5xl px-6">
            <p className={`text-[10px] font-semibold uppercase tracking-[.35em] ${mutedText}`}>Today&apos;s Log</p>
            <h3 className="mt-3 text-2xl font-black uppercase md:text-3xl">Logged Meals</h3>
            <div className="mt-8 space-y-3">
              {mealLog.map((entry, i) => (
                <div key={i} className={`flex items-center justify-between rounded-2xl border px-6 py-4 transition ${cardBg} ${cardHover}`}>
                  <div>
                    <p className="font-semibold">{entry.prediction.foodName}</p>
                    <p className={`text-xs ${mutedText}`}>{entry.fileName} — {entry.time}</p>
                  </div>
                  <span className="text-lg font-black text-orange-400">{entry.prediction.calories} kcal</span>
                </div>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* ══ Heartbeat divider ══ */}
      <div className="overflow-hidden py-6 flex justify-center">
        <svg width="500" height="60" viewBox="0 0 500 60" className={`glow-pulse ${dark ? 'opacity-[.10]' : 'opacity-[.07]'}`}>
          <path d="M0,30 L120,30 L145,8 L170,52 L195,3 L220,48 L245,30 L500,30" fill="none" stroke={dark ? '#ef4444' : '#dc2626'} strokeWidth="2" strokeDasharray="600" className="pulse-line" />
        </svg>
      </div>

      {/* ══ HOW IT WORKS ══ */}
      <section className="py-24 md:py-32">
        <Reveal className="mx-auto max-w-4xl px-6 text-center">
          <p className={`text-[10px] font-semibold uppercase tracking-[.35em] ${mutedText}`}>How It Works</p>
          <h3 className="mt-4 text-3xl font-black uppercase md:text-5xl">Three Steps to Smarter Nutrition</h3>
        </Reveal>
        <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-6 px-6 md:grid-cols-3">
          {[
            { step: '01', title: 'Snap a Photo', desc: 'Take a picture of your meal — any angle, any lighting.' },
            { step: '02', title: 'AI Analyses', desc: 'Our computer-vision model identifies the food and estimates macros.' },
            { step: '03', title: 'Get Insights', desc: 'Receive calorie count, macro split and personalised suggestions.' },
          ].map((s) => (
            <Reveal key={s.step}>
              <div className={`rounded-3xl border p-8 text-center transition hover:-translate-y-1 ${cardBg} ${cardHover}`}>
                <span className={`text-4xl font-black ${dark ? 'text-white/10' : 'text-gray-200'}`}>{s.step}</span>
                <h4 className="mt-4 text-base font-bold uppercase">{s.title}</h4>
                <p className={`mt-2 text-sm ${bodyText}`}>{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══ Footer ══ */}
      <footer className={`border-t ${footerBg}`}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-12 md:flex-row">
          <div>
            <h2 className="text-lg font-black uppercase tracking-wider">FitFlow</h2>
            <p className={`mt-1 text-xs ${mutedText}`}>AI-Powered Edge-First Fitness Platform</p>
          </div>
          <div className={`flex gap-8 text-xs font-medium ${mutedText}`}>
            <span className="cursor-pointer transition hover:text-white">Privacy Policy</span>
            <span className="cursor-pointer transition hover:text-white">Terms of Service</span>
            <span className="cursor-pointer transition hover:text-white">Contact</span>
          </div>
          <p className={`text-xs ${dark ? 'text-gray-600' : 'text-gray-400'}`}>© {new Date().getFullYear()} FitFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
