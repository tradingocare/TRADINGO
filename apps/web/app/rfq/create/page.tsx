
import React from 'react'
import RfqWizard from './RfqWizard'

export const metadata = {
  title: 'Create Request for Quotation - TRADINGO',
  description: 'Submit your RFQ requirements and get quotes from verified vendors',
}

export default function RfqCreatePage() {
  return (
    <RfqWizard />
  )
}