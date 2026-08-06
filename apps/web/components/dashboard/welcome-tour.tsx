'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, CheckCircle2, Circle, Sparkles, Package, FileText, MessageSquare, Handshake, CreditCard, Users, BarChart3 } from 'lucide-react';

interface Step {
  icon: React.ReactNode;
  label: string;
  href: string;
}

export function WelcomeTour({ role }: { role: string }) {
  const [dismissed, setDismissed] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const key = `welcome-tour-${role}`;
    const seen = localStorage.getItem(key);
    if (!seen) {
      setDismissed(false);
      localStorage.setItem(key, 'dismissed');
    }
  }, [role]);

  if (dismissed) return null;

  const steps: Step[] = (() => {
    if (role === 'seller') {
      return [
        { icon: <Package className="h-4 w-4" />, label: 'Create your first product', href: '/seller/products/new' },
        { icon: <FileText className="h-4 w-4" />, label: 'Respond to RFQs', href: '/seller/rfq' },
        { icon: <MessageSquare className="h-4 w-4" />, label: 'Manage quotes & negotiations', href: '/seller/quote' },
        { icon: <CreditCard className="h-4 w-4" />, label: 'Track orders & earnings', href: '/seller/order' },
      ];
    }
    if (role === 'buyer') {
      return [
        { icon: <FileText className="h-4 w-4" />, label: 'Create your first RFQ', href: '/buyer/rfq' },
        { icon: <MessageSquare className="h-4 w-4" />, label: 'Compare supplier quotes', href: '/buyer/quote' },
        { icon: <Handshake className="h-4 w-4" />, label: 'Negotiate best deals', href: '/buyer/negotiation' },
        { icon: <CreditCard className="h-4 w-4" />, label: 'Track orders & payments', href: '/buyer/order' },
      ];
    }
    return [
      { icon: <Sparkles className="h-4 w-4" />, label: 'Monitor platform activity', href: '/admin/dashboard' },
      { icon: <Users className="h-4 w-4" />, label: 'Manage users & verification', href: '/admin/users' },
      { icon: <FileText className="h-4 w-4" />, label: 'Oversee commerce operations', href: '/admin/rfq' },
      { icon: <BarChart3 className="h-4 w-4" />, label: 'Review analytics', href: '/admin/analytics' },
    ];
  })();

  const current = steps[activeIndex];

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl border border-border bg-surface-secondary p-5 shadow-2xl dark:bg-dark-surface-secondary">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Sparkles className="h-4 w-4 text-accent-500" />
          Getting Started
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-lg p-1 text-text-tertiary transition-colors hover:text-text-primary"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <a
            key={i}
            href={step.href}
            onClick={() => { setDismissed(true); }}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface"
          >
            {i < activeIndex ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : i === activeIndex ? (
              <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-600">
                <span className="text-[10px] font-bold text-gray-900">{i + 1}</span>
              </div>
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-gray-400" />
            )}
            <span className={cn('text-sm', i <= activeIndex ? 'text-text-primary' : 'text-text-tertiary')}>
              {step.label}
            </span>
            {i === activeIndex && <ChevronRight className="ml-auto h-3.5 w-3.5 text-gray-400" />}
          </a>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-text-tertiary">
          {activeIndex + 1} of {steps.length}
        </span>
        {activeIndex < steps.length - 1 && (
          <button
            onClick={() => setActiveIndex((i) => Math.min(i + 1, steps.length - 1))}
            className="text-xs font-medium text-accent-500 transition-colors hover:text-accent-500"
          >
            Skip to Next
          </button>
        )}
      </div>
    </div>
  );
}

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
