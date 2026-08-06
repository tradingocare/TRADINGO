'use client';

import { useEffect, useState } from 'react';

interface XpFloatAnimationProps {
  amount: number;
  onComplete?: () => void;
}

export function XpFloatAnimation({ amount, onComplete }: XpFloatAnimationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <div className="animate-float-up text-4xl font-bold text-accent-500 drop-shadow-lg">
        +{amount} XP
      </div>
      <style jsx>{`
        @keyframes float-up {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-80px) scale(1.2); }
        }
        .animate-float-up {
          animation: float-up 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
