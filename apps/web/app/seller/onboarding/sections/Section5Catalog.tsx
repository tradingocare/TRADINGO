'use client'
import { useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import UploadZone from '../../../../components/shared/UploadZone'
import type { SectionProps } from '../../../../types/vendor-onboarding'
import { Download, Upload, FileText, Table as TableIcon } from 'lucide-react'

export default function Section5Catalog({ vendor, onSave, onNext, onBack }: SectionProps) {
  const [catalogUrl, setCatalogUrl] = useState(vendor?.catalogPdfUrl || '')
  const [pricelistUrl, setPricelistUrl] = useState('')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvPreview, setCsvPreview] = useState<any[]>([])
  const csvInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)

  const handleCSV = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvFile(file)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { default: api } = await import('../../../../lib/api/client')
      const res = await api.post('/seller/products/import/csv-preview', formData)
      const preview = res.data?.data || res.data?.products || []
      if (preview.length > 0) {
        setCsvPreview(preview)
      }
    } catch {
      // CSV parse failed silently
    }
  }, [])

  const save = useCallback(async () => {
    setSaving(true)
    try {
      const { default: api } = await import('../../../../lib/api/client')
      if (catalogUrl) await api.patch('/seller/profile', { catalogPdfUrl: catalogUrl })
      onSave({ score: catalogUrl ? 15 : 0 })
    } finally { setSaving(false) }
  }, [catalogUrl, onSave])

  return (
    <div className="max-w-3xl">
      <h2 className="text-white font-bold text-xl mb-1">Product Catalog</h2>
      <p className="text-white/40 text-sm mb-6">Upload catalog, price list, or import products</p>

      <div className="space-y-6">
        <div>
          <label className="text-white/70 text-xs font-semibold mb-2 block">Upload Product Catalog (PDF)</label>
          <UploadZone
            label="Upload your product catalog, price list, or brochure"
            accept=".pdf"
            maxSizeMB={25}
            preview="pdf"
            folder="catalogs"
            onUpload={urls => setCatalogUrl(urls[0])}
            existing={catalogUrl ? [catalogUrl] : []}
          />
        </div>

        {catalogUrl && (
          <div className="p-4 rounded-xl bg-surface border border-border">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-[#f59e0b]" />
              <div>
                <p className="text-text-primary text-sm font-medium">Catalog uploaded</p>
                <p className="text-text-tertiary text-xs">PDF file attached</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="text-white/70 text-xs font-semibold mb-2 block">Upload Price List (Excel/PDF)</label>
          <UploadZone
            label="Upload price list"
            accept=".xlsx,.xls,.pdf"
            maxSizeMB={5}
            preview="pdf"
            folder="pricelists"
            onUpload={urls => setPricelistUrl(urls[0])}
            existing={pricelistUrl ? [pricelistUrl] : []}
          />
        </div>

        <div>
          <label className="text-white/70 text-xs font-semibold mb-2 block">Import via CSV</label>
          <div className="p-6 rounded-xl bg-surface border border-dashed border-border text-center">
            <TableIcon size={24} className="mx-auto mb-2 text-text-tertiary" />
            <p className="text-text-tertiary text-xs mb-3">Download template, fill, and upload</p>
            <button className="flex items-center gap-1.5 mx-auto px-4 py-2 rounded-xl text-xs font-semibold bg-surface-secondary text-text-secondary hover:bg-surface-secondary transition-all">
              <Download size={12} /> Download CSV Template
            </button>
            <div className="mt-3">
              <button onClick={() => csvInputRef.current?.click()}
                className="flex items-center gap-1.5 mx-auto px-4 py-2 rounded-xl text-xs font-semibold"
                style={{ background:'rgba(245, 158, 11, 0.1)', color:'#f59e0b' }}>
                <Upload size={12} /> Upload CSV
              </button>
              <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
            </div>
            {csvPreview.length > 0 && (
              <p className="text-green-400 text-xs mt-2">✓ CSV parsed — {csvPreview.length} products ready to import</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-8">
        {onBack && <button onClick={onBack} className="px-4 py-2 text-sm text-white/50 hover:text-white/80">Back</button>}
        <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
          onClick={save} disabled={saving}
          className="px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-40"
          style={{ background:'linear-gradient(135deg,#f59e0b,#fbbf24)', color:'#fff' }}>
          {saving ? 'Saving...' : 'Save & Continue'}
        </motion.button>
      </div>
    </div>
  )
}
