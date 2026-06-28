'use client'

import { PageHeader } from '@/components/shared/page-header'
import { Globe, Shield, Bell, Palette, Database, Save } from 'lucide-react'

const settingSections = [
  {
    icon: Globe,
    title: 'General',
    description: 'Platform name, logo, and basic settings',
    color: 'bg-[#FF4D00]/10 text-[#FF4D00]',
  },
  {
    icon: Shield,
    title: 'Security',
    description: 'Authentication, API keys, and access controls',
    color: 'bg-green-500/10 text-green-400',
  },
  {
    icon: Bell,
    title: 'Notifications',
    description: 'Email templates and notification preferences',
    color: 'bg-yellow-500/10 text-yellow-400',
  },
  {
    icon: Palette,
    title: 'Appearance',
    description: 'Theme, branding, and customization options',
    color: 'bg-purple-500/10 text-purple-400',
  },
  {
    icon: Database,
    title: 'Data & Backups',
    description: 'Database management and backup schedules',
    color: 'bg-blue-500/10 text-blue-400',
  },
]

export default function AdminSettingsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: '#1D0001' }}>
      <div className="max-w-6xl mx-auto px-4">
        <PageHeader
          title="Settings"
          description="Configure platform settings and preferences."
        />

        <div className="mt-8 space-y-4">
          {settingSections.map((section) => (
            <div
              key={section.title}
              className="group rounded-3xl p-6 transition-all duration-300 hover:border-[#FF4D00]/20"
              style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${section.color}`}>
                  <section.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white">{section.title}</h3>
                  <p className="text-sm text-white/50">{section.description}</p>
                </div>
                <button className="rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2 text-xs font-medium text-white backdrop-blur-md transition-colors hover:border-[#FF4D00]/30 hover:text-[#FF4D00]">
                  Configure
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <h2 className="text-lg font-semibold text-white">Platform Configuration</h2>
          <p className="mt-1 text-sm text-white/50">Core platform settings</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/70">Platform Name</label>
              <input
                type="text"
                defaultValue="TRADINGO"
                className="w-full rounded-2xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-sm text-white backdrop-blur-md focus:border-[#FF4D00]/30 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/70">Support Email</label>
              <input
                type="email"
                defaultValue="support@tradingo.com"
                className="w-full rounded-2xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-sm text-white backdrop-blur-md focus:border-[#FF4D00]/30 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/70">Default Currency</label>
              <input
                type="text"
                defaultValue="INR (₹)"
                className="w-full rounded-2xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-sm text-white backdrop-blur-md focus:border-[#FF4D00]/30 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/70">Timezone</label>
              <input
                type="text"
                defaultValue="Asia/Kolkata (IST)"
                className="w-full rounded-2xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-sm text-white backdrop-blur-md focus:border-[#FF4D00]/30 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button className="flex items-center gap-2 rounded-2xl bg-[#FF4D00] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#FF4D00]/90">
              <Save className="h-4 w-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
