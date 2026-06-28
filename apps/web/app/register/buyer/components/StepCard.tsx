'use client'

import React from 'react'

export default function StepCard({ icon, title, subtitle, children }: {
  icon?: React.ReactNode
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-3xl p-6 sm:p-8"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          {icon && (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,77,0,0.12)', border: '1px solid rgba(255,77,0,0.2)' }}>
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-white font-black text-xl">{title}</h2>
            <p className="text-white/45 text-xs">{subtitle}</p>
          </div>
        </div>
        <div className="h-px mt-4" style={{ background: 'rgba(255,255,255,0.07)' }} />
      </div>
      {children}
    </div>
  )
}
