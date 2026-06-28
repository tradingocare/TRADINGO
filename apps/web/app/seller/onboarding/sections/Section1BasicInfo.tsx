'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../../../../lib/api/client'
import type { SectionProps } from '../../../../types/vendor-onboarding'

const SELLER_TYPES = ['Manufacturer','Wholesaler','Distributor','Retailer','Service Provider']
const YEARS = Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - i)
const EMP_COUNTS = ['1-10','11-50','51-200','201-500','501+']
const LEAD_TIMES = ['Same day','1-3 days','4-7 days','1-2 weeks','2-4 weeks','Custom']

export default function Section1BasicInfo({ vendor, onSave, onNext }: SectionProps) {
  const [form, setForm] = useState({
    name: '', tagline: '', description: '', sellerType: '',
    yearEstablished: '', employeeCount: '', supplyCapacity: '',
    avgLeadTime: '', exportCapability: false,
  })

  useEffect(() => {
    if (vendor) {
      setForm({
        name: vendor.name || '',
        tagline: vendor.tagline || '',
        description: vendor.description || '',
        sellerType: vendor.sellerType || '',
        yearEstablished: vendor.establishedYear ? String(vendor.establishedYear) : '',
        employeeCount: vendor.employeeCount || '',
        supplyCapacity: vendor.supplyCapacity || '',
        avgLeadTime: vendor.avgLeadTime || '',
        exportCapability: vendor.exportCapability || false,
      })
    }
  }, [vendor])

  const save = async () => {
    const payload = {
      name: form.name,
      tagline: form.tagline,
      description: form.description,
      businessType: form.sellerType,
      establishedYear: form.yearEstablished ? parseInt(form.yearEstablished) : undefined,
      employeeCount: form.employeeCount,
    }
    await api.patch('/seller/profile', payload)
    const score = [form.name, form.description, form.sellerType].filter(Boolean).length * 3.3
    onSave({ score: Math.min(Math.round(score), 10) })
    onNext?.()
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-white font-bold text-xl mb-1">Basic Information</h2>
      <p className="text-white/40 text-sm mb-6">Update your business details</p>

      <div className="space-y-5">
        <div>
          <label className="text-white/70 text-xs font-semibold mb-1.5 block">Business Display Name *</label>
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl text-white text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-[#FF4D00] transition-colors"
            placeholder="Your business name" />
        </div>

        <div>
          <label className="text-white/70 text-xs font-semibold mb-1.5 block">Trade / Brand Name</label>
          <input value={form.tagline} onChange={e => setForm(p => ({ ...p, tagline: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl text-white text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-[#FF4D00] transition-colors"
            placeholder="Shorter marketing name" maxLength={100} />
          <span className="text-white/20 text-xs mt-1 block">{form.tagline.length}/100</span>
        </div>

        <div>
          <label className="text-white/70 text-xs font-semibold mb-1.5 block">Business Description *</label>
          <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl text-white text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-[#FF4D00] transition-colors min-h-[100px]"
            placeholder="Describe your business (50-500 chars)" minLength={50} maxLength={500} />
          <span className="text-white/20 text-xs mt-1 block">{form.description.length}/500</span>
        </div>

        <div>
          <label className="text-white/70 text-xs font-semibold mb-1.5 block">Seller Type *</label>
          <div className="flex flex-wrap gap-2">
            {SELLER_TYPES.map(t => (
              <button key={t} onClick={() => setForm(p => ({ ...p, sellerType: t }))}
                className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: form.sellerType === t ? 'rgba(255,77,0,0.15)' : 'rgba(255,255,255,0.05)',
                  border: form.sellerType === t ? '1px solid rgba(255,77,0,0.35)' : '1px solid rgba(255,255,255,0.1)',
                  color: form.sellerType === t ? '#FF4D00' : 'rgba(255,255,255,0.6)',
                }}>{t}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-white/70 text-xs font-semibold mb-1.5 block">Year Established *</label>
            <select value={form.yearEstablished} onChange={e => setForm(p => ({ ...p, yearEstablished: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl text-white text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-[#FF4D00] transition-colors">
              <option value="" className="bg-[#1D0001]">Select year</option>
              {YEARS.map(y => <option key={y} value={y} className="bg-[#1D0001]">{y}</option>)}
            </select>
          </div>
          <div>
            <label className="text-white/70 text-xs font-semibold mb-1.5 block">Total Employees *</label>
            <select value={form.employeeCount} onChange={e => setForm(p => ({ ...p, employeeCount: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl text-white text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-[#FF4D00] transition-colors">
              <option value="" className="bg-[#1D0001]">Select range</option>
              {EMP_COUNTS.map(e => <option key={e} value={e} className="bg-[#1D0001]">{e}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-white/70 text-xs font-semibold mb-1.5 block">Supply Capacity</label>
            <input value={form.supplyCapacity} onChange={e => setForm(p => ({ ...p, supplyCapacity: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl text-white text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-[#FF4D00] transition-colors"
              placeholder="e.g., 1000 units/month" />
          </div>
          <div>
            <label className="text-white/70 text-xs font-semibold mb-1.5 block">Average Lead Time</label>
            <select value={form.avgLeadTime} onChange={e => setForm(p => ({ ...p, avgLeadTime: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl text-white text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-[#FF4D00] transition-colors">
              <option value="" className="bg-[#1D0001]">Select</option>
              {LEAD_TIMES.map(lt => <option key={lt} value={lt} className="bg-[#1D0001]">{lt}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
          <label className="relative inline-flex cursor-pointer items-center">
            <input type="checkbox" checked={form.exportCapability}
              onChange={e => setForm(p => ({ ...p, exportCapability: e.target.checked }))} className="sr-only peer" />
            <div className="w-10 h-5 rounded-full bg-white/10 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-[#FF4D00] peer-checked:after:translate-x-full" />
          </label>
          <div>
            <p className="text-white text-sm font-medium">Export Capability</p>
            <p className="text-white/40 text-xs">I can export products internationally</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-8">
        <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
          onClick={save}
          className="px-6 py-3 rounded-xl font-bold text-sm"
          style={{ background:'linear-gradient(135deg,#FF4D00,#FF7A3D)', color:'#fff' }}>
          Save & Continue
        </motion.button>
      </div>
    </div>
  )
}
