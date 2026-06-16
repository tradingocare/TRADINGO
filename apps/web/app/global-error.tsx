'use client';

import { ErrorState } from '@/components/shared/error-state';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface text-text-primary antialiased dark:bg-dark-surface dark:text-dark-text-primary">
        <ErrorState
          error={error}
          reset={reset}
          title="Critical Error"
          message="A critical error occurred. Please try again or contact support if the issue persists."
          showHome
          showDashboard
        />
      </body>
    </html>
  );
}
