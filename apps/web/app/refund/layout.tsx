import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Refund Policy | TRADINGO',
  description: 'TRADINGO refund and cancellation policy for membership plans, advertising credits, and platform services.',
  openGraph: {
    title: 'Refund Policy | TRADINGO',
    description: 'TRADINGO refund and cancellation policy for membership plans, advertising credits, and platform services.',
  },
}

export default function RefundLayout({ children }: { children: React.ReactNode }) {
  return children
}
