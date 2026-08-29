import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Create RFQ — TRADINGO',
}

// Legacy RFQ wizard retired: /rfq/new now forwards to the canonical flow.
export default function NewRfqPage() {
  redirect('/buyer/rfq/new')
}
