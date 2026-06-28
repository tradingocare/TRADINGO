'use client'
import { useState }       from 'react'
import { useRouter }      from 'next/navigation'
import Link               from 'next/link'
import Image              from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, ArrowLeft, CheckCircle2,
  Loader2, Lock, Eye, EyeOff,
  RefreshCw, ShieldCheck,
} from 'lucide-react'
import apiClient from '@/lib/api/client'
import toast from 'react-hot-toast'

type ForgotStep =
  | 'enter_email'
  | 'otp_sent'
  | 'otp_verified'
  | 'success'

export default function ForgotPasswordPage() {
  const router = useRouter()

  const [step, setStep]             = useState<ForgotStep>('enter_email')
  const [email, setEmail]           = useState('')
  const [otp, setOtp]               = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPwd, setNewPwd]         = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showPwd, setShowPwd]       = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [countdown, setCountdown]   = useState(0)

  const sendOtp = async () => {
    if (!email.trim()) { setError('Enter your registered email or mobile'); return }
    setLoading(true); setError('')
    try {
      await apiClient.post('/auth/forgot-password', { identifier: email.trim() })
      setStep('otp_sent')
      setCountdown(60)
      toast.success('Reset OTP sent!')
      const iv = setInterval(() => {
        setCountdown(c => { if (c <= 1) { clearInterval(iv); return 0 } return c-1 })
      }, 1000)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Account not found')
    } finally { setLoading(false) }
  }

  const verifyOtp = async () => {
    if (otp.length !== 6) { setError('Enter 6-digit OTP'); return }
    setLoading(true); setError('')
    try {
      const res: any = await apiClient.post('/auth/verify-reset-otp', {
        identifier: email, otp,
      })
      setResetToken((res.data || res).resetToken)
      setStep('otp_verified')
    } catch { setError('Invalid or expired OTP') }
    finally { setLoading(false) }
  }

  const resetPassword = async () => {
    if (newPwd.length < 8) { setError('Password must be at least 8 characters'); return }
    if (newPwd !== confirmPwd) { setError('Passwords do not match'); return }
    setLoading(true); setError('')
    try {
      await apiClient.post('/auth/reset-password', {
        resetToken, newPassword: newPwd,
      })
      setStep('success')
      toast.success('Password reset successfully!')
    } catch { setError('Reset failed. Try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center
                    px-4 py-12" style={{ background:'#1D0001' }}>

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px]
                        h-[600px] rounded-full opacity-12"
          style={{ background:'radial-gradient(circle,#FF4D0018,transparent 70%)',
                   filter:'blur(80px)' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/logo/trdn.png" alt="TRADINGO"
              width={44} height={44} className="object-contain mx-auto mb-3" />
          </Link>
        </div>

        <div className="rounded-3xl p-7 sm:p-8"
          style={{
            background:'rgba(255,255,255,0.045)',
            backdropFilter:'blur(28px)',
            border:'1px solid rgba(255,255,255,0.09)',
            boxShadow:'0 24px 72px rgba(0,0,0,0.45)',
          }}>

          <AnimatePresence mode="wait">

            {step === 'enter_email' && (
              <motion.div key="s1"
                initial={{ opacity:0 }} animate={{ opacity:1 }}
                exit={{ opacity:0 }} className="space-y-5">
                <div>
                  <h2 className="text-white font-black text-2xl">
                    Forgot Password?
                  </h2>
                  <p className="text-white/45 text-sm mt-1">
                    No worries. We'll send a reset OTP to your
                    registered email or mobile.
                  </p>
                </div>
                <div>
                  <label className="block text-white/60 text-xs
                                    font-semibold mb-1.5">
                    Email or Mobile Number
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2
                      -translate-y-1/2 text-white/30" />
                    <input
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError('') }}
                      placeholder="your@email.com or 9876543210"
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl text-white
                                 text-sm placeholder-white/25 focus:outline-none"
                      style={{
                        background:'rgba(255,255,255,0.07)',
                        border: error
                          ? '1px solid rgba(239,68,68,0.4)'
                          : '1px solid rgba(255,255,255,0.12)',
                      }}
                    />
                  </div>
                  {error && (
                    <p className="text-red-400 text-[10px] mt-1.5">? {error}</p>
                  )}
                </div>
                <motion.button
                  onClick={sendOtp}
                  disabled={loading}
                  whileHover={{ scale:1.02 }}
                  whileTap={{ scale:0.97 }}
                  className="w-full py-3.5 rounded-xl font-bold text-sm
                             flex items-center justify-center gap-2
                             disabled:opacity-50"
                  style={{
                    background:'linear-gradient(135deg,#FF4D00,#FF7A3D)',
                    color:'#fff',
                    boxShadow:'0 6px 20px rgba(255,77,0,0.3)',
                  }}>
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" />
                        Sending OTP...</>
                    : <>Send Reset OTP ?</>
                  }
                </motion.button>
                <Link href="/login"
                  className="flex items-center justify-center gap-1.5
                             text-xs text-white/35 hover:text-white/60">
                  <ArrowLeft size={12} /> Back to Sign In
                </Link>
              </motion.div>
            )}

            {step === 'otp_sent' && (
              <motion.div key="s2"
                initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:-20 }} className="space-y-5">
                <div>
                  <h2 className="text-white font-black text-2xl">
                    Enter OTP
                  </h2>
                  <p className="text-white/45 text-sm mt-1">
                    We sent a 6-digit OTP to{' '}
                    <strong className="text-white">{email}</strong>
                  </p>
                </div>
                <div>
                  <input
                    value={otp}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/,'').slice(0,6)
                      setOtp(v); setError('')
                    }}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    inputMode="numeric"
                    className="w-full text-center py-4 rounded-xl text-white
                               font-black text-2xl tracking-[0.5em]
                               placeholder-white/20 placeholder:text-base
                               placeholder:font-normal placeholder:tracking-normal
                               focus:outline-none"
                    style={{
                      background:'rgba(255,255,255,0.07)',
                      border: error
                        ? '1px solid rgba(239,68,68,0.4)'
                        : '1px solid rgba(255,255,255,0.12)',
                    }}
                  />
                  {error && (
                    <p className="text-red-400 text-[10px] mt-1.5">? {error}</p>
                  )}
                </div>
                <div className="flex justify-center gap-2">
                  {Array.from({ length:6 }).map((_,i) => (
                    <div key={i} className="w-2 h-2 rounded-full transition-all"
                      style={{
                        background: i < otp.length
                          ? '#FF4D00' : 'rgba(255,255,255,0.1)',
                      }} />
                  ))}
                </div>
                <motion.button
                  onClick={verifyOtp}
                  disabled={loading || otp.length !== 6}
                  whileHover={{ scale:1.02 }}
                  whileTap={{ scale:0.97 }}
                  className="w-full py-3.5 rounded-xl font-bold text-sm
                             flex items-center justify-center gap-2
                             disabled:opacity-40"
                  style={{
                    background:'linear-gradient(135deg,#FF4D00,#FF7A3D)',
                    color:'#fff',
                  }}>
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" />
                        Verifying...</>
                    : <>Verify OTP ?</>
                  }
                </motion.button>
                <div className="flex items-center justify-between text-xs">
                  <button onClick={() => setStep('enter_email')}
                    className="text-white/30 hover:text-white/60
                               flex items-center gap-1">
                    <ArrowLeft size={11} /> Change email
                  </button>
                  {countdown > 0
                    ? <span className="text-white/25">
                        Resend in {countdown}s
                      </span>
                    : <button onClick={sendOtp}
                        className="font-semibold flex items-center gap-1"
                        style={{ color:'#FF4D00' }}>
                        <RefreshCw size={11} /> Resend OTP
                      </button>
                  }
                </div>
              </motion.div>
            )}

            {step === 'otp_verified' && (
              <motion.div key="s3"
                initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:-20 }} className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center
                                  justify-center"
                    style={{ background:'rgba(74,222,128,0.12)',
                             border:'1px solid rgba(74,222,128,0.3)' }}>
                    <ShieldCheck size={18} className="text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-black text-xl">
                      Set New Password
                    </h2>
                    <p className="text-green-400 text-[10px] font-semibold">
                      ? OTP Verified Successfully
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-white/60 text-xs
                                      font-semibold mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3.5 top-1/2
                        -translate-y-1/2 text-white/30" />
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={newPwd}
                        onChange={e => { setNewPwd(e.target.value); setError('') }}
                        placeholder="Min 8 chars with number + symbol"
                        className="w-full pl-10 pr-11 py-3.5 rounded-xl text-white
                                   text-sm placeholder-white/25 focus:outline-none"
                        style={{ background:'rgba(255,255,255,0.07)',
                                 border:'1px solid rgba(255,255,255,0.12)' }}
                      />
                      <button type="button"
                        onClick={() => setShowPwd(p => !p)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2
                                   text-white/30 hover:text-white/70">
                        {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs
                                      font-semibold mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3.5 top-1/2
                        -translate-y-1/2 text-white/30" />
                      <input
                        type="password"
                        value={confirmPwd}
                        onChange={e => {
                          setConfirmPwd(e.target.value); setError('')
                        }}
                        placeholder="Re-enter new password"
                        className="w-full pl-10 pr-4 py-3.5 rounded-xl text-white
                                   text-sm placeholder-white/25 focus:outline-none"
                        style={{
                          background:'rgba(255,255,255,0.07)',
                          border: confirmPwd && confirmPwd === newPwd
                            ? '1px solid rgba(74,222,128,0.4)'
                            : '1px solid rgba(255,255,255,0.12)',
                        }}
                      />
                      {confirmPwd && confirmPwd === newPwd && (
                        <CheckCircle2 size={14} className="absolute right-3.5
                          top-1/2 -translate-y-1/2 text-green-400" />
                      )}
                    </div>
                  </div>
                </div>
                {error && (
                  <p className="text-red-400 text-[10px]">? {error}</p>
                )}
                <motion.button
                  onClick={resetPassword}
                  disabled={loading}
                  whileHover={{ scale:1.02 }}
                  whileTap={{ scale:0.97 }}
                  className="w-full py-3.5 rounded-xl font-bold text-sm
                             flex items-center justify-center gap-2
                             disabled:opacity-50"
                  style={{
                    background:'linear-gradient(135deg,#4ade80,#22c55e)',
                    color:'#fff',
                    boxShadow:'0 6px 20px rgba(74,222,128,0.25)',
                  }}>
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" />
                        Resetting...</>
                    : <><ShieldCheck size={15} />
                        Reset Password</>
                  }
                </motion.button>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div key="s4"
                initial={{ opacity:0, scale:0.9 }}
                animate={{ opacity:1, scale:1 }}
                className="text-center py-4 space-y-4">
                <motion.div
                  animate={{ scale:[0,1.2,1] }}
                  transition={{ duration:0.5 }}
                  className="w-16 h-16 rounded-2xl flex items-center
                              justify-center mx-auto"
                  style={{ background:'rgba(74,222,128,0.12)',
                           border:'1px solid rgba(74,222,128,0.3)' }}>
                  <CheckCircle2 size={32} className="text-green-400" />
                </motion.div>
                <div>
                  <h2 className="text-white font-black text-2xl mb-1">
                    Password Reset!
                  </h2>
                  <p className="text-white/45 text-sm">
                    Your password has been reset successfully.
                    You can now sign in with your new password.
                  </p>
                </div>
                <motion.button
                  onClick={() => router.push('/login')}
                  whileHover={{ scale:1.02 }}
                  whileTap={{ scale:0.97 }}
                  className="w-full py-3.5 rounded-xl font-bold text-sm"
                  style={{
                    background:'linear-gradient(135deg,#FF4D00,#FF7A3D)',
                    color:'#fff',
                  }}>
                  Go to Sign In ?
                </motion.button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {step !== 'success' && (
          <div className="flex items-center justify-center gap-3 mt-5
                          text-[10px] text-white/25 flex-wrap">
            <Link href="/login" className="hover:text-white/50">
              ? Back to Sign In
            </Link>
            <span>�</span>
            <a href="mailto:support@tradingo.in"
              className="hover:text-white/50">
              Support: support@tradingo.in
            </a>
            <span>�</span>
            <a href="tel:+911800000000"
              className="hover:text-white/50">
              1800-XXX-XXXX
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
