'use client'
import { useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import UploadZone from '../../../../components/shared/UploadZone'
import type { SectionProps } from '../../../../types/vendor-onboarding'
import { Download, Upload, FileText, Sparkles, Table } from 'lucide-react'

export default function Section5Catalog({ vendor, onSave, onNext, onBack }: SectionProps) {
  const [catalogUrl, setCatalogUrl] = useState('')
  const [pricelistUrl, setPricelistUrl] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extracted, setExtracted] = useState<any[]>([])
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvPreview, setCsvPreview] = useState<any[]>([])
  const csvInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)

  const extractProducts = useCallback(async () => {
    if (!catalogUrl) return
    setExtracting(true)
    // Stub: simulate extraction
    await new Promise(r => setTimeout(r, 1500))
    setExtracted([
      { name: 'Product 1', description: 'Sample product description', price: 500, unit: 'Pieces', moq: 10 },
      { name: 'Product 2', description: 'Another product', price: 1200, unit: 'Kg', moq: 5 },
      { name: 'Product 3', description: 'Premium product', price: 2500, unit: 'Set', moq: 2 },
    ])
    setExtracting(false)
  }, [catalogUrl])

  const handleCSV = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvFile(file)
    // Client-side parse stub
    setCsvPreview([
      { name: 'Sample Product', description: 'Desc', price: 500, unit: 'Pieces', moq: 10 },
    ])
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
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-[#FF4D00]" />
                <div>
                  <p className="text-white text-sm font-medium">Catalog uploaded</p>
                  <p className="text-white/30 text-xs">PDF file</p>
                </div>
              </div>
              {extracted.length === 0 && (
                <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                  onClick={extractProducts} disabled={extracting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
                  style={{ background:'linear-gradient(135deg,#9B5DE5,#3D8BFF)', color:'#fff' }}>
                  <Sparkles size={12} />
                  {extracting ? 'Extracting...' : 'Extract Products'}
                </motion.button>
              )}
            </div>

            {extracting && (
              <div className="mt-3 flex items-center gap-2 text-white/40 text-xs">
                <div className="w-4 h-4 rounded-full border-2 border-t-[#FF4D00] border-white/10 animate-spin" />
                AI is extracting products from your catalog...
              </div>
            )}

            {extracted.length > 0 && (
              <div className="mt-4">
                <p className="text-green-400 text-xs font-semibold mb-2">✓ {extracted.length} products extracted</p>
                <div className="rounded-xl overflow-hidden border border-white/10">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-white/5">
                      <th className="text-left px-3 py-2 text-white/50">Name</th>
                      <th className="text-left px-3 py-2 text-white/50">Price</th>
                      <th className="text-left px-3 py-2 text-white/50">Unit</th>
                      <th className="text-left px-3 py-2 text-white/50">MOQ</th>
                    </tr></thead>
                    <tbody>
                      {extracted.map((p, i) => (
                        <tr key={i} className="border-t border-white/5">
                          <td className="px-3 py-2 text-white/80">{p.name}</td>
                          <td className="px-3 py-2 text-white/60">₹{p.price}</td>
                          <td className="px-3 py-2 text-white/60">{p.unit}</td>
                          <td className="px-3 py-2 text-white/60">{p.moq}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-white/30 text-[10px] mt-2">Imported products will appear in Section 8 for review</p>
              </div>
            )}
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
          <div className="p-6 rounded-xl bg-white/5 border border-dashed border-white/10 text-center">
            <Table size={24} className="mx-auto mb-2 text-white/20" />
            <p className="text-white/50 text-xs mb-3">Download template, fill, and upload</p>
            <button className="flex items-center gap-1.5 mx-auto px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 text-white/60 hover:bg-white/15 transition-all">
              <Download size={12} /> Download CSV Template
            </button>
            <div className="mt-3">
              <button onClick={() => csvInputRef.current?.click()}
                className="flex items-center gap-1.5 mx-auto px-4 py-2 rounded-xl text-xs font-semibold"
                style={{ background:'rgba(255,77,0,0.1)', color:'#FF4D00' }}>
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
          style={{ background:'linear-gradient(135deg,#FF4D00,#FF7A3D)', color:'#fff' }}>
          {saving ? 'Saving...' : 'Save & Continue'}
        </motion.button>
      </div>
    </div>
  )
}
