'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, signOut, User } from 'firebase/auth'
import { auth } from '../../firebaseConfig'
import GlassNav from '@/app/components/GlassNav'

/* ───── FAQ data ───── */
const faqs = [
  { q: 'How does FitFlow detect calories from food images?', a: 'FitFlow uses a trained computer vision model to identify the food item from an image and maps it to a nutritional database to estimate calories per serving.' },
  { q: 'Is the calorie estimation 100% accurate?', a: 'No image-based system can guarantee exact calorie measurement. FitFlow provides AI-assisted estimates to reduce manual logging errors and improve tracking accuracy.' },
  { q: 'Does FitFlow require wearable devices?', a: 'No. FitFlow works directly through your smartphone camera and app interface without the need for expensive wearables.' },
  { q: 'How does exercise form detection work?', a: 'FitFlow uses pose estimation models to analyze body posture during workouts and provides real-time feedback to improve form and reduce injury risk.' },
  { q: 'Is my personal data secure?', a: 'Yes. User data is securely stored and handled with privacy-focused architecture. Sensitive data is not shared without user consent.' },
  { q: 'Can beginners use FitFlow?', a: 'Yes. FitFlow adapts workout and meal plans based on user goals and fitness level, making it suitable for beginners as well as advanced users.' },
  { q: 'Does the app work offline?', a: 'Basic tracking features work offline. AI-based image processing may require internet connectivity depending on deployment architecture.' },
  { q: 'Who is FitFlow designed for?', a: 'FitFlow is designed for students, working professionals, and anyone looking for affordable, AI-powered fitness guidance.' },
]

/* ───── Feature cards ───── */
const features = [
  { icon: '📸', title: 'Calorie Detection via Food Image', desc: 'Snap a photo of your meal — our computer-vision model identifies the dish and estimates calories, protein, carbs and fats instantly.' },
  { icon: '🏋️', title: 'Real-Time Form Correction', desc: 'Camera-based pose estimation analyses your body during exercise and gives live feedback to prevent injury and maximise gains.' },
  { icon: '📊', title: 'AI-Driven Workout & Meal Plans', desc: 'Personalised plans that adapt weekly based on your progress, preferences and recovery data — no expensive trainer needed.' },
  { icon: '🧠', title: 'Adaptive Health Insights', desc: 'Sleep quality, water intake, BMI trends and habit streaks are synthesised into actionable coaching tips every morning.' },
  { icon: '⚡', title: 'Edge-First — Works on Any Device', desc: 'Optimised to run on everyday smartphones without costly wearables, bringing AI coaching to emerging regions.' },
  { icon: '🌍', title: 'Regional Food Intelligence', desc: 'Supports Indian and regional food datasets so your local meals are recognised accurately — not just Western diets.' },
]

/* ───── Stats ribbon ───── */
const stats = [
  { label: 'Calories Burned', value: '840 kcal', accent: 'text-orange-400' },
  { label: 'Hydration', value: '2.1 L', accent: 'text-cyan-400' },
  { label: 'Sleep Score', value: '87 / 100', accent: 'text-purple-400' },
  { label: 'Streak', value: '9 days', accent: 'text-amber-400' },
]

/* ───── Scroll-reveal hook ───── */
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

/* ═══════════════ DASHBOARD ═══════════════ */
export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [dark, setDark] = useState(true)
  const [profileName, setProfileName] = useState('')
  const router = useRouter()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (cur) => {
      if (cur) { if (!cur.emailVerified) router.push('/auth/verification'); setUser(cur) } else router.push('/auth/login')
      setLoading(false)
    })
    const t = localStorage.getItem('fitflow_theme')
    if (t === 'light') setDark(false)
    try {
      const p = localStorage.getItem('fitflow_profile')
      if (p) { const d = JSON.parse(p); if (d.displayName) setProfileName(d.displayName) }
    } catch { /* ignore */ }
    // listen for storage changes from profile page
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'fitflow_profile' && e.newValue) {
        try { const d = JSON.parse(e.newValue); if (d.displayName) setProfileName(d.displayName) } catch { /* */ }
      }
      if (e.key === 'fitflow_theme') setDark(e.newValue !== 'light')
    }
    window.addEventListener('storage', onStorage)
    return () => { unsub(); window.removeEventListener('storage', onStorage) }
  }, [router])

  const toggleTheme = () => { const n = !dark; setDark(n); localStorage.setItem('fitflow_theme', n ? 'dark' : 'light') }
  const userName = profileName || user?.displayName || user?.email?.split('@')[0] || 'Athlete'
  const handleLogout = async () => { try { await signOut(auth); router.push('/auth/login') } catch (e) { console.error(e) } }

  /* ── Theme vars ── */
  const bg = dark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
  const navBg = dark ? 'bg-black/80 border-white/10' : 'bg-white/80 border-gray-200'
  const navText = dark ? 'text-gray-400' : 'text-gray-500'
  const cardBg = dark ? 'border-white/10 bg-white/[.03]' : 'border-gray-200 bg-white'
  const cardHover = dark ? 'hover:bg-white/[.06] hover:border-white/20' : 'hover:bg-gray-50 hover:border-gray-300'
  const mutedText = dark ? 'text-gray-500' : 'text-gray-400'
  const bodyText = dark ? 'text-gray-400' : 'text-gray-500'
  const accentBtn = dark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'
  const orbOpacity = dark ? '' : 'opacity-30'
  const overlayGrad = dark ? 'from-black via-black/60 to-black' : 'from-gray-50 via-gray-50/80 to-gray-50'
  const statBorder = dark ? 'border-white/10 bg-white/[.02]' : 'border-gray-200 bg-gray-100/50'
  const statCellBorder = dark ? 'border-white/5' : 'border-gray-200'
  const footerBg = dark ? 'border-white/10 bg-white/[.02]' : 'border-gray-200 bg-gray-100'

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-white" />
    </div>
  )

  return (
    <div className={`relative w-full ${bg} selection:bg-white/20`}>

      {/* ── keyframes ── */}
      <style jsx global>{`
        @keyframes pulseLine{0%{stroke-dashoffset:1000}100%{stroke-dashoffset:0}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}
        @keyframes fadeUp{0%{opacity:0;transform:translateY(32px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes pulseSlow{0%,100%{opacity:.15}50%{opacity:.3}}
        @keyframes glowPulse{0%,100%{filter:drop-shadow(0 0 6px rgba(239,68,68,.4))}50%{filter:drop-shadow(0 0 20px rgba(239,68,68,.8))}}
        .pulse-line{animation:pulseLine 3s linear infinite}
        .anim-float{animation:float 4s ease-in-out infinite}
        .anim-fadeUp{animation:fadeUp .85s ease-out both}
        .pulse-slow{animation:pulseSlow 6s ease-in-out infinite}
        .glow-pulse{animation:glowPulse 2s ease-in-out infinite}
      `}</style>

      {/* ══ Glass Nav ══ */}
      <GlassNav dark={dark} toggleTheme={toggleTheme} userName={userName} />

      {/* ══ HERO ══ */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop')" }} />
        <div className={`absolute inset-0 bg-gradient-to-b ${overlayGrad}`} />
        {/* floating orbs */}
        <div className={`pointer-events-none absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-orange-500/10 blur-[140px] pulse-slow ${orbOpacity}`} />
        <div className={`pointer-events-none absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-blue-500/10 blur-[120px] pulse-slow ${orbOpacity}`} />
        {/* Heartbeat pulse SVG (replaces dumbbell) */}
        <div className="pointer-events-none absolute top-1/2 -translate-y-1/2 w-full overflow-hidden flex justify-center">
          <svg width="900" height="120" viewBox="0 0 900 120" className={`glow-pulse ${dark ? 'opacity-[.15]' : 'opacity-[.10]'}`}>
            <path d="M0,60 L200,60 L230,20 L260,100 L290,10 L320,90 L350,60 L500,60 L530,25 L560,95 L590,15 L620,85 L650,60 L900,60" fill="none" stroke={dark ? '#ef4444' : '#dc2626'} strokeWidth="3" strokeDasharray="1000" className="pulse-line" />
          </svg>
        </div>

        <div className="relative z-10 max-w-4xl anim-fadeUp">
          <p className={`mb-5 inline-block rounded-full border px-5 py-1.5 text-[11px] font-semibold uppercase tracking-[.3em] ${dark ? 'border-white/20 bg-white/5 text-gray-300' : 'border-gray-300 bg-gray-100 text-gray-600'}`}>
            AI Edge Fitness Platform
          </p>
          <h2 className="text-5xl font-black uppercase leading-[1.05] tracking-tight md:text-8xl lg:text-9xl">
            Your AI Coach.<br />
            <span className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-500 bg-clip-text text-transparent">No Excuses.</span>
          </h2>
          <p className={`mx-auto mt-6 max-w-2xl text-base md:text-xl ${bodyText}`}>
            Real-time form correction, food-image calorie detection, adaptive meal plans and sleep insights — all from your phone. No wearables. No expensive trainers.
          </p>
          <p className={`mt-3 text-sm ${mutedText}`}>
            Welcome back, <span className={`font-semibold ${dark ? 'text-white' : 'text-black'}`}>{userName}</span>
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button onClick={() => router.push('/foodtracker')} className={`rounded-full px-8 py-3.5 text-base font-bold transition hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,.25)] ${accentBtn}`}>Open Food Tracker</button>
            <button onClick={() => router.push('/bmi')} className={`rounded-full border px-8 py-3.5 text-base font-medium transition hover:scale-105 ${dark ? 'border-white/30 hover:bg-white/10' : 'border-gray-300 hover:bg-gray-100'}`}>BMI Calculator</button>
          </div>
        </div>

        <div className="absolute bottom-10 anim-float">
          <svg className={`h-8 w-8 ${dark ? 'text-white/30' : 'text-gray-400/50'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </section>

      {/* ══ STATS RIBBON ══ */}
      <Reveal>
        <section className={`border-y ${statBorder}`}>
          <div className="mx-auto grid max-w-6xl grid-cols-2 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className={`flex flex-col items-center justify-center border-r py-12 last:border-0 transition hover:bg-white/[.04] ${statCellBorder}`}>
                <span className={`text-3xl font-black md:text-4xl ${s.accent}`}>{s.value}</span>
                <span className={`mt-2 text-[10px] font-semibold uppercase tracking-[.2em] ${mutedText}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ══ FEATURES ══ */}
      <section className="relative overflow-hidden py-28 md:py-36">
        <div className={`pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-orange-500/[.07] blur-[140px] ${orbOpacity}`} />
        <div className={`pointer-events-none absolute -right-32 bottom-10 h-96 w-96 rounded-full bg-purple-500/[.07] blur-[140px] ${orbOpacity}`} />

        <Reveal className="mx-auto max-w-6xl px-6 text-center">
          <p className={`text-[10px] font-semibold uppercase tracking-[.35em] ${mutedText}`}>What Makes FitFlow Different</p>
          <h3 className="mt-4 text-4xl font-black uppercase md:text-6xl">
            Features That <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Redefine</span> Fitness
          </h3>
        </Reveal>

        <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-5 px-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title}>
              <div
                className={`group relative overflow-hidden rounded-3xl border p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_12px_60px_-10px_rgba(255,255,255,.06)] ${cardBg} ${cardHover}`}
                style={{ transitionDelay: `${i * 60}ms`, transformStyle: 'preserve-3d' }}
              >
                <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full ${dark ? 'bg-white/[.03]' : 'bg-gray-100'} transition-transform duration-700 group-hover:scale-150`} />
                <span className="relative mb-4 block text-4xl">{f.icon}</span>
                <h4 className="relative text-base font-bold uppercase tracking-wide">{f.title}</h4>
                <p className={`relative mt-3 text-sm leading-relaxed ${bodyText}`}>{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══ PARALLAX BANNER ══ */}
      <section className="relative flex min-h-[75vh] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-fixed bg-center opacity-25" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2070&auto=format&fit=crop')" }} />
        <div className={`absolute inset-0 bg-gradient-to-b ${dark ? 'from-black via-transparent to-black' : 'from-gray-50 via-transparent to-gray-50'}`} />

        {/* Heartbeat pulse banner (replaces dumbbell) */}
        <div className="pointer-events-none absolute bottom-10 w-full overflow-hidden flex justify-center">
          <svg width="600" height="80" viewBox="0 0 600 80" className={`glow-pulse ${dark ? 'opacity-[.08]' : 'opacity-[.06]'}`}>
            <path d="M0,40 L150,40 L175,10 L200,70 L225,5 L250,65 L275,40 L600,40" fill="none" stroke={dark ? '#ef4444' : '#dc2626'} strokeWidth="2.5" strokeDasharray="800" className="pulse-line" />
          </svg>
        </div>

        <Reveal className="relative z-10 max-w-3xl px-6 text-center">
          <h3 className="text-4xl font-black uppercase leading-tight md:text-7xl">Enhance Your Life<br /><span className={mutedText}>In &amp; Out Of The Gym</span></h3>
          <p className={`mx-auto mt-6 max-w-xl ${bodyText}`}>FitFlow combines AI coaching, computer vision and behavioural science into one platform — bringing professional-grade guidance to everyone, everywhere.</p>
          <button onClick={() => router.push('/foodtracker')} className={`mt-8 rounded-full px-8 py-3 font-bold transition hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,.2)] ${accentBtn}`}>Try Food Tracker</button>
        </Reveal>
      </section>

      {/* ══ USP ══ */}
      <section className="py-28 md:py-36">
        <Reveal className="mx-auto max-w-5xl px-6">
          <div className={`rounded-[2rem] border p-10 md:p-16 ${cardBg}`} style={{ transformStyle: 'preserve-3d' }}>
            <p className="text-[10px] font-semibold uppercase tracking-[.35em] text-orange-400">Our USP</p>
            <h3 className="mt-4 text-3xl font-black uppercase md:text-5xl">Real-Time AI Coaching<br />Without Expensive Hardware</h3>
            <div className="mt-10 grid gap-8 md:grid-cols-2">
              <div className={`space-y-4 leading-relaxed ${bodyText}`}>
                <p>FitFlow aims to <strong className={dark ? 'text-white' : 'text-black'}>democratize AI-powered personal training</strong> by creating a low-cost, real-time digital fitness ecosystem.</p>
                <p>It integrates nutrition intelligence, posture correction and adaptive health planning into one unified platform — accessible from any smartphone.</p>
              </div>
              <div className="space-y-3">
                {['Cross-pollination: AI + Health + Vision + Behavioural Science', 'Edge-first: runs on mobile devices', 'Supports Indian & regional food datasets', 'Privacy-first architecture', 'Measurable outcomes: weight loss %, hydration %'].map((t) => (
                  <div key={t} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition ${dark ? 'border-white/5 bg-white/[.03] hover:bg-white/[.06]' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}>
                    <span className="mt-0.5 text-green-400">✓</span>
                    <span className={dark ? 'text-gray-300' : 'text-gray-700'}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ══ Heartbeat divider ══ */}
      <div className="overflow-hidden py-6 flex justify-center">
        <svg width="500" height="60" viewBox="0 0 500 60" className={`glow-pulse ${dark ? 'opacity-[.10]' : 'opacity-[.07]'}`}>
          <path d="M0,30 L120,30 L145,8 L170,52 L195,3 L220,48 L245,30 L500,30" fill="none" stroke={dark ? '#ef4444' : '#dc2626'} strokeWidth="2" strokeDasharray="600" className="pulse-line" />
        </svg>
      </div>

      {/* ══ FAQ ══ */}
      <section className="py-28 md:py-36">
        <Reveal className="mx-auto max-w-3xl px-6 text-center">
          <p className={`text-[10px] font-semibold uppercase tracking-[.35em] ${mutedText}`}>Got Questions?</p>
          <h3 className="mt-4 text-4xl font-black uppercase md:text-6xl">FAQs, Expert Answers</h3>
        </Reveal>

        <div className="mx-auto mt-14 max-w-3xl space-y-3 px-6">
          {faqs.map((f, i) => {
            const open = openFaq === i
            return (
              <Reveal key={i}>
                <button onClick={() => setOpenFaq(open ? null : i)} className={`w-full rounded-2xl border px-6 py-5 text-left transition ${cardBg} ${cardHover}`}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold md:text-base">{f.q}</span>
                    <span className={`shrink-0 text-xl font-light transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>+</span>
                  </div>
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${open ? 'mt-4 max-h-44 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <p className={`text-sm leading-relaxed ${bodyText}`}>{f.a}</p>
                  </div>
                </button>
              </Reveal>
            )
          })}
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
