import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us | TRADINGO',
  description: 'Get in touch with the TRADINGO team. Our support team is available 24/7 to help with your global trade needs.',
  openGraph: {
    title: 'Contact Us | TRADINGO',
    description: 'Get in touch with the TRADINGO team. Our support team is available 24/7 to help with your global trade needs.',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
