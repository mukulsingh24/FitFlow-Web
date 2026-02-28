'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebaseConfig'

type Props = {
  dark: boolean
  toggleTheme: () => void
  userName?: string
}

const NAV_ITEMS = [
  {
    label: 'Home',
    path: '/dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-[22px] w-[22px]">
        <path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3l9-8z" />
      </svg>
    ),
  },
  {
    label: 'Food',
    path: '/foodtracker',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[22px] w-[22px]">
        <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
  },
  {
    label: 'BMI',
    path: '/bmi',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[22px] w-[22px]">
        <path d="M12 2a10 10 0 110 20 10 10 0 010-20z" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    label: 'Water',
    path: '/water',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[22px] w-[22px]">
        <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
      </svg>
    ),
  },
  {
    label: 'Form',
    path: '/formchecker',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[22px] w-[22px]">
        <circle cx="12" cy="5" r="2" />
        <line x1="12" y1="7" x2="12" y2="15" />
        <line x1="8" y1="11" x2="16" y2="11" />
        <line x1="10" y1="22" x2="12" y2="15" />
        <line x1="14" y1="22" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    label: 'Steps',
    path: '/steps',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[22px] w-[22px]">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
  },
  {
    label: 'App',
    path: '#app',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[22px] w-[22px]">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
  },
]

export default function GlassNav({ dark, toggleTheme, userName }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showAppModal, setShowAppModal] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = async () => {
    try { await signOut(auth); router.push('/auth/login') } catch (e) { console.error(e) }
  }

  const displayName = userName || 'U'

  return (
    <>
      <style jsx>{`
        @keyframes sunSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes moonRock { 0%,100% { transform: rotate(-8deg); } 50% { transform: rotate(8deg); } }
        @keyframes liquidShine { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes navPop { 0% { transform: scale(.92); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .sun-anim { animation: sunSpin 10s linear infinite; }
        .moon-anim { animation: moonRock 2.5s ease-in-out infinite; }
        .liquid-shine {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,.08) 40%, rgba(255,255,255,.14) 50%, rgba(255,255,255,.08) 60%, transparent 100%);
          background-size: 200% 100%;
          animation: liquidShine 4s ease-in-out infinite;
        }
        .nav-pop { animation: navPop .35s cubic-bezier(.34,1.56,.64,1) both; }
      `}</style>

      <nav
        className={`sticky top-3 z-50 mx-auto mt-3 hidden max-w-4xl items-center justify-between gap-2 rounded-[1.75rem] border px-3 py-2 transition-all duration-700 md:flex nav-pop ${
          scrolled ? 'shadow-2xl' : 'shadow-lg'
        } ${
          dark
            ? 'border-white/[0.10] bg-gradient-to-b from-white/[0.07] to-white/[0.03] shadow-black/30 backdrop-blur-3xl'
            : 'border-white/40 bg-gradient-to-b from-white/70 to-white/50 shadow-black/[0.06] backdrop-blur-3xl'
        }`}
      >
        <div className="pointer-events-none absolute inset-0 rounded-[1.75rem] liquid-shine" />

        <h1
          onClick={() => router.push('/dashboard')}
          className={`relative z-10 cursor-pointer pl-3 text-lg font-black uppercase tracking-widest transition-all duration-300 hover:scale-105 ${dark ? 'text-white' : 'text-black'}`}
        >
          FitFlow
        </h1>

        <div className="relative z-10 flex items-center gap-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path
            const isApp = item.path === '#app'
            return (
              <button
                key={item.path}
                onClick={() => isApp ? setShowAppModal(true) : router.push(item.path)}
                className={`group relative flex flex-col items-center gap-0.5 rounded-2xl px-4 py-1.5 transition-all duration-300 hover:scale-[1.15] ${
                  isActive
                    ? dark
                      ? 'bg-white/[0.12] text-white shadow-inner shadow-white/5'
                      : 'bg-black/[0.08] text-black shadow-inner shadow-black/5'
                    : dark
                    ? 'text-gray-500 hover:bg-white/[0.06] hover:text-white'
                    : 'text-gray-400 hover:bg-black/[0.04] hover:text-black'
                }`}
              >
                <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
              </button>
            )
          })}
        </div>

        <div className="relative z-10 flex items-center gap-1 pr-1">
          <button
            onClick={toggleTheme}
            className={`relative flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300 hover:scale-[1.2] ${
              dark ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}
            aria-label="Toggle theme"
          >
            {dark ? (
              <svg className="h-5 w-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,.5)] sun-anim" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,.5)] moon-anim" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>

          <button
            onClick={handleLogout}
            className={`rounded-2xl px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 hover:scale-110 ${
              dark ? 'text-gray-500 hover:bg-white/[0.06] hover:text-white' : 'text-gray-400 hover:bg-black/[0.04] hover:text-black'
            }`}
          >
            Log Out
          </button>

          <div
            onClick={() => router.push('/profile')}
            className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl font-bold text-sm transition-all duration-300 hover:scale-[1.2] hover:shadow-lg ${
              dark
                ? 'bg-gradient-to-br from-white to-gray-200 text-black shadow-white/10'
                : 'bg-gradient-to-br from-black to-gray-800 text-white shadow-black/10'
            }`}
          >
            {displayName[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </nav>

      <nav className={`sticky top-2 z-50 mx-3 mt-2 flex items-center justify-between rounded-2xl border px-3 py-2 md:hidden transition-all duration-700 nav-pop ${
        dark
          ? 'border-white/[0.10] bg-gradient-to-b from-white/[0.07] to-white/[0.03] shadow-lg shadow-black/30 backdrop-blur-3xl'
          : 'border-white/40 bg-gradient-to-b from-white/70 to-white/50 shadow-lg shadow-black/[0.06] backdrop-blur-3xl'
      }`}>
        <div className="pointer-events-none absolute inset-0 rounded-2xl liquid-shine" />
        <h1 onClick={() => router.push('/dashboard')} className={`relative z-10 cursor-pointer text-lg font-black uppercase tracking-wider ${dark ? 'text-white' : 'text-black'}`}>FitFlow</h1>
        <div className="relative z-10 flex items-center gap-1">
          <button onClick={toggleTheme} className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:scale-110 ${dark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
            {dark ? (
              <svg className="h-4 w-4 text-yellow-400 sun-anim" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
            ) : (
              <svg className="h-4 w-4 text-indigo-500 moon-anim" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
            )}
          </button>
          <div onClick={() => router.push('/profile')} className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl font-bold text-sm transition-all hover:scale-110 ${dark ? 'bg-white text-black' : 'bg-black text-white'}`}>
            {displayName[0]?.toUpperCase() || 'U'}
          </div>
          <button onClick={() => setMobileOpen((v) => !v)} className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:scale-110 ${dark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-black'}`}>
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className={`sticky top-[62px] z-40 mx-3 mt-1 rounded-2xl border p-2 backdrop-blur-3xl md:hidden nav-pop ${
          dark ? 'border-white/[0.08] bg-black/80' : 'border-white/40 bg-white/80'
        }`}>
          <div className="pointer-events-none absolute inset-0 rounded-2xl liquid-shine" />
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path
            const isApp = item.path === '#app'
            return (
              <button
                key={item.path}
                onClick={() => { if (isApp) { setShowAppModal(true) } else { router.push(item.path) }; setMobileOpen(false) }}
                className={`relative z-10 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all ${
                  isActive
                    ? dark ? 'bg-white/10 text-white' : 'bg-black/10 text-black'
                    : dark ? 'text-gray-400 hover:bg-white/[0.06] hover:text-white' : 'text-gray-500 hover:bg-black/[0.04] hover:text-black'
                }`}
              >
                {item.icon} {item.label}
              </button>
            )
          })}
          <button
            onClick={() => { router.push('/profile'); setMobileOpen(false) }}
            className={`relative z-10 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all ${
              pathname === '/profile'
                ? dark ? 'bg-white/10 text-white' : 'bg-black/10 text-black'
                : dark ? 'text-gray-400 hover:bg-white/[0.06] hover:text-white' : 'text-gray-500 hover:bg-black/[0.04] hover:text-black'
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[22px] w-[22px]"><circle cx="12" cy="8" r="4" /><path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" /></svg>
            Profile
          </button>
          <button
            onClick={() => { handleLogout(); setMobileOpen(false) }}
            className={`relative z-10 mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all ${
              dark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[22px] w-[22px]"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
            Log Out
          </button>
        </div>
      )}

      {showAppModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4" onClick={() => setShowAppModal(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-md rounded-3xl border p-8 text-center shadow-2xl ${dark ? 'border-white/10 bg-gray-950' : 'border-gray-200 bg-white'}`}
            style={{ animation: 'navPop .35s cubic-bezier(.34,1.56,.64,1) both' }}
          >
            <button onClick={() => setShowAppModal(false)} className={`absolute top-4 right-4 h-8 w-8 rounded-full flex items-center justify-center transition hover:scale-110 ${dark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="mb-4 inline-block text-7xl" style={{ animation: 'float 4s ease-in-out infinite' }}>📱</div>
            <h3 className="text-2xl font-black uppercase tracking-tight">FitFlow App</h3>
            <div className="mt-2 inline-block rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-1 text-xs font-bold text-white uppercase tracking-widest">
              Coming Soon
            </div>

            <p className={`mt-6 text-sm leading-relaxed ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
              We&apos;re building something extraordinary. The <strong className={dark ? 'text-white' : 'text-black'}>FitFlow Mobile App</strong> will bring AI-powered fitness coaching right to your pocket — step tracking, form correction, meal scanning, and smart insights, all in one app.
            </p>

            <div className={`mt-6 rounded-2xl border p-5 text-left ${dark ? 'border-white/5 bg-white/[.02]' : 'border-gray-100 bg-gray-50'}`}>
              <p className={`text-[10px] font-semibold uppercase tracking-[.3em] mb-3 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>What&apos;s Coming</p>
              <div className="space-y-2">
                {['Auto step & activity tracking', 'AI food scanner on the go', 'Push notification reminders', 'Offline workout mode', 'Wearable device sync'].map(f => (
                  <div key={f} className={`flex items-center gap-2 text-sm ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className="text-green-400">✓</span> {f}
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-6 text-base font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent italic">
              &quot;Your fitness revolution is loading — stay tuned!&quot;
            </p>

            <button
              onClick={() => setShowAppModal(false)}
              className={`mt-6 w-full rounded-2xl py-3 font-bold transition-all hover:scale-105 ${dark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  )
}
