import type { Metadata } from 'next';
import SuccessClientPage from './success-client';

export const metadata: Metadata = {
  title: 'Registration Submitted — TradeServ',
  description:
    'Your TradeServ registration has been submitted successfully. Track your verification status and reserved profile URLs.',
};

export default function SuccessPage() {
  return <SuccessClientPage />;
}
