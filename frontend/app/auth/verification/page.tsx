'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '../../../firebaseConfig'
import { sendEmailVerification, reload, User } from 'firebase/auth'

export default function Verification() {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const checkVerification = async () => {
      if (auth.currentUser) {
        setUser(auth.currentUser);
        await reload(auth.currentUser);
        if (auth.currentUser.emailVerified) {
             router.push('/dashboard')
        }
      } else {
      }
    }

    checkVerification();
    const interval = setInterval(checkVerification, 3000);
    return () => clearInterval(interval);
  }, [router]);

  const handleResend = async () => {
    if (!auth.currentUser) return;
    setIsResending(true);
    setMessage('');
    try {
      console.log("Attempting to resend verification email to:", auth.currentUser.email);
      await sendEmailVerification(auth.currentUser);
      console.log("Verification email sent successfully.");
      setMessage('Verification email resent! Please check your inbox (and spam).');
    } catch (error: unknown) {
      console.error("Error sending verification email:", error);
      const firebaseErr = error as { code?: string; message?: string }
      if (firebaseErr.code === 'auth/too-many-requests') {
         setMessage('Too many requests. Please wait a few minutes before trying again.')
      } else {
         setMessage('Error: ' + (firebaseErr.message || 'Unknown error'));
      }
    } finally {
      setIsResending(false);
    }
  }

  const handleManualCheck = async () => {
      if(auth.currentUser) {
          await reload(auth.currentUser);
           if (auth.currentUser.emailVerified) {
             router.push('/dashboard')
        } else {
            setMessage('Email not yet verified. Please check your inbox and click the link.')
        }
      }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center p-4">
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
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent mb-2 tracking-tight">
              Verify Email
            </h1>
            <p className="text-white/60 text-sm font-light">
               We&apos;ve sent a verification link to <strong>{user?.email}</strong>. Please check your inbox and click the link to continue.
            </p>
          </div>

          <div className="space-y-6">
            
            <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse"></div>
                  <svg className="relative w-24 h-24 drop-shadow-2xl transform hover:scale-105 transition-transform duration-300" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="100" cy="100" r="90" fill="url(#paint0_linear)" fillOpacity="0.2"/>
                    <path d="M45 75C45 66.7157 51.7157 60 60 60H140C148.284 60 155 66.7157 155 75V125C155 133.284 148.284 140 140 140H60C51.7157 140 45 133.284 45 125V75Z" fill="url(#paint1_linear)" stroke="white" strokeWidth="2"/>
                    <path d="M45 75L100 110L155 75" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <defs>
                      <linearGradient id="paint0_linear" x1="100" y1="10" x2="100" y2="190" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#6366F1"/>
                        <stop offset="1" stopColor="#8B5CF6"/>
                      </linearGradient>
                      <linearGradient id="paint1_linear" x1="100" y1="60" x2="100" y2="140" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#818CF8"/>
                        <stop offset="1" stopColor="#6366F1"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                
                <p className="text-xs text-center text-white/40 max-w-xs">
                    Please allow a few minutes for the email to arrive. Check your spam folder if you don&apos;t see it.
                </p>
            </div>

            {message && <p className="text-indigo-200 text-sm text-center bg-indigo-500/10 py-2 rounded-lg border border-indigo-500/20">{message}</p>}

             <button
              onClick={handleManualCheck}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              I&apos;ve Verified My Email
            </button>
          </div>

          <p className="mt-8 text-center text-xs text-white/40">
            Didn&apos;t receive the email?{' '}
            <button 
                onClick={handleResend}
                disabled={isResending}
                className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors bg-transparent border-none cursor-pointer disabled:opacity-50"
            >
              {isResending ? 'Sending...' : 'Resend'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
