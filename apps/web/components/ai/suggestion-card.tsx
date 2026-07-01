'use client'
import { useState } from 'react'
import { Check, X, Edit3, ExternalLink } from 'lucide-react'
import type { AiSuggestion } from '@/lib/api/ai'

interface SuggestionCardProps {
  suggestion: AiSuggestion
  onAccept: (id: string, edits?: Record<string, unknown>) => Promise<void>
  onDismiss: (id: string) => void
  isProcessing?: boolean
}

export function SuggestionCard({ suggestion, onAccept, isProcessing }: SuggestionCardProps) {
  const [editing, setEditing] = useState(false)
  const [edits, setEdits] = useState('')
  const response = suggestion.response as Record<string, unknown> | undefined

  const handleAccept = () => {
    if (editing && edits) {
      try { onAccept(suggestion.id, JSON.parse(edits)) }
      catch { onAccept(suggestion.id) }
    } else {
      onAccept(suggestion.id)
    }
    setEditing(false)
  }

  return (
    <div className="rounded-lg border border-gray-200 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full uppercase">
          {suggestion.cacheType.replace(/_/g, ' ')}
        </span>
        <span className="text-[10px] text-gray-400">{new Date(suggestion.createdAt).toLocaleDateString()}</span>
      </div>
      <div className="text-xs text-gray-600 space-y-1 max-h-32 overflow-y-auto">
        {response ? (
          Object.entries(response).slice(0, 4).map(([key, val]) => (
            <div key={key} className="flex gap-1">
              <span className="font-medium text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
              <span className="text-gray-700 truncate">{typeof val === 'string' ? val : JSON.stringify(val).slice(0, 80)}</span>
            </div>
          ))
        ) : (
          <span className="text-gray-400 italic">No preview available</span>
        )}
        {response && Object.keys(response).length > 4 && (
          <span className="text-orange-500 text-[10px]">+{Object.keys(response).length - 4} more fields</span>
        )}
      </div>
      {editing && (
        <textarea value={edits} onChange={e => setEdits(e.target.value)} rows={3}
          className="w-full rounded-lg border border-gray-200 p-2 text-xs outline-none focus:border-orange-400 resize-none"
          placeholder='{"fieldName": "edited value"}' />
      )}
      <div className="flex gap-2">
        <button onClick={handleAccept} disabled={isProcessing}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 disabled:opacity-50">
          <Check className="h-3 w-3" /> Accept
        </button>
        <button onClick={() => setEditing(!editing)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100">
          <Edit3 className="h-3 w-3" /> {editing ? 'Close' : 'Edit'}
        </button>
      </div>
    </div>
  )
}
