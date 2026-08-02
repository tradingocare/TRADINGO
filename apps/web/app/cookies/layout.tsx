import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookies Policy | TRADINGO',
  description: 'Learn how TRADINGO uses cookies, tracking technologies, and how you can manage your cookie preferences.',
  openGraph: {
    title: 'Cookies Policy | TRADINGO',
    description: 'Learn how TRADINGO uses cookies, tracking technologies, and how you can manage your cookie preferences.',
  },
}

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return children
}
