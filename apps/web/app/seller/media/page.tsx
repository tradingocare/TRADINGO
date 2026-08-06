'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api/client'
import { toast } from '@/components/ui/use-toast'
import { Input } from '@/components/ui/input'
import { Plus, FolderPlus, Edit3, Trash2, Image, FileText, Film, FolderOpen, ChevronRight, Search, AlertCircle } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<any[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>()
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [folderName, setFolderName] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = selectedFolder ? `?folderId=${selectedFolder}` : ''
      const [mediaRes, folderRes] = await Promise.all([
        api.get(`/seller/media${params}`),
        api.get('/seller/media/folders'),
      ])
      setMedia(mediaRes.data?.data || mediaRes.data || [])
      setFolders(folderRes.data || [])
    } catch {
      setError(true)
      toast({ title: 'Failed to load media', variant: 'destructive' })
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [selectedFolder])

  const createFolder = async () => {
    if (!folderName.trim()) return
    await api.post('/seller/media/folders', { name: folderName })
    setShowFolderModal(false); setFolderName('')
    fetchData()
  }

  const deleteMedia = async (id: string) => {
    if (!confirm('Delete this file?')) return
    await api.delete(`/seller/media/${id}`)
    fetchData()
  }

  const getIcon = (type: string) => {
    if (type === 'VIDEO') return Film; if (type === 'DOCUMENT') return FileText; return Image
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-text-primary">Media Library</h1>
          <p className="text-sm text-text-tertiary">Organize your product images, videos, and documents</p>
        </div>
        <button onClick={() => setShowFolderModal(true)}
          className="px-4 py-2 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-surface flex items-center gap-2">
          <FolderPlus size={16} /> New Folder
        </button>
      </div>

      <div className="flex gap-4">
        <div className="w-56 shrink-0">
          <div className="rounded-[22px] p-3 bg-bg-elevated border border-border">
            <button onClick={() => setSelectedFolder(undefined)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all ${!selectedFolder ? 'bg-orange-50 text-orange-600' : 'text-text-secondary hover:bg-surface'}`}>
              All Files
            </button>
            {folders.map(f => (
              <div key={f.id} className="flex items-center">
                <button onClick={() => setSelectedFolder(f.id)}
                  className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${selectedFolder === f.id ? 'bg-orange-50 text-orange-600' : 'text-text-secondary hover:bg-surface'}`}>
                  <FolderOpen size={14} /> {f.name}
                  <span className="text-[10px] text-text-tertiary ml-auto">{f._count?.media || 0}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-20"><LoadingSpinner size="xl" /></div>
          ) : error ? (
            <EmptyState icon={AlertCircle} variant="error" title="Failed to load media" description="Please try again later." />
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {media.length === 0 ? (
                <div className="col-span-full"><EmptyState icon={Image} title="No media files" /></div>
              ) : media.map((m: any) => {
                const Icon = getIcon(m.type)
                return (
                  <div key={m.id} className="group relative rounded-xl overflow-hidden transition-all bg-bg-elevated border border-border">
                    <div className="aspect-square bg-surface-secondary flex items-center justify-center">
                      {m.type === 'IMAGE' && m.url ? <img src={m.url} alt={m.altText || ''} className="w-full h-full object-cover" /> : <Icon size={28} className="text-gray-300" />}
                    </div>
                    <div className="p-2">
                      <p className="text-[10px] font-medium text-text-secondary truncate">{m.title || 'Untitled'}</p>
                      <p className="text-[9px] text-text-tertiary">{m.fileSize ? `${(m.fileSize / 1024).toFixed(0)} KB` : ''}</p>
                    </div>
                    <button onClick={() => deleteMedia(m.id)}
                      className="absolute top-1 right-1 p-1.5 rounded-lg bg-surface opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-red-500 transition-all">
                      <Trash2 size={12} />
                    </button>
                    {m.isPrimary && <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-accent-500 text-white text-[8px] font-bold">PRIMARY</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showFolderModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowFolderModal(false)}>
          <div className="rounded-[22px] p-6 max-w-sm w-full mx-4 shadow-[0_28px_90px_rgba(0,0,0,0.62)] bg-bg-elevated border border-border" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-text-primary mb-4">New Folder</h3>
            <Input value={folderName} onChange={e => setFolderName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createFolder()}
              placeholder="Folder name" />
            <div className="flex items-center justify-end gap-3 mt-4">
              <button onClick={() => setShowFolderModal(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-text-secondary hover:bg-surface">Cancel</button>
              <button onClick={createFolder} disabled={!folderName.trim()}
                className="px-4 py-2 rounded-xl bg-accent-500 text-text-primary text-sm font-semibold hover:bg-accent-500/90 disabled:opacity-50">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
