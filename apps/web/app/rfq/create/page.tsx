import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Create Request for Quotation - TRADINGO',
}

// Legacy RFQ wizard retired: forward to canonical /buyer/rfq/new while
// preserving legacy context params (companyId -> COMPANY, entityId -> DIRECT).
export default async function RfqCreatePage({
  searchParams,
}: {
  searchParams?: Promise<{ companyId?: string; entityId?: string }> | { companyId?: string; entityId?: string }
}) {
  const sp = (await searchParams) ?? {}
  const sourceId = sp.companyId || sp.entityId || ''
  const qs = new URLSearchParams()
  if (sourceId) {
    qs.set('source', sp.companyId ? 'COMPANY' : 'DIRECT')
    qs.set('sourceId', sourceId)
  }
  redirect(`/buyer/rfq/new${qs.toString() ? `?${qs.toString()}` : ''}`)
}
