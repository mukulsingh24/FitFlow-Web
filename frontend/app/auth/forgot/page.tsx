'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../../../firebaseConfig'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await sendPasswordResetEmail(auth, email)
      setMessage('Password reset link sent! Check your inbox.')
      setError('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
      setMessage('')
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center p-4">
      {/* Background (Same as Login) */}
      <div className="absolute inset-0 z-0">
         <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop')" 
          }}
        />
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" />
        <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-purple-600/30 blur-[100px] animate-pulse mix-blend-overlay" style={{ animationDuration: '4s' }} />
        <div className="absolute top-[40%] -right-[20%] w-[60vw] h-[60vw] rounded-full bg-indigo-600/30 blur-[100px] animate-pulse delay-1000 mix-blend-overlay" style={{ animationDuration: '5s' }} />
      </div>

      <div className="relative z-10 w-full max-w-lg transform transition-all duration-300">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl p-10 relative group">
          
          <div className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-linear-to-r from-white via-white to-white/70 bg-clip-text text-transparent mb-2 tracking-tight">
              Reset Password
            </h1>
            <p className="text-white/60 text-sm font-light">
              Enter your email to receive recovery instructions.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label 
                htmlFor="email" 
                className="text-xs font-medium text-white/60 ml-1 tracking-wide uppercase"
              >
                Email Address
              </label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-white/40 group-focus-within/input:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-3 text-white placeholder-white/20 backdrop-blur-sm focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all duration-200 sm:text-sm"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            {message && <p className="text-green-400 text-sm text-center font-medium bg-green-400/10 py-2 rounded-lg border border-green-400/20">{message}</p>}
            {error && <p className="text-red-400 text-sm text-center font-medium bg-red-400/10 py-2 rounded-lg border border-red-400/20">{error}</p>}

            <button
              type="submit"
              className="w-full rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Send Reset Link
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-white/40">
            Remember your password?{' '}
            <Link href="/auth/login" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
