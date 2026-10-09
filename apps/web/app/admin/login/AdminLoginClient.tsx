'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Lock, Eye, EyeOff, ShieldCheck,
  ArrowRight, AlertCircle, X, Sparkles,
} from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { TurnstileWidget } from '@/components/auth/turnstile-widget'
import apiClient from '@/lib/api/client'
import { setAccessToken } from '@/lib/auth'
import { persistSession } from '@/lib/auth/session'
import { resolvePostLoginTarget } from '@/lib/auth/redirects'
import { useAuthStore } from '@/store/auth-store'
import { toast } from '@/components/ui/use-toast'

// The page itself IS the admin authentication surface — no role
// selector. The backend enforces the admin roleMap
// (admin/super_admin/rm/RM/SUPER_ADMIN/ADMIN) on POST /auth/login.
const ADMIN_LOGIN_ROLE = 'admin'

export default function AdminLoginClient() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { setAuth }  = useAuthStore()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword]     = useState('')
  const [showPwd, setShowPwd]       = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')

  const nextParam = searchParams.get('next') || searchParams.get('redirect')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your admin ID and password')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res: any = await apiClient.post('/auth/login', {
        identifier: identifier.trim().toUpperCase().replace(/\s/g, ''),
        password,
        role: ADMIN_LOGIN_ROLE,
        rememberMe,
        turnstileToken,
      })
      const data = res.data || res
      setAuth(data.user, data.accessToken)
      setAccessToken(data.accessToken)
      persistSession({ user: data.user, accessToken: data.accessToken })
      toast.success(`Welcome back, ${data.user.name?.split(' ')[0]}!`)
      router.push(resolvePostLoginTarget(data.user.role, nextParam))
    } catch (err: any) {
      const msg = err?.response?.data?.message
      if (msg?.includes('not found'))
        setError('Account not found. Check your admin ID.')
      else if (msg?.includes('not a admin'))
        setError('Access denied. Admin credentials required.')
      else if (msg?.includes('password'))
        setError('Incorrect password. Try again or reset it.')
      else if (msg?.includes('suspended'))
        setError('Account suspended. Contact support@tradingo.in')
      else if (msg?.includes('pending'))
        setError('Account pending approval. Check your email for updates.')
      else
        setError(msg || 'Login failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background:'var(--bg-base)' }}>

      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {[
          { c:'#9B5DE5', x:'-15%', y:'-20%', s:'55vw' },
          { c:'#3D8BFF', x:'75%',  y:'-10%', s:'45vw' },
          { c:'#f59e0b', x:'35%',  y:'75%',  s:'50vw' },
        ].map((b, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              left:b.x, top:b.y, width:b.s, height:b.s,
              background:`radial-gradient(circle,${b.c}14,transparent 70%)`,
              filter:'blur(90px)',
            }} />
        ))}
        <div className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage:'radial-gradient(#fff 1px,transparent 1px)',
            backgroundSize:'36px 36px',
          }} />
      </div>

      <motion.div
        initial={{ opacity:0, y:16 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:0.3 }}
        className="relative w-full max-w-md rounded-3xl bg-surface"
        style={{
          border:'1px solid var(--border-color)',
          boxShadow:'0 24px 72px rgba(0,0,0,0.45)',
        }}>

        <div className="px-7 pt-7 pb-5"
          style={{ borderBottom:'1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between mb-5">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo/trdn5.png" alt="TRADINGO"
                width={34} height={34} className="object-contain" />
            </Link>
            <span className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full"
              style={{
                background:'rgba(155,93,229,0.1)',
                border:'1px solid rgba(155,93,229,0.25)',
                color:'#9B5DE5',
              }}>
              <ShieldCheck size={11} />
              Restricted Access
            </span>
          </div>
          <h1 className="text-white font-black text-xl leading-none">
            Admin Sign In
          </h1>
          <p className="text-white/40 text-xs mt-1.5">
            TRADINGO internal team console
          </p>
        </div>

        <div className="px-7 py-6 space-y-5">

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity:0, height:0 }}
                animate={{ opacity:1, height:'auto' }}
                exit={{ opacity:0, height:0 }}
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
                style={{
                  background:'rgba(239,68,68,0.1)',
                  border:'1px solid rgba(239,68,68,0.25)',
                }}>
                <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-xs">{error}</p>
                <button onClick={() => setError('')}
                  className="ml-auto text-red-400/50 hover:text-red-400">
                  <X size={13} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-4">

            <div>
              <label htmlFor="admin-identifier"
                className="block text-white/65 text-xs font-semibold mb-1.5">
                Employee Email / Admin ID
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                  <Mail size={15} className="text-white/30" />
                </div>
                <input
                  id="admin-identifier"
                  value={identifier}
                  onChange={e => {
                    setIdentifier(e.target.value)
                    setError('')
                  }}
                  placeholder="your-email@tradingo.in"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none transition-all bg-surface-secondary"
                  style={{
                    border: error
                      ? '1px solid rgba(239,68,68,0.4)'
                      : '1px solid var(--border-color)',
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="admin-password"
                  className="text-white/65 text-xs font-semibold">
                  Password
                </label>
                <Link href="/forgot-password"
                  className="text-[11px] font-semibold hover:underline transition-colors"
                  style={{ color:'#9B5DE5' }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  id="admin-password"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3.5 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none transition-all bg-surface-secondary"
                  style={{
                    border: error
                      ? '1px solid rgba(239,68,68,0.4)'
                      : '1px solid var(--border-color)',
                  }}
                />
                <button type="button"
                  onClick={() => setShowPwd(p => !p)}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                  {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setRememberMe(r => !r)}
                  className="w-4 h-4 rounded flex items-center justify-center transition-all"
                  style={{
                    background: rememberMe ? '#9B5DE5' : 'var(--bg-elevated)',
                    border: rememberMe ? 'none' : '1px solid var(--border-color)',
                  }}
                  role="checkbox"
                  aria-checked={rememberMe}
                  aria-label="Keep me signed in"
                >
                  {rememberMe && (
                    <span className="text-white text-[8px] font-black">✓</span>
                  )}
                </div>
                <span className="text-white/50 text-xs">Keep me signed in</span>
              </label>
            </div>

            <TurnstileWidget onToken={setTurnstileToken} />

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ y:-2, scale:1.01 }}
              whileTap={{ scale:0.97 }}
              className="w-full py-4 rounded-xl font-black text-base flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
              style={{
                background:'linear-gradient(135deg,#9B5DE5,#7B3FE4)',
                color:'#fff',
                boxShadow:'0 8px 24px rgba(155,93,229,0.3)',
              }}>
              {loading
                ? <><LoadingSpinner size="sm" /> Signing in...</>
                : <><Sparkles size={17} /> Sign In to Admin Console <ArrowRight size={15} /></>
              }
            </motion.button>
          </form>

          <div className="flex items-center justify-center gap-1 flex-wrap text-[10px] text-text-tertiary pt-1">
            <span>Having trouble?</span>
            <Link href="/help/login"
              className="hover:text-white/50 underline transition-colors">
              Login Help
            </Link>
            <span>·</span>
            <Link href="/forgot-password"
              className="hover:text-white/50 underline transition-colors">
              Reset Password
            </Link>
            <span>·</span>
            <a href="mailto:support@tradingo.in"
              className="hover:text-white/50 underline transition-colors">
              Contact Support
            </a>
          </div>

          <p className="text-center text-xs text-text-tertiary">
            Buyer or Seller?{' '}
            <Link href="/login"
              className="font-semibold hover:underline transition-colors"
              style={{ color:'var(--accent)' }}>
              Sign in to the marketplace
            </Link>
          </p>
        </div>

        <div className="px-7 pb-6">
          <p className="text-center">
            <span className="text-[10px] text-white/25 inline-flex items-center gap-1">
              <ShieldCheck size={10} />
              Admin / RM accounts provisioned by request
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
