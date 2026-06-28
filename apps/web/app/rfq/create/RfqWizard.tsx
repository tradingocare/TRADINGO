"use client"

import React from 'react'
import Step1Basic from './steps/Step1Basic'
import Step2Specifications from './steps/Step2Specifications'
import Step3Review from './steps/Step3Review'
import StepCard from './steps/vendor-registration/components/StepCard'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const btnPrimary = {
  background: 'linear-gradient(135deg, #FF4D00, #FF7A3D)',
  color: '#fff',
  boxShadow: '0 4px 16px rgba(255,77,0,0.3)'
}

const btnSecondary = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.8)'
}

export interface RfqForm {
  title: string
  category: string
  description: string
  quantity: string
  unit: string
  technicalRequirements: string
  qualityStandards: string
  deliveryLocation: string
  preferredRegions: string
  deliveryTimeline: string
  paymentTerms: string
  agreeToTerms: boolean
}

export const initialForm: RfqForm = {
  title: '',
  category: '',
  description: '',
  quantity: '',
  unit: '',
  technicalRequirements: '',
  qualityStandards: '',
  deliveryLocation: '',
  preferredRegions: '',
  deliveryTimeline: '',
  paymentTerms: '',
  agreeToTerms: false,
}

export default function RfqWizard() {
  const [step, setStep] = React.useState(1)
  const [direction, setDirection] = React.useState(1)
  const [form, setForm] = React.useState<RfqForm>(initialForm)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const update = (key: keyof RfqForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: '' }))
    localStorage.setItem('tradingo_rfq_draft', JSON.stringify({ ...form, [key]: value }))
  }

  const validateStep1 = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'Title is required'
    else if (form.title.trim().length < 5) e.title = 'Minimum 5 characters'
    if (!form.category) e.category = 'Category is required'
    if (!form.description.trim()) e.description = 'Description is required'
    else if (form.description.trim().length < 20) e.description = 'Minimum 20 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.technicalRequirements.trim()) e.technicalRequirements = 'Technical requirements are required'
    else if (form.technicalRequirements.trim().length < 30) e.technicalRequirements = 'Minimum 30 characters'
    if (!form.deliveryLocation.trim()) e.deliveryLocation = 'Delivery location is required'
    if (!form.deliveryTimeline.trim()) e.deliveryTimeline = 'Delivery timeline is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const goNext = () => {
    if (step === 1 && validateStep1()) {
      setDirection(1)
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setDirection(1)
      setStep(3)
    }
  }

  const goBack = () => {
    setDirection(-1)
    setStep(s => s - 1)
  }

  const handleSubmit = () => {
    if (!form.agreeToTerms) return

    const rfqData = {
      title: form.title,
      category: form.category,
      description: form.description,
      quantity: form.quantity ? Number(form.quantity) : 0,
      unit: form.unit,
      technicalRequirements: form.technicalRequirements,
      qualityStandards: form.qualityStandards,
      deliveryLocation: form.deliveryLocation,
      preferredRegions: form.preferredRegions,
      deliveryTimeline: form.deliveryTimeline,
      paymentTerms: form.paymentTerms,
      agreedToTerms: true,
      status: 'open' as const,
    }

    console.log('RFQ Submitted:', rfqData)
    localStorage.removeItem('tradingo_rfq_draft')
  }

  React.useEffect(() => {
    const saved = localStorage.getItem('tradingo_rfq_draft')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setForm(parsed)
      } catch (e) {}
    }
  }, [])

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction > 0 ? -80 : 80, opacity: 0 }),
  }

  const stepIcons = [
    { icon: '📝', label: 'Basic' },
    { icon: '⚙️', label: 'Specs' },
    { icon: '✅', label: 'Review' },
  ]

const isNextDisabled = false

  return (
    <div className="min-h-screen relative overflow-hidden"
      style={{ background: '#1D0001' }}>
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Create New RFQ</h1>
          <p className="text-white/40 text-sm">Request for Quotation - Multi-step wizard</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {stepIcons.map((s, i) => {
              const num = i + 1
              const done = step > num
              const current = step === num
              return (
                <div key={i} className="flex items-center">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300"
                    style={{
                      background: done
                        ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                        : current
                        ? 'linear-gradient(135deg, #FF4D00, #FF7A3D)'
                        : 'rgba(255,255,255,0.06)',
                      border: done || current ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      color: done || current ? '#fff' : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    {done ? '✓' : num}
                  </div>
                  <span className={`ml-2 text-xs hidden sm:inline ${current ? 'text-white' : 'text-white/30'}`}>
                    {s.label}
                  </span>
                  {i < 2 && (
                    <div className="w-12 sm:w-20 h-[2px] mx-2 sm:mx-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #FF4D00, #FF7A3D)' }}
                        initial={{ width: '0%' }}
                        animate={{ width: `${Math.max(0, ((step - 1) / 2) * 100 - (i * 50))}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <StepCard icon="📝" title="Basic RFQ Details" subtitle="Enter the fundamental RFQ information">
                <Step1Basic form={form} errors={errors} update={update} />
              </StepCard>

              <div className="flex justify-end mt-6">
                <button
                  onClick={goNext}
                  disabled={isNextDisabled}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={btnPrimary}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <StepCard icon="⚙️" title="Specification Details" subtitle="Enter technical specifications and delivery requirements">
                <Step2Specifications form={form} errors={errors} update={update} />
              </StepCard>

              <div className="flex justify-between mt-6">
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
                  style={btnSecondary}
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={goNext}
                  disabled={isNextDisabled}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={btnPrimary}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <StepCard icon="✅" title="Review & Submit" subtitle="Review all details and submit your RFQ">
                <Step3Review form={form} errors={errors} update={update} onSubmit={handleSubmit} />
              </StepCard>

              <div className="flex justify-between mt-6">
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
                  style={btnSecondary}
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!form.agreeToTerms}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={btnPrimary}
                >
                  Submit RFQ
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}