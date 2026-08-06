'use client'

import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { useCompareStore } from '@/store/compare-store'
import { useWishlistStore } from '@/store/wishlist-store'
import { toast } from '@/components/ui/use-toast'
import type { ProductCardModel } from '@/types/product-card'

export function useProductActions(product: ProductCardModel) {
  const router = useRouter()
  const { user } = useAuthStore()
  const { items: compareItems, toggle: toggleCompare } = useCompareStore()
  const { ids: wishIds, loaded, fetch: fetchWishlist, toggle: toggleWishlist } = useWishlistStore()

  const pid = product.id
  const inCompare = compareItems.some(i => i._id === pid)
  const isSaved = wishIds.includes(pid)

  useEffect(() => {
    if (user?.role === 'BUYER' && !loaded) fetchWishlist()
  }, [user, loaded, fetchWishlist])

  const requireAuth = useCallback((fn: () => void) => {
    if (!user) {
      toast({ title: 'Login karke continue karein', variant: 'destructive' })
      router.push('/login')
      return
    }
    fn()
  }, [user, router])

  const handleChat = useCallback(() => {
    requireAuth(() => router.push(`/buyer/chat?productId=${pid}`))
  }, [requireAuth, router, pid])

  const handleRFQ = useCallback(() => {
    requireAuth(() => router.push(`/buyer/rfq/create?productId=${pid}`))
  }, [requireAuth, router, pid])

  const handleBuyNow = useCallback((qty?: number) => {
    requireAuth(() => router.push(`/checkout?productId=${pid}&qty=${qty ?? product.moq}`))
  }, [requireAuth, router, pid, product.moq])

  const handleSave = useCallback(async () => {
    if (!user) {
      toast({ title: 'Login karke continue karein', variant: 'destructive' })
      router.push('/login')
      return
    }
    if (user.role !== 'BUYER') {
      toast({ title: 'Sirf buyer account se save kar sakte hain', variant: 'destructive' })
      return
    }
    try {
      await toggleWishlist(pid)
      toast({ title: isSaved ? 'Wishlist se hata diya' : 'Wishlist mein add ho gaya' })
    } catch {
      toast({ title: 'Kuch error aaya, phir try karein', variant: 'destructive' })
    }
  }, [user, router, toggleWishlist, pid, isSaved])

  const handleCompare = useCallback(() => {
    if (!inCompare && compareItems.length >= 4) {
      toast({ title: 'Maximum 4 products compare kar sakte hain', variant: 'destructive' })
      return
    }
    toggleCompare({
      _id: pid,
      slug: product.slug,
      title: product.title,
      images: product.images?.length ? product.images : ['/placeholder-product.jpg'],
      price: product.price,
      unit: product.unit,
      rating: product.rating,
      reviewCount: product.reviewCount,
      moq: product.moq,
      inStock: product.inStock,
      seller: {
        businessName: product.seller.name,
        slug: product.seller.slug,
        isVerified: product.seller.isVerified,
        trustScore: product.seller.trustScore,
        city: product.seller.city || '',
      },
      deliveryEta: product.deliveryEta,
      gstInvoiceAvailable: product.gstInvoiceAvailable,
      tradeCreditEligible: product.tradeCreditEligible,
      returnPolicy: product.returnPolicy,
    })
    toast({ title: inCompare ? 'Compare se hata diya' : 'Compare list mein add ho gaya' })
  }, [inCompare, compareItems.length, toggleCompare, pid, product])

  const handleReport = useCallback(() => {
    router.push(`/help?topic=report-product&productId=${pid}`)
  }, [router, pid])

  return {
    inCompare,
    isSaved,
    handleChat,
    handleRFQ,
    handleBuyNow,
    handleSave,
    handleCompare,
    handleReport,
  }
}
