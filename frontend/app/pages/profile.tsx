'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, User } from 'firebase/auth'
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

type ProfileData = {
  displayName: string
  age: string
  gender: string
  heightCm: string
  weightKg: string
  activityLevel: string
  fitnessGoal: string
  dietPreference: string
  sleepHours: string
  waterGoalL: string
  medicalNotes: string
}

const defaultProfile: ProfileData = {
  displayName: '',
  age: '',
  gender: 'Male',
  heightCm: '',
  weightKg: '',
  activityLevel: 'Moderate',
  fitnessGoal: 'Lose Weight',
  dietPreference: 'No Preference',
  sleepHours: '7',
  waterGoalL: '3',
  medicalNotes: '',
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileData>(defaultProfile)
  const [saved, setSaved] = useState(false)
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const isAdmin = localStorage.getItem('fitflow_admin') === 'true'
    const unsub = onAuthStateChanged(auth, (cur) => {
      if (!cur && !isAdmin) { router.push('/auth/login'); return }
      if (cur) setUser(cur)
      const stored = localStorage.getItem('fitflow_profile')
      if (stored) {
        setProfile((prev) => ({ ...prev, ...JSON.parse(stored) }))
      } else if (cur) {
        setProfile((p) => ({ ...p, displayName: cur.displayName || cur.email?.split('@')[0] || '' }))
      }
    })
    const t = localStorage.getItem('fitflow_theme')
    if (t === 'light') setDark(false)
    return () => unsub()
  }, [router])

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfile((p) => ({ ...p, [field]: value }))
    setSaved(false)
  }

  const handleSave = () => {
    localStorage.setItem('fitflow_profile', JSON.stringify(profile))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    localStorage.setItem('fitflow_theme', next ? 'dark' : 'light')
  }

  const bg = dark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const navBg = dark ? 'bg-black/80 border-white/10' : 'bg-white/80 border-gray-200'
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const navText = dark ? 'text-gray-400' : 'text-gray-500'
  const cardBg = dark ? 'border-white/10 bg-white/[.03]' : 'border-gray-200 bg-white'
  const inputBg = dark ? 'bg-white/[.06] border-white/10 text-white placeholder:text-gray-500' : 'bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-400'
  const labelText = dark ? 'text-gray-400' : 'text-gray-600'
  const accentBtn = dark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'
  const orbOpacity = dark ? '' : 'opacity-30'

  return (
    <div className={`relative min-h-screen w-full ${bg} selection:bg-white/20`}>

      <style jsx global>{`
        @keyframes fadeUp{0%{opacity:0;transform:translateY(32px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes pulseSlow{0%,100%{opacity:.12}50%{opacity:.25}}
        @keyframes heartbeat{0%,100%{transform:scale(1)}14%{transform:scale(1.1)}28%{transform:scale(1)}42%{transform:scale(1.08)}56%{transform:scale(1)}}
        .anim-fadeUp{animation:fadeUp .85s ease-out both}
        .pulse-slow{animation:pulseSlow 6s ease-in-out infinite}
        .heartbeat{animation:heartbeat 1.8s ease-in-out infinite}
      `}</style>

      <div className={`pointer-events-none absolute -left-20 top-40 h-80 w-80 rounded-full bg-purple-500/10 blur-[140px] pulse-slow ${orbOpacity}`} />
      <div className={`pointer-events-none absolute -right-20 bottom-40 h-72 w-72 rounded-full bg-cyan-500/10 blur-[120px] pulse-slow ${orbOpacity}`} />

      <GlassNav dark={dark} toggleTheme={toggleTheme} userName={profile.displayName || user?.email?.[0] || 'U'} />

      <section className="relative flex flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
        <div className={`pointer-events-none absolute -right-20 top-10 h-60 w-60 rounded-full ${dark ? 'bg-indigo-500/10' : 'bg-indigo-200/40'} blur-[120px] pulse-slow`} />
        <div className="relative z-10 anim-fadeUp">
          <div className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full text-4xl font-black ${dark ? 'bg-white text-black' : 'bg-black text-white'} shadow-lg heartbeat`}>
            {profile.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <h2 className="mt-6 text-3xl font-black uppercase md:text-5xl">Your Profile</h2>
          <p className={`mt-2 text-sm ${dark ? 'text-gray-500' : 'text-gray-500'}`}>{user?.email}</p>
        </div>
      </section>

      <section className="relative pb-28 md:pb-36">
        <div className="mx-auto max-w-3xl px-6">

          <Reveal>
            <div className={`rounded-3xl border p-8 ${cardBg}`}>
              <h3 className="text-lg font-bold uppercase tracking-wide">Personal Information</h3>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <Field label="Display Name" dark={dark} labelText={labelText} inputBg={inputBg} value={profile.displayName} onChange={(v) => handleChange('displayName', v)} placeholder="Your name" />
                <Field label="Age" dark={dark} labelText={labelText} inputBg={inputBg} value={profile.age} onChange={(v) => handleChange('age', v)} placeholder="25" type="number" />
                <SelectField label="Gender" dark={dark} labelText={labelText} inputBg={inputBg} value={profile.gender} onChange={(v) => handleChange('gender', v)} options={['Male', 'Female', 'Other']} />
                <Field label="Height (cm)" dark={dark} labelText={labelText} inputBg={inputBg} value={profile.heightCm} onChange={(v) => handleChange('heightCm', v)} placeholder="175" type="number" />
                <Field label="Weight (kg)" dark={dark} labelText={labelText} inputBg={inputBg} value={profile.weightKg} onChange={(v) => handleChange('weightKg', v)} placeholder="70" type="number" />
              </div>
            </div>
          </Reveal>

          <Reveal className="mt-6">
            <div className={`rounded-3xl border p-8 ${cardBg}`}>
              <h3 className="text-lg font-bold uppercase tracking-wide">Fitness &amp; Lifestyle</h3>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <SelectField label="Activity Level" dark={dark} labelText={labelText} inputBg={inputBg} value={profile.activityLevel} onChange={(v) => handleChange('activityLevel', v)} options={['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active']} />
                <SelectField label="Fitness Goal" dark={dark} labelText={labelText} inputBg={inputBg} value={profile.fitnessGoal} onChange={(v) => handleChange('fitnessGoal', v)} options={['Lose Weight', 'Maintain Weight', 'Build Muscle', 'Improve Endurance', 'General Fitness']} />
                <SelectField label="Diet Preference" dark={dark} labelText={labelText} inputBg={inputBg} value={profile.dietPreference} onChange={(v) => handleChange('dietPreference', v)} options={['No Preference', 'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'High Protein']} />
                <Field label="Sleep Hours" dark={dark} labelText={labelText} inputBg={inputBg} value={profile.sleepHours} onChange={(v) => handleChange('sleepHours', v)} placeholder="7" type="number" />
                <Field label="Daily Water Goal (L)" dark={dark} labelText={labelText} inputBg={inputBg} value={profile.waterGoalL} onChange={(v) => handleChange('waterGoalL', v)} placeholder="3" type="number" />
              </div>
            </div>
          </Reveal>

          <Reveal className="mt-6">
            <div className={`rounded-3xl border p-8 ${cardBg}`}>
              <h3 className="text-lg font-bold uppercase tracking-wide">Medical Notes</h3>
              <p className={`mt-1 text-xs ${labelText}`}>Any allergies, conditions or medications your AI coach should know about.</p>
              <textarea
                className={`mt-4 w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 ${inputBg} min-h-[100px] resize-y`}
                value={profile.medicalNotes}
                onChange={(e) => handleChange('medicalNotes', e.target.value)}
                placeholder="e.g. Lactose intolerant, knee injury..."
              />
            </div>
          </Reveal>

          <Reveal className="mt-8 text-center">
            <button onClick={handleSave} className={`rounded-full px-10 py-3.5 text-base font-bold transition hover:scale-105 ${accentBtn}`}>
              {saved ? '✓ Saved!' : 'Save Profile'}
            </button>
          </Reveal>
        </div>
      </section>

      <footer className={`border-t ${dark ? 'border-white/10 bg-white/[.02]' : 'border-gray-200 bg-gray-100'}`}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-12 md:flex-row">
          <div>
            <h2 className="text-lg font-black uppercase tracking-wider">FitFlow</h2>
            <p className={`mt-1 text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>AI-Powered Edge-First Fitness Platform</p>
          </div>
          <p className={`text-xs ${dark ? 'text-gray-600' : 'text-gray-400'}`}>© {new Date().getFullYear()} FitFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function Field({ label, value, onChange, placeholder = '', type = 'text', labelText, inputBg }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; dark: boolean; labelText: string; inputBg: string
}) {
  return (
    <div>
      <label className={`block text-xs font-semibold uppercase tracking-widest ${labelText}`}>{label}</label>
      <input type={type} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 ${inputBg}`} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

function SelectField({ label, value, onChange, options, labelText, inputBg }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; dark: boolean; labelText: string; inputBg: string
}) {
  return (
    <div>
      <label className={`block text-xs font-semibold uppercase tracking-widest ${labelText}`}>{label}</label>
      <select className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 ${inputBg}`} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
