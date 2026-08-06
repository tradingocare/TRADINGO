'use client';

import { Download, CreditCard } from 'lucide-react';

interface BusinessCardProps {
  name: string;
  title: string;
  location: string;
  email?: string;
  mobile?: string;
  slug: string;
}

export function BusinessCard({ name, title, location, email, mobile, slug }: BusinessCardProps) {
  const handleDownload = () => {
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${name}`,
      `TITLE:${title}`,
      `ADR:;;${location};;;`,
      email ? `EMAIL:${email}` : '',
      mobile ? `TEL:${mobile}` : '',
      `URL:https://tradingo.com/tradeserv/p/${slug}`,
      'END:VCARD',
    ].filter(Boolean).join('\n');

    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-medium text-text-secondary transition-all hover:border-accent/30 hover:text-accent"
    >
      <Download className="h-3.5 w-3.5" />
      Save Contact (VCF)
    </button>
  );
}
