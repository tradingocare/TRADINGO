'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Sparkles, X } from 'lucide-react';

interface LevelUpModalProps {
  levelName: string;
  levelNumber: number;
  badgeColor?: string | null;
  show: boolean;
  onClose: () => void;
}

export function LevelUpModal({ levelName, levelNumber, badgeColor, show, onClose }: LevelUpModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  const color = badgeColor || 'var(--accent)';

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-overlay backdrop-blur-sm">
      <Card className="pointer-events-auto mx-4 w-full max-w-sm animate-level-up border-accent-500/30 bg-gradient-to-b from-accent-500/10 to-transparent">
        <CardContent className="flex flex-col items-center py-8 text-center">
          <button onClick={() => { setVisible(false); onClose(); }} className="absolute right-3 top-3 text-text-tertiary hover:text-text-secondary"><X className="h-4 w-4" /></button>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-500/20" style={{ boxShadow: `0 0 40px ${color}40` }}>
            <TrendingUp className="h-8 w-8" style={{ color }} />
          </div>
          <Sparkles className="mt-2 h-5 w-5 text-status-warning" />
          <h2 className="mt-3 text-xl font-bold text-text-primary">Level Up!</h2>
          <p className="mt-1 text-sm text-text-secondary">You reached</p>
          <p className="mt-1 text-2xl font-bold" style={{ color }}>{levelName}</p>
          <p className="text-xs text-text-tertiary">Level {levelNumber}</p>
          <Button variant="default" className="mt-4 bg-gradient-to-r from-accent to-accent-400 text-primary" onClick={() => { setVisible(false); onClose(); }}>
            Awesome!
          </Button>
        </CardContent>
      </Card>
      <style jsx>{`
        @keyframes level-up {
          0% { opacity: 0; transform: scale(0.8); }
          50% { transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-level-up {
          animation: level-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
