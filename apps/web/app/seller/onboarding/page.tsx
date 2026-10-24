import type { Metadata } from 'next'
import OnboardingClient from './OnboardingClient'

export const metadata: Metadata = {
  title: 'Complete Your Profile — Seller',
}

export default function OnboardingPage() {
  return <OnboardingClient />
}
