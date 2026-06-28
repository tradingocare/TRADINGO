'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api/client'
import { Plus, Loader2, FolderPlus, Edit3, Trash2, Image, FileText, Film, FolderOpen, ChevronRight, Search } from 'lucide-react'

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<any[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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
    } catch {}
    finally { setLoading(false) }
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
          <h1 className="text-2xl font-black text-gray-900">Media Library</h1>
          <p className="text-sm text-gray-500">Organize your product images, videos, and documents</p>
        </div>
        <button onClick={() => setShowFolderModal(true)}
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-2">
          <FolderPlus size={16} /> New Folder
        </button>
      </div>

      <div className="flex gap-4">
        <div className="w-56 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 p-3">
            <button onClick={() => setSelectedFolder(undefined)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all ${!selectedFolder ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}>
              All Files
            </button>
            {folders.map(f => (
              <div key={f.id} className="flex items-center">
                <button onClick={() => setSelectedFolder(f.id)}
                  className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${selectedFolder === f.id ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <FolderOpen size={14} /> {f.name}
                  <span className="text-[10px] text-gray-400 ml-auto">{f._count?.media || 0}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-orange-500" /></div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {media.map((m: any) => {
                const Icon = getIcon(m.type)
                return (
                  <div key={m.id} className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                      {m.type === 'IMAGE' && m.url ? <img src={m.url} alt={m.altText || ''} className="w-full h-full object-cover" /> : <Icon size={28} className="text-gray-300" />}
                    </div>
                    <div className="p-2">
                      <p className="text-[10px] font-medium text-gray-700 truncate">{m.title || 'Untitled'}</p>
                      <p className="text-[9px] text-gray-400">{m.fileSize ? `${(m.fileSize / 1024).toFixed(0)} KB` : ''}</p>
                    </div>
                    <button onClick={() => deleteMedia(m.id)}
                      className="absolute top-1 right-1 p-1.5 rounded-lg bg-white/80 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all">
                      <Trash2 size={12} />
                    </button>
                    {m.isPrimary && <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-orange-500 text-white text-[8px] font-bold">PRIMARY</span>}
                  </div>
                )
              })}
              {media.length === 0 && (
                <div className="col-span-full py-20 text-center text-sm text-gray-400">No media files</div>
              )}
            </div>
          )}
        </div>
      </div>

      {showFolderModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowFolderModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">New Folder</h3>
            <input value={folderName} onChange={e => setFolderName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createFolder()}
              placeholder="Folder name" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400" />
            <div className="flex items-center justify-end gap-3 mt-4">
              <button onClick={() => setShowFolderModal(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={createFolder} disabled={!folderName.trim()}
                className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
