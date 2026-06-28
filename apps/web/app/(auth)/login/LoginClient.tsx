'use client'
import { useState, useEffect, useRef }  from 'react'
import { useRouter, useSearchParams }   from 'next/navigation'
import Link                             from 'next/link'
import Image                            from 'next/image'
import { motion, AnimatePresence }      from 'framer-motion'
import {
  Mail, Lock, Eye, EyeOff, Loader2,
  ShoppingCart, Building2, Shield,
  ArrowRight, CheckCircle2, Sparkles,
  AlertCircle, ChevronRight, RefreshCw,
  X, Info, Fingerprint,
} from 'lucide-react'
import apiClient from '@/lib/api/client'
import { setAccessToken } from '@/lib/auth'
import { useAuthStore } from '@/store/auth-store'
import toast from 'react-hot-toast'

const ROLES = [
  {
    key:      'buyer',
    label:    'Buyer',
    fullLabel: 'Sign in as Buyer',
    icon:     ShoppingCart,
    color:    '#3D8BFF',
    hint:     'Use registered email or mobile',
    idLabel:  'Email or Mobile Number',
    idPlaceholder: 'Email or +91 mobile number',
    dashboard: '/buyer/dashboard',
    loginNote: null,
    features: [
      'Browse 33,600+ verified products',
      'Post RFQs and get instant quotes',
      'Track orders and escrow payments',
      'Earn and redeem GOCASH',
    ],
  },
  {
    key:      'vendor',
    label:    'Seller',
    fullLabel: 'Sign in as Seller',
    icon:     Building2,
    color:    '#FF4D00',
    hint:     'Your PAN Number is your Seller Login ID',
    idLabel:  'PAN Number (Login ID)',
    idPlaceholder: 'AAAAA9999A — your PAN Number',
    dashboard: '/seller/dashboard',
    loginNote: {
      text: '⚡ Seller Login ID = PAN Number',
      detail: 'Your 10-character PAN Number is '
            + 'your unique TRADINGO Seller ID.',
    },
    features: [
      'Manage products and orders',
      'View buyer inquiries and RFQs',
      'Access seller analytics dashboard',
      'GO DIGITAL showcase management',
    ],
  },
  {
    key:      'admin',
    label:    'Admin / RM',
    fullLabel: 'Admin Access',
    icon:     Shield,
    color:    '#9B5DE5',
    hint:     'Internal team and relationship managers',
    idLabel:  'Employee Email / Admin ID',
    idPlaceholder: 'your-email@tradingo.in',
    dashboard: '/admin/dashboard',
    loginNote: {
      text: '🔒 Restricted Access',
      detail: 'This login is for TRADINGO internal '
            + 'team members and authorized RMs only.',
    },
    features: [
      'Full marketplace management',
      'KYC verification and approvals',
      'Seller and buyer analytics',
      'Dispute resolution dashboard',
    ],
  },
]

export default function LoginClient() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { setAuth }  = useAuthStore()

  const [activeRole, setActiveRole]   = useState(0)
  const role = ROLES[activeRole]

  const [identifier, setIdentifier]   = useState('')
  const [password, setPassword]       = useState('')
  const [showPwd, setShowPwd]         = useState(false)
  const [rememberMe, setRememberMe]   = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  const [otpMode, setOtpMode]         = useState(false)
  const [otp, setOtp]                 = useState(['','','','','',''])
  const [otpSent, setOtpSent]         = useState(false)
  const [otpLoading, setOtpLoading]   = useState(false)
  const [countdown, setCountdown]     = useState(0)
  const otpRefs = useRef<(HTMLInputElement|null)[]>([])

  const [socialLoading, setSocialLoading] = useState<'google'|'linkedin'|null>(null)

  const redirectTo = searchParams.get('next') || searchParams.get('redirect') || role.dashboard

  useEffect(() => {
    setIdentifier('')
    setPassword('')
    setError('')
    setOtpMode(false)
    setOtpSent(false)
    setOtp(['','','','','',''])
  }, [activeRole])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  useEffect(() => {
    if (otpSent) otpRefs.current[0]?.focus()
  }, [otpSent])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your login ID and password')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res: any = await apiClient.post('/auth/login', {
        identifier: identifier.trim().toUpperCase().replace(/\s/g, ''),
        password,
        role: role.key,
        rememberMe,
      })
      const data = res.data || res
      setAuth(data.user, data.accessToken)
      setAccessToken(data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('userRole', data.user.role)
      document.cookie = `userRole=${data.user.role}; path=/; max-age=86400; SameSite=Lax`
      toast.success(`Welcome back, ${data.user.name?.split(' ')[0]}!`)
      router.push(redirectTo)
    } catch (err: any) {
      const msg = err?.response?.data?.message
      if (msg?.includes('not found'))
        setError('Account not found. Check your login ID.')
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

  const handleSendOtp = async () => {
    if (!identifier.trim()) {
      setError('Enter your mobile number or email first')
      return
    }
    setOtpLoading(true)
    setError('')
    try {
      await apiClient.post('/auth/send-login-otp', {
        identifier: identifier.trim(),
      })
      setOtpSent(true)
      setCountdown(60)
      toast.success('OTP sent successfully!')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send OTP')
    } finally { setOtpLoading(false) }
  }

  const handleOtpChange = (idx: number, val: string) => {
    const v = val.replace(/\D/,'').slice(-1)
    const next = [...otp]
    next[idx] = v
    setOtp(next)
    if (v && idx < 5) otpRefs.current[idx+1]?.focus()
    if (!v && idx > 0) otpRefs.current[idx-1]?.focus()
    if (next.every(d => d) && idx === 5) {
      verifyOtpLogin(next.join(''))
    }
  }

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx-1]?.focus()
    }
  }

  const verifyOtpLogin = async (otpCode?: string) => {
    const code = otpCode || otp.join('')
    if (code.length !== 6) return
    setLoading(true)
    setError('')
    try {
      const res: any = await apiClient.post('/auth/login-otp', {
        identifier: identifier.trim(),
        otp: code,
        rememberMe,
      })
      const data = res.data || res
      setAuth(data.user, data.accessToken)
      setAccessToken(data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('userRole', data.user.role)
      document.cookie = `userRole=${data.user.role}; path=/; max-age=86400; SameSite=Lax`
      toast.success('Welcome back!')
      router.push(redirectTo)
    } catch {
      setError('Invalid or expired OTP. Try again.')
      setOtp(['','','','','',''])
      otpRefs.current[0]?.focus()
    } finally { setLoading(false) }
  }

  const handleGoogleLogin = async () => {
    setSocialLoading('google')
    try {
      window.location.href =
        `${process.env.NEXT_PUBLIC_API_URL}/auth/google`
      + `?role=${role.key}&redirect=${encodeURIComponent(redirectTo)}`
    } catch {
      setSocialLoading(null)
      toast.error('Google login failed. Try again.')
    }
  }

  const handleLinkedInLogin = async () => {
    setSocialLoading('linkedin')
    try {
      window.location.href =
        `${process.env.NEXT_PUBLIC_API_URL}/auth/linkedin`
      + `?role=${role.key}&redirect=${encodeURIComponent(redirectTo)}`
    } catch {
      setSocialLoading(null)
      toast.error('LinkedIn login failed. Try again.')
    }
  }

  const RoleIcon = role.icon

  return (
    <div className="min-h-screen flex" style={{ background:'#1D0001' }}>

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[
          { c:'#9B5DE5', x:'-15%', y:'-20%', s:'55vw' },
          { c:'#3D8BFF', x:'75%',  y:'-10%', s:'45vw' },
          { c:'#FF4D00', x:'35%',  y:'75%',  s:'50vw' },
          { c:'#2DE0E0', x:'-5%',  y:'65%',  s:'35vw' },
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

      <div className="hidden lg:flex lg:w-[42%] xl:w-[45%] flex-col
                      relative overflow-hidden flex-shrink-0"
        style={{ borderRight:'1px solid rgba(255,255,255,0.07)' }}>

        <div className="absolute inset-0"
          style={{
            background:`linear-gradient(160deg,
              ${role.color}14 0%,
              rgba(31,3,24,0.8) 60%,
              rgba(31,3,24,0.95) 100%)`,
          }} />

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-12">

          <Link href="/" className="flex items-center gap-3 mb-auto w-fit">
            <Image src="/logo/trdn.png" alt="TRADINGO"
              width={44} height={44} className="object-contain" />
            <div>
              <p className="text-white font-black text-lg leading-none">
                TRADINGO
              </p>
              <p className="text-white/35 text-[10px] font-medium tracking-wider">
                Trading Right. Go Bright.
              </p>
            </div>
          </Link>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeRole}
              initial={{ opacity:0, x:-20 }}
              animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:20 }}
              transition={{ duration:0.35 }}
              className="py-12">

              <div className="w-16 h-16 rounded-2xl flex items-center
                              justify-center mb-6"
                style={{
                  background:`${role.color}18`,
                  border:`1px solid ${role.color}35`,
                }}>
                <RoleIcon size={28} style={{ color:role.color }} />
              </div>

              <h2 className="text-white font-black mb-2"
                style={{ fontSize:'clamp(22px,2.5vw,32px)' }}>
                {role.fullLabel}
              </h2>
              <p className="text-white/40 text-sm mb-8 leading-relaxed">
                {role.hint}
              </p>

              <div className="space-y-3 mb-10">
                {role.features.map((f, i) => (
                  <motion.div
                    key={f}
                    initial={{ opacity:0, x:-16 }}
                    animate={{ opacity:1, x:0 }}
                    transition={{ delay:i*0.08 }}
                    className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center
                                    justify-center flex-shrink-0"
                      style={{
                        background:`${role.color}15`,
                        border:`1px solid ${role.color}30`,
                      }}>
                      <CheckCircle2 size={13} style={{ color:role.color }} />
                    </div>
                    <span className="text-white/65 text-sm">{f}</span>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { v:'5L+',   l:'Active Users'   },
                  { v:'₹0',    l:'Commission'      },
                  { v:'100%',  l:'Secure Payments' },
                ].map(s => (
                  <div key={s.l}
                    className="text-center py-3 px-2 rounded-2xl"
                    style={{
                      background:'rgba(255,255,255,0.04)',
                      border:'1px solid rgba(255,255,255,0.07)',
                    }}>
                    <p className="font-black text-white text-lg leading-none">
                      {s.v}
                    </p>
                    <p className="text-white/30 text-[9px] mt-0.5">{s.l}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-auto pt-6"
            style={{ borderTop:'1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-white/25 text-[10px] mb-3">
              Trusted by India's MSMEs
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {['ISO 9001','GST Platform','Razorpay','Sentry'].map(t => (
                <span key={t}
                  className="text-[9px] px-2.5 py-1 rounded-full font-semibold"
                  style={{
                    background:'rgba(255,255,255,0.05)',
                    border:'1px solid rgba(255,255,255,0.1)',
                    color:'rgba(255,255,255,0.4)',
                  }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">

        <div className="lg:hidden flex items-center justify-between px-5 py-4"
          style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <Link href="/">
            <Image src="/logo/trdn.png" alt="TRADINGO"
              width={36} height={36} className="object-contain" />
          </Link>
          <Link href="/register"
            className="text-xs font-bold px-3 py-1.5 rounded-full"
            style={{
              background:'rgba(255,77,0,0.1)',
              border:'1px solid rgba(255,77,0,0.25)',
              color:'#FF4D00',
            }}>
            Create Account
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center
                        px-4 py-8 lg:py-12">
          <div className="w-full max-w-md">

            <div className="flex gap-1.5 p-1.5 rounded-2xl mb-7"
              style={{
                background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(255,255,255,0.08)',
              }}>
              {ROLES.map((r, i) => {
                const Icon = r.icon
                const active = activeRole === i
                return (
                  <motion.button
                    key={r.key}
                    onClick={() => setActiveRole(i)}
                    whileTap={{ scale:0.96 }}
                    className="flex-1 flex items-center justify-center gap-1.5
                               py-2.5 px-2 rounded-xl text-xs font-bold
                               transition-all duration-200"
                    style={{
                      background: active ? `${r.color}18` : 'transparent',
                      border: active
                        ? `1px solid ${r.color}35`
                        : '1px solid transparent',
                      color: active ? r.color : 'rgba(255,255,255,0.35)',
                    }}>
                    <Icon size={13} />
                    <span className="hidden sm:inline">{r.label}</span>
                    <span className="sm:hidden text-[10px]">{r.label}</span>
                  </motion.button>
                )
              })}
            </div>

            <motion.div
              key={activeRole}
              initial={{ opacity:0, y:16 }}
              animate={{ opacity:1, y:0 }}
              transition={{ duration:0.3 }}
              className="rounded-3xl overflow-hidden"
              style={{
                background:'rgba(255,255,255,0.045)',
                backdropFilter:'blur(28px)',
                border:'1px solid rgba(255,255,255,0.09)',
                boxShadow:'0 24px 72px rgba(0,0,0,0.45)',
              }}>

              <div className="px-7 pt-7 pb-5"
                style={{
                  background:`linear-gradient(180deg,
                    ${role.color}08, transparent)`,
                  borderBottom:'1px solid rgba(255,255,255,0.06)',
                }}>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-xl flex items-center
                                  justify-center"
                    style={{
                      background:`${role.color}15`,
                      border:`1px solid ${role.color}25`,
                    }}>
                    <RoleIcon size={18} style={{ color:role.color }} />
                  </div>
                  <div>
                    <h1 className="text-white font-black text-xl leading-none">
                      Welcome Back
                    </h1>
                    <p className="text-white/40 text-xs mt-0.5">
                      {role.fullLabel}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-7 py-6 space-y-5">

                {role.loginNote && (
                  <motion.div
                    initial={{ opacity:0, scale:0.97 }}
                    animate={{ opacity:1, scale:1 }}
                    className="flex items-start gap-3 px-4 py-3 rounded-xl"
                    style={{
                      background: activeRole === 1
                        ? 'rgba(242,201,76,0.08)'
                        : 'rgba(155,93,229,0.08)',
                      border: activeRole === 1
                        ? '1px solid rgba(242,201,76,0.2)'
                        : '1px solid rgba(155,93,229,0.2)',
                    }}>
                    <Info size={14} className="flex-shrink-0 mt-0.5"
                      style={{
                        color: activeRole === 1 ? '#F2C94C' : '#9B5DE5',
                      }} />
                    <div>
                      <p className="font-bold text-xs"
                        style={{
                          color: activeRole === 1 ? '#F2C94C' : '#9B5DE5',
                        }}>
                        {role.loginNote.text}
                      </p>
                      <p className="text-white/45 text-[10px] mt-0.5 leading-relaxed">
                        {role.loginNote.detail}
                      </p>
                    </div>
                  </motion.div>
                )}

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

                {activeRole !== 2 && (
                  <div className="space-y-2.5">
                    <motion.button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={!!socialLoading}
                      whileHover={{ y:-1 }}
                      whileTap={{ scale:0.98 }}
                      className="w-full flex items-center gap-3 px-4 py-3
                                 rounded-xl font-semibold text-sm transition-all
                                 disabled:opacity-50"
                      style={{
                        background:'rgba(255,255,255,0.07)',
                        border:'1px solid rgba(255,255,255,0.12)',
                        color:'rgba(255,255,255,0.85)',
                      }}>
                      {socialLoading === 'google'
                        ? <Loader2 size={18} className="animate-spin text-white/50" />
                        : (
                          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] flex-shrink-0">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        )
                      }
                      Continue with Google
                      <ChevronRight size={14} className="ml-auto text-white/25" />
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={handleLinkedInLogin}
                      disabled={!!socialLoading}
                      whileHover={{ y:-1 }}
                      whileTap={{ scale:0.98 }}
                      className="w-full flex items-center gap-3 px-4 py-3
                                 rounded-xl font-semibold text-sm transition-all
                                 disabled:opacity-50"
                      style={{
                        background:'rgba(255,255,255,0.07)',
                        border:'1px solid rgba(255,255,255,0.12)',
                        color:'rgba(255,255,255,0.85)',
                      }}>
                      {socialLoading === 'linkedin'
                        ? <Loader2 size={18} className="animate-spin text-white/50" />
                        : (
                          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] flex-shrink-0">
                            <path fill="#0077B5" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        )
                      }
                      Continue with LinkedIn
                      <ChevronRight size={14} className="ml-auto text-white/25" />
                    </motion.button>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px"
                        style={{ background:'rgba(255,255,255,0.08)' }} />
                      <span className="text-white/25 text-[10px] font-semibold
                                       uppercase tracking-widest">
                        or sign in with
                      </span>
                      <div className="flex-1 h-px"
                        style={{ background:'rgba(255,255,255,0.08)' }} />
                    </div>
                  </div>
                )}

                {activeRole === 0 && (
                  <div className="flex gap-1.5">
                    <button type="button"
                      onClick={() => { setOtpMode(false); setError('') }}
                      className="flex-1 py-2 rounded-xl text-xs font-bold
                                 transition-all"
                      style={{
                        background: !otpMode ? 'rgba(61,139,255,0.15)' : 'rgba(255,255,255,0.04)',
                        border: !otpMode ? '1px solid rgba(61,139,255,0.35)' : '1px solid rgba(255,255,255,0.08)',
                        color: !otpMode ? '#3D8BFF' : 'rgba(255,255,255,0.35)',
                      }}>
                      Password Login
                    </button>
                    <button type="button"
                      onClick={() => { setOtpMode(true); setError('') }}
                      className="flex-1 py-2 rounded-xl text-xs font-bold
                                 transition-all"
                      style={{
                        background: otpMode ? 'rgba(61,139,255,0.15)' : 'rgba(255,255,255,0.04)',
                        border: otpMode ? '1px solid rgba(61,139,255,0.35)' : '1px solid rgba(255,255,255,0.08)',
                        color: otpMode ? '#3D8BFF' : 'rgba(255,255,255,0.35)',
                      }}>
                      <span className="flex items-center justify-center gap-1">
                        <Fingerprint size={12} />
                        OTP Login
                      </span>
                    </button>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">

                  <div>
                    <label className="block text-white/65 text-xs font-semibold mb-1.5">
                      {role.idLabel}
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                        {activeRole === 1
                          ? <Fingerprint size={15} style={{ color:role.color }} />
                          : <Mail size={15} className="text-white/30" />}
                      </div>
                      <input
                        value={identifier}
                        onChange={e => {
                          let v = e.target.value
                          if (activeRole === 1) v = v.toUpperCase()
                          setIdentifier(v)
                          setError('')
                        }}
                        placeholder={role.idPlaceholder}
                        autoComplete="username"
                        className="w-full pl-10 pr-4 py-3.5 rounded-xl text-white
                                   text-sm placeholder-white/25 focus:outline-none
                                   transition-all"
                        style={{
                          background:'rgba(255,255,255,0.06)',
                          border: error
                            ? '1px solid rgba(239,68,68,0.4)'
                            : `1px solid rgba(255,255,255,0.1)`,
                        }}
                        maxLength={activeRole === 1 ? 10 : undefined}
                      />
                      {activeRole === 1 && identifier && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(identifier)
                            ? <CheckCircle2 size={14} className="text-green-400" />
                            : <span className="text-white/25 text-[10px]">
                                {identifier.length}/10
                              </span>
                          }
                        </div>
                      )}
                    </div>
                  </div>

                  {!otpMode && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-white/65 text-xs font-semibold">
                          Password
                        </label>
                        <Link href="/forgot-password"
                          className="text-[11px] font-semibold hover:underline
                                     transition-colors"
                          style={{ color:role.color }}>
                          Forgot password?
                        </Link>
                      </div>
                      <div className="relative">
                        <Lock size={15}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2
                                     text-white/30" />
                        <input
                          type={showPwd ? 'text' : 'password'}
                          value={password}
                          onChange={e => {
                            setPassword(e.target.value)
                            setError('')
                          }}
                          placeholder="Your password"
                          autoComplete="current-password"
                          className="w-full pl-10 pr-11 py-3.5 rounded-xl
                                     text-white text-sm placeholder-white/25
                                     focus:outline-none transition-all"
                          style={{
                            background:'rgba(255,255,255,0.06)',
                            border: error
                              ? '1px solid rgba(239,68,68,0.4)'
                              : '1px solid rgba(255,255,255,0.1)',
                          }}
                        />
                        <button type="button"
                          onClick={() => setShowPwd(p => !p)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2
                                     text-white/30 hover:text-white/70 transition-colors">
                          {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
                        </button>
                      </div>
                    </div>
                  )}

                  {otpMode && activeRole === 0 && (
                    <div className="space-y-3">
                      {!otpSent ? (
                        <motion.button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={otpLoading || !identifier.trim()}
                          whileHover={{ scale:1.01 }}
                          whileTap={{ scale:0.98 }}
                          className="w-full py-3.5 rounded-xl font-bold text-sm
                                     flex items-center justify-center gap-2
                                     disabled:opacity-40 transition-all"
                          style={{
                            background:'rgba(61,139,255,0.15)',
                            border:'1px solid rgba(61,139,255,0.35)',
                            color:'#3D8BFF',
                          }}>
                          {otpLoading
                            ? <><Loader2 size={15} className="animate-spin" />
                                Sending OTP...</>
                            : <><Fingerprint size={15} />
                                Send Login OTP</>
                          }
                        </motion.button>
                      ) : (
                        <div>
                          <p className="text-white/50 text-xs mb-3 text-center">
                            OTP sent to{' '}
                            <strong className="text-white">{identifier}</strong>
                            <br />
                            <span className="text-white/30">
                              Enter the 6-digit code below
                            </span>
                          </p>
                          <div className="flex gap-2 justify-center">
                            {otp.map((digit, idx) => (
                              <input
                                key={idx}
                                ref={el => { otpRefs.current[idx] = el }}
                                value={digit}
                                onChange={e => handleOtpChange(idx, e.target.value)}
                                onKeyDown={e => handleOtpKeyDown(idx, e)}
                                maxLength={1}
                                inputMode="numeric"
                                className="w-11 h-13 text-center text-white
                                           font-black text-xl rounded-xl
                                           focus:outline-none transition-all"
                                style={{
                                  background:'rgba(255,255,255,0.07)',
                                  border: digit
                                    ? '1px solid rgba(61,139,255,0.5)'
                                    : '1px solid rgba(255,255,255,0.12)',
                                }}
                              />
                            ))}
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <button type="button"
                              onClick={() => {
                                setOtpSent(false)
                                setOtp(['','','','','',''])
                              }}
                              className="text-[10px] text-white/30 hover:text-white/60
                                         flex items-center gap-1">
                              <X size={11} /> Change number
                            </button>
                            {countdown > 0
                              ? <span className="text-white/30 text-[10px]">
                                  Resend in {countdown}s
                                </span>
                              : <button type="button"
                                  onClick={handleSendOtp}
                                  className="text-[11px] font-semibold
                                             flex items-center gap-1"
                                  style={{ color:'#3D8BFF' }}>
                                  <RefreshCw size={11} /> Resend OTP
                                </button>
                            }
                          </div>

                          <motion.button
                            type="button"
                            onClick={() => verifyOtpLogin()}
                            disabled={otp.some(d => !d) || loading}
                            whileHover={{ scale:1.01 }}
                            whileTap={{ scale:0.97 }}
                            className="w-full mt-4 py-3.5 rounded-xl font-bold
                                       text-sm flex items-center justify-center
                                       gap-2 disabled:opacity-40"
                            style={{
                              background:'linear-gradient(135deg,#3D8BFF,#2DE0E0)',
                              color:'#fff',
                              boxShadow:'0 6px 20px rgba(61,139,255,0.3)',
                            }}>
                            {loading
                              ? <><Loader2 size={15} className="animate-spin" />
                                  Verifying...</>
                              : <><CheckCircle2 size={15} />
                                  Verify & Sign In</>
                            }
                          </motion.button>
                        </div>
                      )}
                    </div>
                  )}

                  {!otpMode && (
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div
                          onClick={() => setRememberMe(r => !r)}
                          className="w-4 h-4 rounded flex items-center justify-center
                                     transition-all"
                          style={{
                            background: rememberMe
                              ? role.color : 'rgba(255,255,255,0.06)',
                            border: rememberMe
                              ? 'none' : '1px solid rgba(255,255,255,0.15)',
                          }}>
                          {rememberMe && (
                            <span className="text-white text-[8px] font-black">✓</span>
                          )}
                        </div>
                        <span className="text-white/50 text-xs">Keep me signed in</span>
                      </label>
                    </div>
                  )}

                  {!otpMode && (
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ y:-2, scale:1.01 }}
                      whileTap={{ scale:0.97 }}
                      className="w-full py-4 rounded-xl font-black text-base
                                 flex items-center justify-center gap-2
                                 disabled:opacity-60 transition-all"
                      style={{
                        background: activeRole === 0
                          ? 'linear-gradient(135deg,#3D8BFF,#2DE0E0)'
                          : activeRole === 1
                            ? 'linear-gradient(135deg,#FF4D00,#FF7A3D)'
                            : 'linear-gradient(135deg,#9B5DE5,#7B3FE4)',
                        color:'#fff',
                        boxShadow: activeRole === 0
                          ? '0 8px 24px rgba(61,139,255,0.3)'
                          : activeRole === 1
                            ? '0 8px 24px rgba(255,77,0,0.3)'
                            : '0 8px 24px rgba(155,93,229,0.3)',
                      }}>
                      {loading
                        ? <><Loader2 size={17} className="animate-spin" />
                            Signing in...</>
                        : <><Sparkles size={17} />
                            Sign In to {role.label} Account
                            <ArrowRight size={15} /></>
                      }
                    </motion.button>
                  )}
                </form>

                {activeRole !== 2 && (
                  <div className="flex items-center justify-center gap-1
                                  flex-wrap text-[10px] text-white/25 pt-1">
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
                )}

              </div>
            </motion.div>

            <motion.div
              initial={{ opacity:0, y:12 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay:0.25 }}
              className="mt-5 rounded-2xl overflow-hidden"
              style={{
                background:'rgba(255,255,255,0.03)',
                border:'1px solid rgba(255,255,255,0.08)',
              }}>
              <div className="px-5 py-4">
                <p className="text-white/50 text-xs text-center mb-3">
                  New to TRADINGO? Join India's Smartest B2B Platform
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    {
                      href:  '/register/buyer',
                      icon:  ShoppingCart,
                      label: 'Register as Buyer',
                      sub:   'Free Forever',
                      color: '#3D8BFF',
                    },
                    {
                      href:  '/register/vendor',
                      icon:  Building2,
                      label: 'Register as Seller',
                      sub:   'Start Free',
                      color: '#FF4D00',
                    },
                  ].map(c => (
                    <Link key={c.href} href={c.href}>
                      <motion.div
                        whileHover={{ y:-2, scale:1.01 }}
                        whileTap={{ scale:0.97 }}
                        className="flex items-center gap-2.5 px-3.5 py-3
                                   rounded-xl cursor-pointer transition-all"
                        style={{
                          background:`${c.color}0D`,
                          border:`1px solid ${c.color}25`,
                        }}>
                        <div className="w-8 h-8 rounded-xl flex items-center
                                        justify-center flex-shrink-0"
                          style={{
                            background:`${c.color}18`,
                            border:`1px solid ${c.color}30`,
                          }}>
                          <c.icon size={14} style={{ color:c.color }} />
                        </div>
                        <div>
                          <p className="text-white text-xs font-bold leading-tight">
                            {c.label}
                          </p>
                          <p className="text-[9px] font-semibold"
                            style={{ color:c.color }}>
                            {c.sub}
                          </p>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>

                <div className="text-center mt-3">
                  <Link href="/register/admin"
                    className="text-[10px] text-white/25 hover:text-white/50
                               transition-colors inline-flex items-center gap-1">
                    <Shield size={10} />
                    Admin / RM Access Request
                  </Link>
                </div>
              </div>
            </motion.div>

            <div className="mt-5 flex items-center justify-center gap-4 flex-wrap">
              {[
                '🔒 256-bit SSL',
                '🇮🇳 Made in India',
                '⭐ 4.8/5 Rating',
                '📞 24/7 Support',
              ].map(t => (
                <span key={t} className="text-white/20 text-[9px]">{t}</span>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
