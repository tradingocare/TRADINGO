'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle, Loader2, Search, X } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { apiClient } from '@/lib/api-client'

interface DuplicateStatusProps {
  productId?: string
  companyId?: string
  compact?: boolean
}

export function DuplicateStatus({ productId, companyId, compact = false }: DuplicateStatusProps) {
  const [duplicates, setDuplicates] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(false)
  const { toast } = useToast()

  const handleCheck = async () => {
    setLoading(true)
    try {
      const payload: any = {}
      if (productId) payload.productId = productId
      if (companyId) payload.companyId = companyId
      const result = await apiClient.post<any>('/ai/quality/detect-duplicates', payload)
      setDuplicates(Array.isArray(result) ? result : (result as any)?.data || [])
      setChecked(true)
    } catch {
      toast({ title: 'Error', description: 'Failed to check duplicates', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (!checked) {
    if (compact) {
      return (
        <button onClick={handleCheck} disabled={loading}
          className="flex items-center gap-1 text-xs text-text-tertiary hover:text-accent transition-colors">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
          Check duplicates
        </button>
      )
    }
    return (
      <button onClick={handleCheck} disabled={loading}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-secondary text-xs text-text-secondary transition-colors">
        {loading ? <Loader2 className="h-3 w-3 animate-spin text-accent" /> : <AlertTriangle className="h-3 w-3 text-amber-400" />}
        {loading ? 'Checking...' : 'Check for Duplicates'}
      </button>
    )
  }

  if (duplicates.length === 0) {
    return (
      <div className={`flex items-center gap-1.5 ${compact ? 'text-xs' : 'text-sm'}`}>
        <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-text-secondary">No duplicates found</span>
      </div>
    )
  }

  return (
    <div>
      <div className={`flex items-center gap-1.5 ${compact ? 'text-xs' : 'text-sm'} text-amber-400 mb-1`}>
        <AlertTriangle className="h-3.5 w-3.5" />
        <span className="font-medium">{duplicates.length} duplicate{duplicates.length > 1 ? 's' : ''} detected</span>
        <button onClick={() => { setDuplicates([]); setChecked(false) }} className="ml-auto text-text-tertiary hover:text-text-primary"><X className="h-3 w-3" /></button>
      </div>
      {!compact && (
        <div className="space-y-1">
          {duplicates.slice(0, 3).map((d, i) => (
            <div key={i} className="text-xs text-text-tertiary flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              <span>{d.productName?.slice(0, 30)} ↔ {d.similarTo?.slice(0, 30)}</span>
              <span className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-medium ${
                d.confidence === 'HIGH' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
              }`}>{d.confidence}</span>
            </div>
          ))}
          {duplicates.length > 3 && <p className="text-xs text-text-tertiary">+{duplicates.length - 3} more</p>}
        </div>
      )}
    </div>
  )
}