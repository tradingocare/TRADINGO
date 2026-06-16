'use client';

import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
}

function getStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-500' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500' };
  if (score <= 4) return { score, label: 'Strong', color: 'bg-accent-500' };
  return { score: 5, label: 'Very Strong', color: 'bg-accent-600' };
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;
  const { score, label, color } = getStrength(password);

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-all',
              i < score ? color : 'bg-border dark:bg-dark-border',
            )}
          />
        ))}
      </div>
      <p className="text-xs font-medium text-text-secondary dark:text-dark-text-secondary">
        Password strength: <span className="text-text-primary dark:text-dark-text-primary">{label}</span>
      </p>
    </div>
  );
}
