'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api/client'
import { Download, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/use-toast'

const STATUS_ICONS: Record<string, any> = { COMPLETED: CheckCircle, PROCESSING: Clock, FAILED: AlertCircle, PENDING: Clock }
const STATUS_COLORS: Record<string, string> = { COMPLETED: 'text-green-600 bg-green-50', PROCESSING: 'text-blue-600 bg-blue-50', FAILED: 'text-red-600 bg-red-50', PENDING: 'text-yellow-600 bg-yellow-50' }

export default function ExportPage() {
  const { toast } = useToast()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const fetchJobs = async () => {
    try {
      const res = await api.get('/seller/export/jobs')
      setJobs(res.data || [])
    } catch {
      toast({ title: 'Failed to load export history', variant: 'destructive' })
    }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchJobs() }, [])

  const startExport = async (type: 'EXCEL' | 'CSV') => {
    setExporting(true)
    try {
      const res = await api.post('/seller/export/start', { type })
      toast({ title: 'Export started' })
      fetchJobs()
    } catch {
      toast({ title: 'Failed to start export', variant: 'destructive' })
    }
    finally { setExporting(false) }
  }

  const handleDownload = async (jobId: string) => {
    try {
      const res = await api.get(`/seller/export/jobs/${jobId}/download`)
      const { fileUrl, type } = res.data || {}
      if (fileUrl) {
        const a = document.createElement('a')
        a.href = fileUrl; a.download = `products.${type === 'EXCEL' ? 'xlsx' : 'csv'}`
        a.click()
        toast({ title: 'Download started' })
      }
    } catch {
      toast({ title: 'Download failed', variant: 'destructive' })
    }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Export Products</h1>
          <p className="text-sm text-white/50">Download your product catalog</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={() => startExport('CSV')} disabled={exporting}
          className="rounded-[22px] border-2 border-dashed p-6 hover:border-accent-500 hover:bg-accent-500/10 transition-all disabled:opacity-50 text-left bg-bg-elevated"
          style={{ borderColor: 'var(--border-color)' }}>
          <FileText size={32} className="text-green-500 mb-3" />
          <p className="text-sm font-bold text-white">Export as CSV</p>
          <p className="text-xs text-white/50 mt-1">Download all products as a CSV file</p>
        </button>
        <button onClick={() => startExport('EXCEL')} disabled={exporting}
          className="rounded-[22px] border-2 border-dashed p-6 hover:border-accent-500 hover:bg-accent-500/10 transition-all disabled:opacity-50 text-left bg-bg-elevated"
          style={{ borderColor: 'var(--border-color)' }}>
          <p className="text-sm font-bold text-white">Export as Excel</p>
          <p className="text-xs text-white/50 mt-1">Download all products as an Excel file</p>
        </button>
      </div>

      {exporting && (
        <div className="flex items-center justify-center py-10">
          <LoadingSpinner size="sm" />
          <span className="text-sm text-white/50">Generating export...</span>
        </div>
      )}

      <div className="rounded-[22px] overflow-hidden bg-bg-elevated border border-border">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold text-white">Export History</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10"><LoadingSpinner size="default" /></div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {jobs.map((j: any) => {
              const StatusIcon = STATUS_ICONS[j.status] || Clock
              return (
                <div key={j.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${STATUS_COLORS[j.status] || 'bg-surface text-white/50'}`}>
                      <StatusIcon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{j.type} Export</p>
                      <p className="text-xs text-white/40">{formatDate(j.createdAt)}</p>
                    </div>
                  </div>
                  {j.status === 'COMPLETED' && j.fileUrl && (
                    <button onClick={() => handleDownload(j.id)}
                      className="px-3 py-1.5 rounded-lg bg-accent-500/10 text-accent-500 text-xs font-semibold hover:bg-accent-500/20 flex items-center gap-1.5">
                      <Download size={12} /> Download
                    </button>
                  )}
                </div>
              )
            })}
            {jobs.length === 0 && <EmptyState icon={FileText} title="No exports yet" />}
          </div>
        )}
      </div>
    </div>
  )
}
