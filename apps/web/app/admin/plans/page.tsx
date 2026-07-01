'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  adminGetAllPlans, adminCreatePlan, adminUpdatePlan, adminDeletePlan,
  adminUpdatePlanVisibility, adminBatchUpdateFeatures, adminClonePlan,
  adminSchedulePlan, adminProcessScheduled, adminGetLaunchMode, adminSetLaunchMode,
  adminComparePlans, adminSimulateUpgrade, adminGetFeaturePreview,
  adminGetPlanAuditLogs, adminSeedLaunchPlans, adminGetAllAuditLogs,
  Plan, PlanFeature, AuditLog,
} from '../../../lib/api/membership'
import {
  Plus, Trash2, Eye, EyeOff, ChevronDown, ChevronUp,
  CheckCircle2, X, Loader2, Rocket, Copy, Calendar,
  ToggleLeft, ToggleRight, BarChart3, ArrowUpDown, History,
  Settings2, GripVertical, Search,
} from 'lucide-react'

const VISIBILITY_OPTIONS = ['DRAFT', 'LAUNCH', 'PUBLIC', 'ARCHIVED']
const VISIBILITY_COLORS: Record<string, string> = {
  DRAFT: '#6b7280', LAUNCH: '#3D8BFF', PUBLIC: '#22c55e', ARCHIVED: '#ef4444',
}

const FEATURE_CATEGORIES = [
  { category: 'Products', key: 'products' },
  { category: 'RFQ', key: 'rfq' },
  { category: 'Orders', key: 'orders' },
  { category: 'Analytics', key: 'analytics' },
  { category: 'GOCASH', key: 'gocash' },
  { category: 'Badge', key: 'badge' },
  { category: 'Search', key: 'search' },
  { category: 'Campaigns', key: 'campaigns' },
  { category: 'Referrals', key: 'referrals' },
  { category: 'Export', key: 'export' },
  { category: 'AI', key: 'ai' },
  { category: 'General', key: 'general' },
]

type Tab = 'plans' | 'compare' | 'upgrade' | 'audit'

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('plans')
  const [toast, setToast] = useState('')

  // ── Launch Mode ──
  const [launchMode, setLaunchMode] = useState(false)

  // ── Feature Matrix ──
  const [editingFeatures, setEditingFeatures] = useState<string | null>(null)
  const [featureForm, setFeatureForm] = useState<{ category: string; feature: string; included: boolean; value: string }[]>([])

  // ── Clone ──
  const [cloning, setCloning] = useState<string | null>(null)
  const [cloneForm, setCloneForm] = useState({ newPlanId: '', newName: '' })

  // ── Schedule ──
  const [scheduling, setScheduling] = useState<string | null>(null)
  const [scheduleForm, setScheduleForm] = useState({ scheduledVisibility: '', autoPublishAt: '', autoHideAt: '' })

  // ── Create Form ──
  const [formData, setFormData] = useState({
    planId: '', name: '', description: '', pricePlanA: 0, pricePlanB: 0, pricePlanC: 0,
    duration: 12, sortOrder: 0, visibility: 'DRAFT', isFree: false, badgeText: '',
    features: '',
  })

  // ── Comparison Builder ──
  const [selectedCompare, setSelectedCompare] = useState<string[]>([])
  const [comparison, setComparison] = useState<any>(null)

  // ── Upgrade Simulator ──
  const [upgradeFrom, setUpgradeFrom] = useState('')
  const [upgradeTo, setUpgradeTo] = useState('')
  const [upgradeResult, setUpgradeResult] = useState<any>(null)

  // ── Audit ──
  const [auditPlanId, setAuditPlanId] = useState('')
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditPage, setAuditPage] = useState(1)
  const [auditTotal, setAuditTotal] = useState(0)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const loadPlans = () => {
    setLoading(true)
    Promise.all([
      adminGetAllPlans(),
      adminGetLaunchMode().catch(() => ({ enabled: false })),
    ]).then(([p, lm]) => {
      setPlans(p)
      setLaunchMode(lm.enabled)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { loadPlans() }, [])

  // ── Launch Mode Toggle ──
  const handleToggleLaunchMode = async () => {
    try {
      const r = await adminSetLaunchMode(!launchMode)
      setLaunchMode(r.enabled)
      showToast(`Launch mode ${r.enabled ? 'ON' : 'OFF'}`)
    } catch { showToast('Failed to toggle launch mode') }
  }

  // ── Feature Matrix ──
  const openFeatureEditor = (planId: string) => {
    const plan = plans.find(p => p.planId === planId)
    if (!plan) return
    const existing = new Map(plan.planFeatures.map(f => [f.feature.toLowerCase().replace(/\s+/g, '_'), f]))
    const defaults: { category: string; feature: string; included: boolean; value: string }[] = []

    // Build from existing features or common defaults
    const commonFeatures = [
      { category: 'Products', feature: 'Product Listing' },
      { category: 'Products', feature: 'Bulk Upload' },
      { category: 'RFQ', feature: 'Receive RFQs' },
      { category: 'RFQ', feature: 'Advanced RFQ' },
      { category: 'Orders', feature: 'Basic Orders' },
      { category: 'Orders', feature: 'Direct Orders' },
      { category: 'Analytics', feature: 'Basic Analytics' },
      { category: 'Analytics', feature: 'Advanced Analytics' },
      { category: 'GOCASH', feature: 'GOCASH Enabled' },
      { category: 'Badge', feature: 'Premium Badge' },
      { category: 'Search', feature: 'Basic Search Visibility' },
      { category: 'Search', feature: 'Priority Search Ranking' },
      { category: 'Campaigns', feature: 'Campaign Participation' },
      { category: 'Referrals', feature: 'Referral Rewards' },
      { category: 'Export', feature: 'Exports' },
      { category: 'AI', feature: 'AI Features' },
      { category: 'General', feature: 'Business Profile' },
      { category: 'General', feature: 'Basic Verification' },
      { category: 'General', feature: 'Buyer Chat' },
      { category: 'General', feature: 'Basic Dashboard' },
      { category: 'General', feature: 'Premium Dashboard' },
      { category: 'General', feature: 'Basic Notifications' },
    ]

    for (const cf of commonFeatures) {
      const key = cf.feature.toLowerCase().replace(/\s+/g, '_')
      const ef = existing.get(key)
      defaults.push({
        category: cf.category,
        feature: cf.feature,
        included: ef ? ef.included : false,
        value: ef?.value || '',
      })
    }

    setEditingFeatures(planId)
    setFeatureForm(defaults)
  }

  const saveFeatures = async () => {
    if (!editingFeatures) return
    try {
      const features = featureForm.map((f, i) => ({ ...f, sortOrder: i }))
      await adminBatchUpdateFeatures(editingFeatures, features)
      showToast('Features updated')
      setEditingFeatures(null)
      loadPlans()
    } catch { showToast('Failed to save features') }
  }

  // ── Clone ──
  const handleClone = async (planId: string) => {
    if (!cloneForm.newPlanId || !cloneForm.newName) return
    try {
      await adminClonePlan(planId, cloneForm.newPlanId, cloneForm.newName)
      showToast(`Cloned as ${cloneForm.newName}`)
      setCloning(null)
      setCloneForm({ newPlanId: '', newName: '' })
      loadPlans()
    } catch { showToast('Clone failed') }
  }

  // ── Schedule ──
  const handleSchedule = async (planId: string) => {
    try {
      const data: any = {}
      if (scheduleForm.scheduledVisibility) data.scheduledVisibility = scheduleForm.scheduledVisibility
      if (scheduleForm.autoPublishAt) data.autoPublishAt = scheduleForm.autoPublishAt
      if (scheduleForm.autoHideAt) data.autoHideAt = scheduleForm.autoHideAt
      await adminSchedulePlan(planId, data)
      showToast('Plan scheduled')
      setScheduling(null)
      setScheduleForm({ scheduledVisibility: '', autoPublishAt: '', autoHideAt: '' })
      loadPlans()
    } catch { showToast('Schedule failed') }
  }

  const handleProcessScheduled = async () => {
    try {
      const r = await adminProcessScheduled()
      showToast(`Published ${r.published}, hidden ${r.hidden}`)
      loadPlans()
    } catch { showToast('Processing failed') }
  }

  // ── Create ──
  const handleCreate = async () => {
    try {
      await adminCreatePlan({
        ...formData,
        features: formData.features ? formData.features.split(',').map(f => f.trim()) : [],
      })
      setShowCreateForm(false)
      setFormData({ planId: '', name: '', description: '', pricePlanA: 0, pricePlanB: 0, pricePlanC: 0, duration: 12, sortOrder: 0, visibility: 'DRAFT', isFree: false, badgeText: '', features: '' })
      loadPlans()
    } catch { showToast('Create failed') }
  }

  // ── Delete ──
  const handleDelete = async (planId: string) => {
    if (!confirm(`Delete plan ${planId}?`)) return
    try {
      await adminDeletePlan(planId)
      loadPlans()
    } catch { showToast('Delete failed') }
  }

  // ── Visibility Toggle ──
  const handleToggleVisibility = async (planId: string, currentVisibility: string) => {
    const idx = VISIBILITY_OPTIONS.indexOf(currentVisibility)
    const next = VISIBILITY_OPTIONS[(idx + 1) % VISIBILITY_OPTIONS.length]
    try {
      await adminUpdatePlanVisibility(planId, next)
      loadPlans()
    } catch { showToast('Visibility update failed') }
  }

  // ── Comparison Builder ──
  const handleCompare = async () => {
    if (selectedCompare.length < 2) return
    try {
      const r = await adminComparePlans(selectedCompare)
      setComparison(r)
    } catch { showToast('Compare failed') }
  }

  // ── Upgrade Simulator ──
  const handleSimulateUpgrade = async () => {
    if (!upgradeFrom || !upgradeTo) return
    try {
      const r = await adminSimulateUpgrade(upgradeFrom, upgradeTo)
      setUpgradeResult(r)
    } catch { showToast('Simulation failed') }
  }

  // ── Audit ──
  const loadAudit = async (planId: string, page = 1) => {
    setAuditPlanId(planId)
    setAuditPage(page)
    try {
      const r = planId === 'all'
        ? await adminGetAllAuditLogs(page, 20)
        : await adminGetPlanAuditLogs(planId, page, 20)
      setAuditLogs(r.items)
      setAuditTotal(r.total)
    } catch { showToast('Failed to load audit logs') }
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Toast */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-xl text-sm bg-white/10 border border-white/20 text-white shadow-2xl backdrop-blur">
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white font-black text-2xl">Plan Management</h1>
            <p className="text-white/40 text-sm">Feature matrix, clone, schedule, comparison, audit logs</p>
          </div>
          <div className="flex gap-3">
            {/* Launch Mode Toggle */}
            <button onClick={handleToggleLaunchMode}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: launchMode ? 'rgba(61,139,255,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${launchMode ? 'rgba(61,139,255,0.25)' : 'rgba(255,255,255,0.08)'}`,
                color: launchMode ? '#3D8BFF' : 'rgba(255,255,255,0.5)',
              }}>
              {launchMode ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              Launch Mode {launchMode ? 'ON' : 'OFF'}
            </button>
            <button onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg,#FF4D00,#FF7A3D)', color: '#fff' }}>
              <Plus size={14} /> New Plan
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {([['plans', 'Plans', Settings2], ['compare', 'Compare', BarChart3], ['upgrade', 'Upgrade', ArrowUpDown], ['audit', 'Audit', History]] as [Tab, string, any][]).map(([k, l, Icon]) => (
            <button key={k} onClick={() => setActiveTab(k)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex-1 justify-center"
              style={{
                background: activeTab === k ? 'rgba(255,77,0,0.12)' : 'transparent',
                color: activeTab === k ? '#FF4D00' : 'rgba(255,255,255,0.4)',
              }}>
              <Icon size={14} /> {l}
            </button>
          ))}
        </div>

        {/* ─── TAB: PLANS ─── */}
        {activeTab === 'plans' && (
          <>
            {showCreateForm && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-6 rounded-2xl border" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
                <h2 className="text-white font-bold text-lg mb-4">Create New Plan</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <input placeholder="Plan ID" value={formData.planId} onChange={e => setFormData({ ...formData, planId: e.target.value })}
                    className="px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/20" />
                  <input placeholder="Plan Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/20" />
                  <input placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/20" />
                  <input type="number" placeholder="Price A (₹)" value={formData.pricePlanA} onChange={e => setFormData({ ...formData, pricePlanA: +e.target.value })}
                    className="px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/20" />
                  <input type="number" placeholder="Price B (₹)" value={formData.pricePlanB} onChange={e => setFormData({ ...formData, pricePlanB: +e.target.value })}
                    className="px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/20" />
                  <input type="number" placeholder="Price C (₹)" value={formData.pricePlanC} onChange={e => setFormData({ ...formData, pricePlanC: +e.target.value })}
                    className="px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/20" />
                  <input type="number" placeholder="Duration (months)" value={formData.duration} onChange={e => setFormData({ ...formData, duration: +e.target.value })}
                    className="px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/20" />
                  <input type="number" placeholder="Sort Order" value={formData.sortOrder} onChange={e => setFormData({ ...formData, sortOrder: +e.target.value })}
                    className="px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/20" />
                  <select value={formData.visibility} onChange={e => setFormData({ ...formData, visibility: e.target.value })}
                    className="px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white">
                    {VISIBILITY_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                  <input placeholder="Badge Text" value={formData.badgeText} onChange={e => setFormData({ ...formData, badgeText: e.target.value })}
                    className="px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/20" />
                  <label className="flex items-center gap-2 text-white/60 text-sm">
                    <input type="checkbox" checked={formData.isFree} onChange={e => setFormData({ ...formData, isFree: e.target.checked })} className="w-4 h-4" />
                    Free Plan
                  </label>
                </div>
                <input placeholder="Features (comma-separated)" value={formData.features} onChange={e => setFormData({ ...formData, features: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/20 mb-4" />
                <div className="flex gap-3">
                  <button onClick={handleCreate} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg,#FF4D00,#FF7A3D)' }}>Create Plan</button>
                  <button onClick={() => setShowCreateForm(false)} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white/60 border border-white/10">Cancel</button>
                </div>
              </motion.div>
            )}

            {/* Plans List */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 rounded-full border-2 border-t-[#FF4D00] border-white/10 animate-spin" />
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-white/30 text-lg mb-2">No plans found</p>
                <p className="text-white/20 text-sm">Create a plan or seed the launch plans</p>
              </div>
            ) : (
              <div className="space-y-4">
                {plans.map(plan => (
                  <motion.div key={plan.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                    {/* Plan Header */}
                    <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(expandedId === plan.id ? null : plan.id)}>
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="text-white font-bold">{plan.name}</h3>
                          <code className="text-white/30 text-xs">{plan.planId}</code>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{
                          background: `${VISIBILITY_COLORS[plan.visibility] || '#6b7280'}20`,
                          color: VISIBILITY_COLORS[plan.visibility] || '#6b7280',
                          border: `1px solid ${VISIBILITY_COLORS[plan.visibility] || '#6b7280'}30`,
                        }}>{plan.visibility}</span>
                        {plan.scheduledVisibility && <span className="text-yellow-400 text-[10px]">Scheduled: {plan.scheduledVisibility}</span>}
                        {plan.isFree && <span className="text-green-400 text-xs font-bold">FREE</span>}
                        {plan.badgeText && <span className="text-orange-400 text-xs">{plan.badgeText}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/40 text-sm">₹{plan.pricePlanA.toLocaleString('en-IN')}/yr</span>
                        {/* Clone Button */}
                        <button onClick={e => { e.stopPropagation(); setCloning(cloning === plan.planId ? null : plan.planId); setCloneForm({ newPlanId: `${plan.planId}-clone`, newName: `${plan.name} Clone` }) }}
                          className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/80 transition-colors" title="Clone plan">
                          <Copy size={14} />
                        </button>
                        {/* Schedule Button */}
                        <button onClick={e => { e.stopPropagation(); setScheduling(scheduling === plan.planId ? null : plan.planId); setScheduleForm({ scheduledVisibility: plan.visibility, autoPublishAt: plan.autoPublishAt || '', autoHideAt: plan.autoHideAt || '' }) }}
                          className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/80 transition-colors" title="Schedule plan">
                          <Calendar size={14} />
                        </button>
                        {/* Feature Matrix Button */}
                        <button onClick={e => { e.stopPropagation(); openFeatureEditor(plan.planId) }}
                          className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/80 transition-colors" title="Edit feature matrix">
                          <Settings2 size={14} />
                        </button>
                        {/* Audit Button */}
                        <button onClick={e => { e.stopPropagation(); loadAudit(plan.planId) }}
                          className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/80 transition-colors" title="Audit logs">
                          <History size={14} />
                        </button>
                        {/* Visibility Toggle */}
                        <button onClick={e => { e.stopPropagation(); handleToggleVisibility(plan.planId, plan.visibility) }}
                          className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/80 transition-colors" title="Toggle visibility">
                          {plan.visibility === 'ARCHIVED' ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        {/* Delete */}
                        <button onClick={e => { e.stopPropagation(); handleDelete(plan.planId) }}
                          className="p-2 rounded-lg hover:bg-white/5 text-red-400/60 hover:text-red-400 transition-colors" title="Delete plan">
                          <Trash2 size={14} />
                        </button>
                        {expandedId === plan.id ? <ChevronUp size={16} className="text-white/30" /> : <ChevronDown size={16} className="text-white/30" />}
                      </div>
                    </div>

                    {/* Clone Form */}
                    {cloning === plan.planId && (
                      <div className="px-5 pb-4 border-t border-white/5 pt-3 flex items-end gap-3">
                        <div className="flex-1">
                          <label className="text-white/40 text-[10px] uppercase font-semibold">New Plan ID</label>
                          <input value={cloneForm.newPlanId} onChange={e => setCloneForm({ ...cloneForm, newPlanId: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/10 text-white mt-1" />
                        </div>
                        <div className="flex-1">
                          <label className="text-white/40 text-[10px] uppercase font-semibold">New Plan Name</label>
                          <input value={cloneForm.newName} onChange={e => setCloneForm({ ...cloneForm, newName: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/10 text-white mt-1" />
                        </div>
                        <button onClick={() => handleClone(plan.planId)}
                          className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                          style={{ background: 'linear-gradient(135deg,#3D8BFF,#6BA8FF)' }}>Clone</button>
                      </div>
                    )}

                    {/* Schedule Form */}
                    {scheduling === plan.planId && (
                      <div className="px-5 pb-4 border-t border-white/5 pt-3">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                          <div>
                            <label className="text-white/40 text-[10px] uppercase font-semibold">Scheduled Visibility</label>
                            <select value={scheduleForm.scheduledVisibility} onChange={e => setScheduleForm({ ...scheduleForm, scheduledVisibility: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/10 text-white mt-1">
                              <option value="">None</option>
                              {VISIBILITY_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-white/40 text-[10px] uppercase font-semibold">Auto Publish At</label>
                            <input type="datetime-local" value={scheduleForm.autoPublishAt} onChange={e => setScheduleForm({ ...scheduleForm, autoPublishAt: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/10 text-white mt-1" />
                          </div>
                          <div>
                            <label className="text-white/40 text-[10px] uppercase font-semibold">Auto Hide At</label>
                            <input type="datetime-local" value={scheduleForm.autoHideAt} onChange={e => setScheduleForm({ ...scheduleForm, autoHideAt: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/10 text-white mt-1" />
                          </div>
                          <button onClick={() => handleSchedule(plan.planId)}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                            style={{ background: 'linear-gradient(135deg,#FF4D00,#FF7A3D)' }}>Save Schedule</button>
                        </div>
                      </div>
                    )}

                    {/* Expanded Detail */}
                    {expandedId === plan.id && (
                      <div className="px-5 pb-5 border-t border-white/5 pt-4">
                        <p className="text-white/40 text-xs mb-3">{plan.description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-xs">
                          <div><span className="text-white/30">Grace Period:</span> <span className="text-white/60">{plan.gracePeriodDays}d</span></div>
                          <div><span className="text-white/30">Trial:</span> <span className="text-white/60">{plan.trialPeriodDays}d</span></div>
                          <div><span className="text-white/30">Duration:</span> <span className="text-white/60">{plan.duration}mo</span></div>
                          <div><span className="text-white/30">Sort:</span> <span className="text-white/60">{plan.sortOrder}</span></div>
                          {plan.autoPublishAt && <div><span className="text-white/30">Auto Publish:</span> <span className="text-white/60">{new Date(plan.autoPublishAt).toLocaleString()}</span></div>}
                          {plan.autoHideAt && <div><span className="text-white/30">Auto Hide:</span> <span className="text-white/60">{new Date(plan.autoHideAt).toLocaleString()}</span></div>}
                        </div>
                        {/* Feature Preview (5) */}
                        <div className="mb-3">
                          <span className="text-white/50 text-[10px] font-semibold uppercase">Feature Preview ({plan.planFeatures?.length || 0} features)</span>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                            {(plan.planFeatures || []).filter(f => f.included).slice(0, 12).map(f => (
                              <span key={f.id} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px]"
                                style={{ background: 'rgba(34,197,94,0.08)', color: '#22c55e' }}>
                                <CheckCircle2 size={8} /> {f.feature}{f.value ? `: ${f.value}` : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── TAB: FEATURE MATRIX EDITOR (modal) ─── */}
        {editingFeatures && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setEditingFeatures(null)}>
            <div className="rounded-2xl border max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
              style={{ background: '#0A0A0F', borderColor: 'rgba(255,255,255,0.1)' }}
              onClick={e => e.stopPropagation()}>
              <h2 className="text-white font-bold text-lg mb-4">Feature Matrix — {editingFeatures}</h2>
              <div className="space-y-3 mb-6">
                {featureForm.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <GripVertical size={14} className="text-white/20 flex-shrink-0" />
                    <span className="text-white/40 text-xs w-20 flex-shrink-0">{f.category}</span>
                    <span className="text-white text-sm flex-1">{f.feature}</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={f.included} onChange={() => {
                        const next = [...featureForm]; next[i] = { ...next[i], included: !next[i].included }; setFeatureForm(next)
                      }} className="w-4 h-4" />
                      <span className="text-white/40 text-xs">{f.included ? 'Enabled' : 'Disabled'}</span>
                    </label>
                    <input placeholder="Limit" value={f.value} onChange={e => {
                      const next = [...featureForm]; next[i] = { ...next[i], value: e.target.value }; setFeatureForm(next)
                    }} className="w-20 px-2 py-1 rounded-lg text-xs bg-white/5 border border-white/10 text-white text-center" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={saveFeatures} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg,#FF4D00,#FF7A3D)' }}>Save Features</button>
                <button onClick={() => setEditingFeatures(null)} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white/60 border border-white/10">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: COMPARE ─── */}
        {activeTab === 'compare' && (
          <div>
            <div className="mb-6 p-6 rounded-2xl border" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
              <h2 className="text-white font-bold text-lg mb-3">Plan Comparison Builder</h2>
              <p className="text-white/40 text-xs mb-4">Select 2+ plans to compare features side-by-side</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {plans.map(p => (
                  <button key={p.planId} onClick={() => setSelectedCompare(prev =>
                    prev.includes(p.planId) ? prev.filter(x => x !== p.planId) : [...prev, p.planId]
                  )}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: selectedCompare.includes(p.planId) ? 'rgba(255,77,0,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${selectedCompare.includes(p.planId) ? 'rgba(255,77,0,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      color: selectedCompare.includes(p.planId) ? '#FF4D00' : 'rgba(255,255,255,0.5)',
                    }}>
                    {p.name}
                  </button>
                ))}
              </div>
              <button onClick={handleCompare} disabled={selectedCompare.length < 2}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-30"
                style={{ background: 'linear-gradient(135deg,#FF4D00,#FF7A3D)' }}>Generate Comparison</button>
            </div>

            {comparison && (
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02]">
                <div className="p-4 border-b border-white/10 flex items-center gap-2">
                  <BarChart3 size={16} className="text-white/30" />
                  <h3 className="text-white font-bold text-sm">Feature Matrix</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-4 py-3 text-white/50 text-[10px] font-semibold">Feature</th>
                        {comparison.plans.map((p: any) => (
                          <th key={p.planId} className="px-3 py-3 text-white text-[10px] font-bold text-center">{p.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.featureMatrix.map((row: any, i: number) => (
                        <tr key={i} className="border-b border-white/5">
                          <td className="px-4 py-2.5 text-white/60 text-[11px]">{row.label}</td>
                          {row.values.map((v: any, j: number) => (
                            <td key={j} className="px-3 py-2.5 text-center">
                              {v.included ? <CheckCircle2 size={12} className="mx-auto text-green-400" />
                                : <X size={12} className="mx-auto text-white/15" />}
                              {v.value && <span className="text-white/30 text-[9px] block">{v.value}</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: UPGRADE SIMULATOR ─── */}
        {activeTab === 'upgrade' && (
          <div>
            <div className="mb-6 p-6 rounded-2xl border" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
              <h2 className="text-white font-bold text-lg mb-3">Upgrade Simulator</h2>
              <p className="text-white/40 text-xs mb-4">See what features unlock when upgrading between plans</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-white/40 text-[10px] uppercase font-semibold">From Plan</label>
                  <select value={upgradeFrom} onChange={e => setUpgradeFrom(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white mt-1">
                    <option value="">Select plan...</option>
                    {plans.map(p => <option key={p.planId} value={p.planId}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-white/40 text-[10px] uppercase font-semibold">To Plan</label>
                  <select value={upgradeTo} onChange={e => setUpgradeTo(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white mt-1">
                    <option value="">Select plan...</option>
                    {plans.map(p => <option key={p.planId} value={p.planId}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={handleSimulateUpgrade} disabled={!upgradeFrom || !upgradeTo}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-30"
                style={{ background: 'linear-gradient(135deg,#3D8BFF,#6BA8FF)' }}>Simulate Upgrade</button>
            </div>

            {upgradeResult && (
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <div className="p-4 border-b border-white/10" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-white/40 text-xs">From</span>
                      <h3 className="text-white font-bold">{upgradeResult.fromPlan.name}</h3>
                      <span className="text-white/40 text-sm">₹{upgradeResult.fromPlan.pricePlanA.toLocaleString('en-IN')}/yr</span>
                    </div>
                    <ArrowUpDown size={20} className="text-orange-400" />
                    <div className="text-right">
                      <span className="text-white/40 text-xs">To</span>
                      <h3 className="text-white font-bold">{upgradeResult.toPlan.name}</h3>
                      <span className="text-white/40 text-sm">₹{upgradeResult.toPlan.pricePlanA.toLocaleString('en-IN')}/yr</span>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <span className="text-green-400 text-sm font-bold">+₹{(upgradeResult.toPlan.pricePlanA - upgradeResult.fromPlan.pricePlanA).toLocaleString('en-IN')}/yr</span>
                  </div>
                </div>

                <div className="p-4">
                  {upgradeResult.unlocked.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-green-400 text-xs font-bold uppercase mb-2">Unlocked Features ({upgradeResult.unlockedCount})</h4>
                      <div className="flex flex-wrap gap-2">
                        {upgradeResult.unlocked.map((u: any, i: number) => (
                          <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px]"
                            style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                            <CheckCircle2 size={10} /> {u.feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {upgradeResult.upgraded.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-blue-400 text-xs font-bold uppercase mb-2">Upgraded Limits ({upgradeResult.upgradedCount})</h4>
                      <div className="flex flex-wrap gap-2">
                        {upgradeResult.upgraded.map((u: any, i: number) => (
                          <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px]"
                            style={{ background: 'rgba(61,139,255,0.1)', color: '#3D8BFF' }}>
                            {u.feature}: {u.from} → {u.to}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {upgradeResult.same.length > 0 && (
                    <div>
                      <h4 className="text-white/30 text-xs font-bold uppercase mb-2">Same Features ({upgradeResult.same.length})</h4>
                      <div className="flex flex-wrap gap-2">
                        {upgradeResult.same.map((s: string, i: number) => (
                          <span key={i} className="px-2 py-1 rounded-lg text-[10px] text-white/30"
                            style={{ background: 'rgba(255,255,255,0.03)' }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: AUDIT ─── */}
        {activeTab === 'audit' && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex-1">
                <select value={auditPlanId} onChange={e => loadAudit(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white">
                  <option value="">Select plan...</option>
                  <option value="all">All Plans</option>
                  {plans.map(p => <option key={p.planId} value={p.planId}>{p.name} ({p.planId})</option>)}
                </select>
              </div>
              <button onClick={handleProcessScheduled}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(61,139,255,0.12)', color: '#3D8BFF', border: '1px solid rgba(61,139,255,0.25)' }}>
                Process Scheduled
              </button>
            </div>

            {auditLogs.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-white/30 text-sm">Select a plan to view audit logs</p>
              </div>
            ) : (
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-4 py-3 text-white/40 text-[10px] font-semibold">Date</th>
                        <th className="text-left px-4 py-3 text-white/40 text-[10px] font-semibold">Action</th>
                        <th className="text-left px-4 py-3 text-white/40 text-[10px] font-semibold">Plan</th>
                        <th className="text-left px-4 py-3 text-white/40 text-[10px] font-semibold">Field</th>
                        <th className="text-left px-4 py-3 text-white/40 text-[10px] font-semibold">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map(log => (
                        <tr key={log.id} className="border-b border-white/5">
                          <td className="px-4 py-3 text-white/40 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{
                              background: log.action.includes('CREATED') ? 'rgba(34,197,94,0.15)' :
                                log.action.includes('DELETED') ? 'rgba(239,68,68,0.15)' :
                                log.action.includes('UPDATED') ? 'rgba(61,139,255,0.15)' :
                                log.action.includes('FEATURE') ? 'rgba(155,93,229,0.15)' :
                                'rgba(255,255,255,0.08)',
                              color: log.action.includes('CREATED') ? '#22c55e' :
                                log.action.includes('DELETED') ? '#ef4444' :
                                log.action.includes('UPDATED') ? '#3D8BFF' :
                                log.action.includes('FEATURE') ? '#9B5DE5' :
                                'rgba(255,255,255,0.5)',
                            }}>{log.action}</span>
                          </td>
                          <td className="px-4 py-3 text-white/50 text-xs">{log.planId}</td>
                          <td className="px-4 py-3 text-white/40 text-xs">{log.field || '-'}</td>
                          <td className="px-4 py-3 text-white/40 text-xs max-w-[200px] truncate">{log.newValue || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {auditTotal > 20 && (
                  <div className="p-4 flex items-center justify-center gap-2 border-t border-white/5">
                    {Array.from({ length: Math.min(Math.ceil(auditTotal / 20), 5) }, (_, i) => (
                      <button key={i} onClick={() => loadAudit(auditPlanId, i + 1)}
                        className="w-8 h-8 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: auditPage === i + 1 ? 'rgba(255,77,0,0.15)' : 'rgba(255,255,255,0.04)',
                          color: auditPage === i + 1 ? '#FF4D00' : 'rgba(255,255,255,0.4)',
                        }}>{i + 1}</button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
