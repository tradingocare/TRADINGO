"use client"

import React from 'react'

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}

export default function FormField({ label, required, error, hint, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-white/70 text-xs font-semibold flex items-center gap-1">
        {label}
        {required
          ? <span style={{ color: '#FF4D00' }}>*</span>
          : <span className="text-white/25 text-[9px] font-normal">(optional)</span>}
      </label>
      {children}
      {error && (
        <p className="text-red-400 text-[10px] flex items-center gap-1">
          ⚠ {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-white/30 text-[10px]">{hint}</p>
      )}
    </div>
  )
}