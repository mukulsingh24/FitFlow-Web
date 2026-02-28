'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signInWithPopup, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth'
import { auth, googleProvider } from '../../../firebaseConfig'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [adminMode, setAdminMode] = useState(false)
  const [adminKey, setAdminKey] = useState('')
  const [adminError, setAdminError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.emailVerified) {
          router.push('/dashboard')
        } else {
          router.push('/auth/verification')
        }
      }
    })
    return () => unsubscribe()
  }, [router])

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user
      console.log('Google Login Success:', user)
      // Navigate to dashboard or home page after successful login
      router.push('/dashboard') 
    } catch (error) {
      console.error('Google Login Error:', error)
      setError('Google Login failed. Please try again.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/dashboard')
    } catch (err: unknown) {
      console.error("Login failed", err)
      setError("Failed to sign in. Please check your credentials.")
    }
  }

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setAdminError('')
    if (adminKey === 'amd1234567890') {
      localStorage.setItem('fitflow_admin', 'true')
      localStorage.setItem('fitflow_profile', JSON.stringify({ displayName: 'Admin' }))
      router.push('/dashboard')
    } else {
      setAdminError('Invalid admin key. Access denied.')
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center p-4">
      {/* Background Anime-style / Fitness Ambience */}
      <div className="absolute inset-0 z-0">
         {/* Background Image with Overlay */}
         <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop')" 
          }}
        />
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" />
        
        {/* Animated Gradient Orbs */}
        <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-purple-600/30 blur-[100px] animate-pulse mix-blend-overlay" style={{ animationDuration: '4s' }} />
        <div className="absolute top-[40%] -right-[20%] w-[60vw] h-[60vw] rounded-full bg-indigo-600/30 blur-[100px] animate-pulse delay-1000 mix-blend-overlay" style={{ animationDuration: '5s' }} />
        
        {/* Dynamic Grid / Mesh Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] mask-[radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-2xl transform transition-all duration-300">
        <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl p-12 relative group">
          
          {/* Subtle sheen effect on hover */}
          <div className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          {/* Logo / Header */}
          <div className="text-center mb-10">
            <h1 className="text-6xl font-bold bg-linear-to-r from-white via-white to-white/70 bg-clip-text text-transparent mb-3 tracking-tight">
              FitFlow
            </h1>
            <p className="text-white/60 text-lg font-light">
              Welcome back, athlete.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 text-center text-sm font-medium backdrop-blur-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Input Group: Email */}
            <div className="space-y-3">
              <label 
                htmlFor="email" 
                className="text-sm font-medium text-white/70 ml-1 tracking-wide uppercase"
              >
                Email or Username
              </label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {/* User Icon */}
                  <svg className="h-6 w-6 text-white/50 group-focus-within/input:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-white text-lg placeholder-white/20 backdrop-blur-sm focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all duration-200"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            {/* Input Group: Password */}
            <div className="space-y-3">
              <div className="flex justify-between items-center ml-1">
                <label 
                  htmlFor="password" 
                  className="text-sm font-medium text-white/70 tracking-wide uppercase"
                >
                  Password
                </label>
                <Link href="/auth/forgot" className="text-sm text-indigo-300 hover:text-indigo-200 transition-colors">
                  Forgot?
                </Link>
              </div>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {/* Lock Icon */}
                  <svg className="h-6 w-6 text-white/50 group-focus-within/input:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-white text-lg placeholder-white/20 backdrop-blur-sm focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all duration-200"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Primary Action */}
            <button
              type="submit"
              className="w-full rounded-2xl bg-linear-to-r from-indigo-600 to-violet-600 py-4 text-lg font-bold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Sign In
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 py-1 text-white/50 bg-[#162032]/80 rounded-full backdrop-blur-xl">Or continue with</span>
            </div>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-1 gap-5">
            {/* Google Button — Full width */}
            <button 
              type="button"
              onClick={handleGoogleLogin}
              className="relative flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-4 px-6 text-lg font-medium text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 group hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/10"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </div>

          <p className="mt-8 text-center text-xs text-white/40">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
              Sign up free
            </Link>
          </p>

          {/* ── Admin Login Toggle ── */}
          <div className="relative mt-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 py-1 text-white/50 bg-[#162032]/80 rounded-full backdrop-blur-xl">Admin Access</span>
            </div>
          </div>

          {!adminMode ? (
            <button
              type="button"
              onClick={() => { setAdminMode(true); setError(''); setAdminError('') }}
              className="mt-6 w-full flex items-center justify-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 py-4 px-6 text-lg font-semibold text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all duration-200 hover:-translate-y-0.5"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Login as Admin
            </button>
          ) : (
            <form onSubmit={handleAdminLogin} className="mt-6 space-y-4">
              {adminError && (
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 text-center text-sm font-medium backdrop-blur-md">
                  {adminError}
                </div>
              )}
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-6 w-6 text-amber-400/60 group-focus-within/input:text-amber-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="block w-full rounded-2xl border border-amber-500/20 bg-amber-500/5 py-4 pl-12 pr-4 text-white text-lg placeholder-amber-300/30 backdrop-blur-sm focus:border-amber-500/50 focus:bg-amber-500/10 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all duration-200"
                  placeholder="Enter admin key"
                  autoFocus
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setAdminMode(false); setAdminKey(''); setAdminError('') }}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white/60 hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-orange-400 hover:shadow-amber-500/40 transition-all hover:-translate-y-0.5"
                >
                  Access Dashboard
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
