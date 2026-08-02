'use client'

import { useEffect, useState } from 'react'
import { QualityBadge } from './quality-badge'
import { apiClient } from '@/lib/api-client'

interface ProductIntelligenceBadgeProps {
  productId: string
}

export function ProductIntelligenceBadge({ productId }: ProductIntelligenceBadgeProps) {
  const [score, setScore] = useState<number | null>(null)

  useEffect(() => {
    apiClient.get(`/ai/quality/scores/${productId}`)
      .then((r: any) => setScore(r?.total ?? null))
      .catch((err) => console.error('Failed to load quality score:', err))
  }, [productId])

  if (score === null) return null

  return <QualityBadge score={score} size="sm" />
}