'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { CheckCircle2, Sparkles, ArrowRight } from 'lucide-react'

export default function RegistrationSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'#1D0001' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background:'radial-gradient(circle,#4ade8020,transparent 70%)', filter:'blur(80px)' }} />
      </div>
      <div className="relative z-10 text-center max-w-md mx-auto px-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background:'rgba(74,222,128,0.1)', border:'2px solid rgba(74,222,128,0.3)' }}>
          <CheckCircle2 size={48} className="text-green-400" />
        </motion.div>

        <h1 className="text-white font-black text-3xl mb-3">Congratulations!</h1>
        <p className="text-white/50 text-sm mb-2">Your account has been created successfully.</p>
        <p className="text-white/30 text-xs mb-8">Next step is selecting your TRADINGO Membership Plan.</p>

        <Link href="/plans/vendor">
          <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
            className="flex items-center gap-2 mx-auto px-8 py-4 rounded-xl font-bold text-base"
            style={{ background:'linear-gradient(135deg,#FF4D00,#FF7A3D)', color:'#fff' }}>
            <Sparkles size={18} />
            Continue to Membership Plans
            <ArrowRight size={18} />
          </motion.button>
        </Link>

        <p className="text-white/20 text-xs mt-6">
          A confirmation email has been sent to your registered email address.
        </p>
      </div>
    </div>
  )
}
