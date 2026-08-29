'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function RfqCreatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const productId = searchParams.get('productId')
    const companyId = searchParams.get('companyId')
    const entityId = searchParams.get('entityId')

    let url = '/buyer/rfq/new'
    const params = new URLSearchParams()

    if (productId) params.set('productId', productId)
    if (companyId) params.set('companyId', companyId)
    if (entityId) params.set('entityId', entityId)

    if (params.toString()) {
      url += '?' + params.toString()
    }

    router.push(url)
  }, [router, searchParams])

  return null
}