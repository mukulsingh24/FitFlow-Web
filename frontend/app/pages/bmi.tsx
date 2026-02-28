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

/* ── BMI category helpers ── */
function bmiCategory(bmi: number) {
  if (bmi < 16) return { label: 'Severe Underweight', color: 'text-red-400', barColor: 'bg-red-500' }
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-orange-400', barColor: 'bg-orange-500' }
  if (bmi < 25) return { label: 'Normal Weight', color: 'text-green-400', barColor: 'bg-green-500' }
  if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-400', barColor: 'bg-yellow-500' }
  if (bmi < 35) return { label: 'Obese Class I', color: 'text-orange-400', barColor: 'bg-orange-500' }
  if (bmi < 40) return { label: 'Obese Class II', color: 'text-red-400', barColor: 'bg-red-500' }
  return { label: 'Obese Class III', color: 'text-red-500', barColor: 'bg-red-600' }
}

function bmiAnalysis(bmi: number, age: number, gender: string) {
  const tips: string[] = []
  const cat = bmiCategory(bmi)

  if (bmi < 18.5) {
    tips.push('Consider increasing caloric intake with nutrient-dense foods.')
    tips.push('Focus on strength training to build lean mass.')
    tips.push('Consult a dietician for a personalised meal plan.')
  } else if (bmi < 25) {
    tips.push('Great job! You\'re in a healthy range.')
    tips.push('Maintain your current habits with balanced nutrition.')
    tips.push('Keep up regular physical activity — at least 150 min/week.')
  } else if (bmi < 30) {
    tips.push('A moderate caloric deficit (300-500 kcal) can help reach a healthier range.')
    tips.push('Increase cardiovascular exercise and track daily steps.')
    tips.push('Reduce processed foods and added sugars.')
  } else {
    tips.push('Consult a healthcare professional for a guided plan.')
    tips.push('Start with low-impact activities like walking or swimming.')
    tips.push('Monitor blood pressure and blood sugar levels regularly.')
  }

  if (age > 40) tips.push('After 40, metabolism slows — prioritise protein intake and resistance training.')
  if (gender === 'Female' && bmi >= 25) tips.push('Women may benefit from a combination of cardio and weight training for balanced fat loss.')

  return { category: cat, tips }
}

/* ── Ideal weight (Devine formula) ── */
function idealWeight(heightCm: number, gender: string) {
  const inches = heightCm / 2.54
  if (gender === 'Male') return Math.round(50 + 2.3 * (inches - 60))
  return Math.round(45.5 + 2.3 * (inches - 60))
}

/* ═══════ BMI PAGE ═══════ */
export default function BmiPage() {
  const router = useRouter()
  const [dark, setDark] = useState(true)

  const [age, setAge] = useState('')
  const [gender, setGender] = useState('Male')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [activityLevel, setActivityLevel] = useState('Moderate')
  const [waistCm, setWaistCm] = useState('')
  const [neckCm, setNeckCm] = useState('')

  const [result, setResult] = useState<{ bmi: number; analysis: ReturnType<typeof bmiAnalysis>; ideal: number; bmr: number; tdee: number } | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (cur) => { if (!cur) router.push('/auth/login') })
    const t = localStorage.getItem('fitflow_theme')
    if (t === 'light') setDark(false)
    return () => unsub()
  }, [router])

  const toggleTheme = () => { const n = !dark; setDark(n); localStorage.setItem('fitflow_theme', n ? 'dark' : 'light') }

  const handleCalculate = () => {
    const h = parseFloat(heightCm)
    const w = parseFloat(weightKg)
    const a = parseInt(age)
    if (!h || !w || !a) return
    const bmi = w / ((h / 100) ** 2)
    const analysis = bmiAnalysis(bmi, a, gender)
    const ideal = idealWeight(h, gender)

    // BMR (Mifflin-St Jeor)
    let bmr: number
    if (gender === 'Male') bmr = 10 * w + 6.25 * h - 5 * a + 5
    else bmr = 10 * w + 6.25 * h - 5 * a - 161

    const multipliers: Record<string, number> = { Sedentary: 1.2, Light: 1.375, Moderate: 1.55, Active: 1.725, 'Very Active': 1.9 }
    const tdee = Math.round(bmr * (multipliers[activityLevel] || 1.55))

    setResult({ bmi: Math.round(bmi * 10) / 10, analysis, ideal, bmr: Math.round(bmr), tdee })
  }

  /* ── Theme ── */
  const bg = dark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
  const navBg = dark ? 'bg-black/80 border-white/10' : 'bg-white/80 border-gray-200'
  const navText = dark ? 'text-gray-400' : 'text-gray-500'
  const cardBg = dark ? 'border-white/10 bg-white/[.03]' : 'border-gray-200 bg-white'
  const inputBg = dark ? 'bg-white/[.06] border-white/10 text-white placeholder:text-gray-500' : 'bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-400'
  const labelText = dark ? 'text-gray-400' : 'text-gray-600'
  const accentBtn = dark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'
  const mutedText = dark ? 'text-gray-500' : 'text-gray-400'
  const orbOpacity = dark ? '' : 'opacity-30'

  /* ── BMI bar position (0-100%) from BMI 10 to 45 ── */
  const barPercent = result ? Math.min(Math.max(((result.bmi - 10) / 35) * 100, 0), 100) : 0

  return (
    <div className={`relative min-h-screen w-full ${bg} selection:bg-white/20`}>

      <style jsx global>{`
        @keyframes fadeUp{0%{opacity:0;transform:translateY(32px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes pulseSlow{0%,100%{opacity:.12}50%{opacity:.25}}
        @keyframes heartPulse{0%,40%,100%{transform:scaleX(1)}20%{transform:scaleX(1.3)}}
        .anim-fadeUp{animation:fadeUp .85s ease-out both}
        .pulse-slow{animation:pulseSlow 6s ease-in-out infinite}
      `}</style>

      {/* orbs */}
      <div className={`pointer-events-none absolute -left-20 top-40 h-80 w-80 rounded-full bg-red-500/10 blur-[140px] pulse-slow ${orbOpacity}`} />
      <div className={`pointer-events-none absolute -right-20 bottom-40 h-72 w-72 rounded-full bg-green-500/10 blur-[120px] pulse-slow ${orbOpacity}`} />

      {/* ── Nav ── */}
      <GlassNav dark={dark} toggleTheme={toggleTheme} userName="" />

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
        <div className={`pointer-events-none absolute -right-20 top-10 h-60 w-60 rounded-full ${dark ? 'bg-yellow-500/10' : 'bg-yellow-200/40'} blur-[120px] pulse-slow`} />
        <div className="relative z-10 anim-fadeUp">
          <p className={`mb-4 inline-block rounded-full border px-5 py-1.5 text-[11px] font-semibold uppercase tracking-[.3em] ${dark ? 'border-white/20 bg-white/5 text-gray-300' : 'border-gray-300 bg-gray-100 text-gray-600'}`}>
            Health Analytics
          </p>
          <h2 className="text-4xl font-black uppercase leading-tight md:text-7xl">
            BMI <span className="bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 bg-clip-text text-transparent">Calculator</span>
          </h2>
          <p className={`mx-auto mt-4 max-w-xl ${dark ? 'text-gray-400' : 'text-gray-500'} md:text-lg`}>
            Enter your details below to get a comprehensive BMI analysis with personalised health insights.
          </p>
        </div>
      </section>

      {/* ── Input form ── */}
      <section className="relative pb-8">
        <div className="mx-auto max-w-3xl px-6">
          <Reveal>
            <div className={`rounded-3xl border p-8 md:p-10 ${cardBg}`}>
              <h3 className="text-lg font-bold uppercase tracking-wide">Your Details</h3>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-widest ${labelText}`}>Age</label>
                  <input type="number" className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 ${inputBg}`} value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" />
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-widest ${labelText}`}>Gender</label>
                  <select className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 ${inputBg}`} value={gender} onChange={(e) => setGender(e.target.value)}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-widest ${labelText}`}>Height (cm)</label>
                  <input type="number" className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 ${inputBg}`} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="175" />
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-widest ${labelText}`}>Weight (kg)</label>
                  <input type="number" className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 ${inputBg}`} value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="70" />
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-widest ${labelText}`}>Activity Level</label>
                  <select className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 ${inputBg}`} value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)}>
                    <option>Sedentary</option><option>Light</option><option>Moderate</option><option>Active</option><option>Very Active</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-widest ${labelText}`}>Waist (cm) <span className={mutedText}>optional</span></label>
                  <input type="number" className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 ${inputBg}`} value={waistCm} onChange={(e) => setWaistCm(e.target.value)} placeholder="80" />
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-widest ${labelText}`}>Neck (cm) <span className={mutedText}>optional</span></label>
                  <input type="number" className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 ${inputBg}`} value={neckCm} onChange={(e) => setNeckCm(e.target.value)} placeholder="38" />
                </div>
              </div>
              <div className="mt-8 text-center">
                <button onClick={handleCalculate} className={`rounded-full px-10 py-3.5 text-base font-bold transition hover:scale-105 ${accentBtn}`}>
                  Calculate BMI
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Result ── */}
      {result && (
        <section className="pb-20">
          <div className="mx-auto max-w-3xl px-6">
            <Reveal>
              <div className={`rounded-3xl border p-8 md:p-10 ${cardBg}`}>
                <h3 className="text-lg font-bold uppercase tracking-wide">Your Results</h3>

                {/* Big BMI number */}
                <div className="mt-8 text-center">
                  <p className={`text-7xl font-black md:text-9xl ${result.analysis.category.color}`}>{result.bmi}</p>
                  <p className={`mt-2 text-xl font-bold uppercase tracking-wide ${result.analysis.category.color}`}>{result.analysis.category.label}</p>
                </div>

                {/* BMI gradient bar */}
                <div className="mx-auto mt-10 max-w-lg">
                  <div className="relative h-5 w-full overflow-hidden rounded-full">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-400 via-yellow-400 via-green-500 via-yellow-400 via-orange-400 to-red-600 rounded-full" />
                    {/* pointer */}
                    <div className="absolute top-0 h-full w-1 bg-white shadow-[0_0_8px_rgba(255,255,255,.8)] rounded-full transition-all duration-700" style={{ left: `${barPercent}%` }} />
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] font-semibold uppercase tracking-wider">
                    <span className="text-red-400">Underweight</span>
                    <span className="text-green-400">Normal</span>
                    <span className="text-yellow-400">Overweight</span>
                    <span className="text-red-400">Obese</span>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
                  {[
                    { label: 'BMI Score', value: `${result.bmi}`, accent: result.analysis.category.color },
                    { label: 'Ideal Weight', value: `${result.ideal} kg`, accent: 'text-cyan-400' },
                    { label: 'BMR', value: `${result.bmr} kcal`, accent: 'text-purple-400' },
                    { label: 'TDEE', value: `${result.tdee} kcal`, accent: 'text-amber-400' },
                  ].map((s) => (
                    <div key={s.label} className={`rounded-2xl border p-5 text-center transition hover:scale-[1.02] ${dark ? 'border-white/10 bg-white/[.04]' : 'border-gray-200 bg-gray-50'}`}>
                      <p className={`text-[10px] font-semibold uppercase tracking-widest ${mutedText}`}>{s.label}</p>
                      <p className={`mt-2 text-2xl font-black ${s.accent}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Analysis tips */}
                <div className={`mt-8 rounded-2xl border p-6 ${dark ? 'border-green-500/20 bg-green-500/[.05]' : 'border-green-200 bg-green-50'}`}>
                  <p className="text-sm font-bold text-green-400">AI Health Analysis</p>
                  <ul className="mt-4 space-y-3">
                    {result.analysis.tips.map((tip, i) => (
                      <li key={i} className={`flex items-start gap-3 text-sm ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="mt-0.5 text-green-400">→</span>{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>

            {/* BMI reference table */}
            <Reveal className="mt-6">
              <div className={`rounded-3xl border p-8 ${cardBg}`}>
                <h3 className="text-lg font-bold uppercase tracking-wide">BMI Reference Chart</h3>
                <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={dark ? 'bg-white/[.05]' : 'bg-gray-100'}>
                        <th className="px-4 py-3 text-left font-semibold">Category</th>
                        <th className="px-4 py-3 text-left font-semibold">BMI Range</th>
                        <th className="px-4 py-3 text-left font-semibold">Risk Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { cat: 'Severe Underweight', range: '< 16', risk: 'High', color: 'text-red-400' },
                        { cat: 'Underweight', range: '16 – 18.4', risk: 'Moderate', color: 'text-orange-400' },
                        { cat: 'Normal', range: '18.5 – 24.9', risk: 'Low', color: 'text-green-400' },
                        { cat: 'Overweight', range: '25 – 29.9', risk: 'Moderate', color: 'text-yellow-400' },
                        { cat: 'Obese I', range: '30 – 34.9', risk: 'High', color: 'text-orange-400' },
                        { cat: 'Obese II', range: '35 – 39.9', risk: 'Very High', color: 'text-red-400' },
                        { cat: 'Obese III', range: '≥ 40', risk: 'Extremely High', color: 'text-red-500' },
                      ].map((r) => (
                        <tr key={r.cat} className={`border-t ${dark ? 'border-white/5' : 'border-gray-100'} transition hover:${dark ? 'bg-white/[.03]' : 'bg-gray-50'}`}>
                          <td className={`px-4 py-3 font-medium ${r.color}`}>{r.cat}</td>
                          <td className="px-4 py-3">{r.range}</td>
                          <td className={`px-4 py-3 ${r.color}`}>{r.risk}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── What is BMI section (fills page when no result) ── */}
      <section className="py-24 md:py-32">
        <Reveal className="mx-auto max-w-4xl px-6 text-center">
          <p className={`text-[10px] font-semibold uppercase tracking-[.35em] ${mutedText}`}>Understanding BMI</p>
          <h3 className="mt-4 text-3xl font-black uppercase md:text-5xl">What Is Body Mass Index?</h3>
          <p className={`mx-auto mt-6 max-w-2xl text-sm leading-relaxed ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
            Body Mass Index (BMI) is a simple calculation using height and weight to estimate body fat. While it doesn&apos;t measure body fat directly, it correlates with more direct measures of body fat and is a useful screening tool. FitFlow goes beyond basic BMI by also calculating your BMR (Basal Metabolic Rate) and TDEE (Total Daily Energy Expenditure) based on your activity level.
          </p>
        </Reveal>
        <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-6 px-6 md:grid-cols-3">
          {[
            { step: '01', title: 'Enter Details', desc: 'Provide your age, gender, height, weight and activity level.' },
            { step: '02', title: 'Get Your BMI', desc: 'See your BMI score with a colour-coded gauge from red to green.' },
            { step: '03', title: 'Read Analysis', desc: 'Receive personalised health tips, BMR, TDEE and ideal weight.' },
          ].map((s) => (
            <Reveal key={s.step}>
              <div className={`rounded-3xl border p-8 text-center transition hover:-translate-y-1 ${dark ? 'border-white/10 bg-white/[.03] hover:bg-white/[.06]' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                <span className={`text-4xl font-black ${dark ? 'text-white/10' : 'text-gray-200'}`}>{s.step}</span>
                <h4 className="mt-4 text-base font-bold uppercase">{s.title}</h4>
                <p className={`mt-2 text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={`border-t ${dark ? 'border-white/10 bg-white/[.02]' : 'border-gray-200 bg-gray-100'}`}>
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
