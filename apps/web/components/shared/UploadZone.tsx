'use client'
import { useState, useRef, useCallback } from 'react'
import { Upload, X, FileText, Image } from 'lucide-react'
import { uploadFile } from '../../lib/utils/cloudinary-upload'

interface UploadZoneProps {
  label:        string
  accept:       string
  maxSizeMB:    number
  multiple?:    boolean
  onUpload:     (urls: string[]) => void
  preview?:     'image'|'pdf'|'none'
  folder:       string
  hint?:        string
  existing?:    string[]
}

export default function UploadZone({
  label, accept, maxSizeMB, multiple, onUpload,
  preview = 'none', folder, hint, existing = [],
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [urls, setUrls] = useState<string[]>(existing)
  const [error, setError] = useState('')

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setError('')
    const valid: File[] = []
    for (const f of Array.from(files)) {
      if (f.size > maxSizeMB * 1024 * 1024) {
        setError(`"${f.name}" exceeds ${maxSizeMB}MB limit`)
        continue
      }
      valid.push(f)
    }
    if (valid.length === 0) return

    setUploading(true)
    setProgress(0)
    try {
      const uploaded: string[] = []
      for (const file of valid) {
        const url = await uploadFile(file, folder, pct => setProgress(pct))
        uploaded.push(url)
      }
      const all = multiple ? [...urls, ...uploaded] : uploaded
      setUrls(all)
      onUpload(all)
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [folder, maxSizeMB, multiple, onUpload, urls])

  const remove = (idx: number) => {
    const next = urls.filter((_, i) => i !== idx)
    setUrls(next)
    onUpload(next)
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className="relative flex flex-col items-center justify-center p-8 rounded-2xl cursor-pointer border-2 border-dashed transition-all"
        style={{
          background: dragOver ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255,255,255,0.7)',
          borderColor: dragOver ? '#f59e0b' : 'var(--border-color)',
        }}
      >
        {uploading ? (
          <div className="text-center">
            <div className="w-10 h-10 rounded-full border border-t-[#f59e0b] border-border animate-spin mx-auto mb-3" />
            <p className="text-gray-600 text-sm">Uploading... {progress}%</p>
            <div className="w-48 h-1.5 rounded-full overflow-hidden bg-surface mt-2 mx-auto">
              <div className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <>
            <Upload size={28} className="text-gray-300 mb-3" />
            <p className="text-gray-600 text-sm font-medium">{label}</p>
            {hint && <p className="text-gray-400 text-xs mt-1">{hint}</p>}
            <p className="text-gray-300 text-xs mt-2">
              Accepts {accept} · Max {maxSizeMB}MB
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {urls.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {urls.map((url, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden"
              style={{ width: preview === 'none' ? 'auto' : '100px', height: preview === 'none' ? 'auto' : '100px' }}>
              {preview === 'image' ? (
                <img src={url} alt="" className="w-full h-full object-cover rounded-xl" />
              ) : preview === 'pdf' ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface">
                  <FileText size={16} className="text-[#f59e0b]" />
                  <span className="text-text-secondary text-xs truncate max-w-[120px]">File {i + 1}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface">
                  <Image size={16} className="text-[#f59e0b]" />
                  <span className="text-text-secondary text-xs truncate max-w-[120px]">Uploaded {i + 1}</span>
                </div>
              )}
              <button onClick={() => remove(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-gray-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
