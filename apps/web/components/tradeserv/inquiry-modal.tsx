'use client';

import { useState } from 'react';
import { Send, Building2, User, Mail, Phone, FileText, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { useCreateInquiry } from '@/hooks/use-tradeserv';

interface InquiryModalProps {
  open: boolean;
  onClose: () => void;
  professionalName: string;
  professionalSlug: string;
}

interface FormData {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  requirement: string;
  budget: string;
  timeline: string;
}

export function InquiryModal({ open, onClose, professionalName, professionalSlug }: InquiryModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    requirement: '',
    budget: '',
    timeline: '',
  });
  const createInquiry = useCreateInquiry();

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createInquiry.mutateAsync({
        companyName: form.companyName,
        contactPerson: form.contactPerson,
        email: form.email,
        phone: form.phone,
        requirement: form.requirement,
        budget: form.budget || undefined,
        timeline: form.timeline || undefined,
        professionalSlug,
      } as any);
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setForm({ companyName: '', contactPerson: '', email: '', phone: '', requirement: '', budget: '', timeline: '' });
      }, 2000);
    } catch {
      setError('Failed to send inquiry. Please try again.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Send Inquiry" description={`to ${professionalName}`}>
      {submitted ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
            <Send className="h-6 w-6 text-emerald-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-text-primary">Inquiry Sent!</h3>
          <p className="mt-1 text-sm text-text-secondary">
            {professionalName} will review your inquiry and respond shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              icon={Building2}
              label="Company Name"
              value={form.companyName}
              onChange={(v) => handleChange('companyName', v)}
              required
            />
            <FormField
              icon={User}
              label="Contact Person"
              value={form.contactPerson}
              onChange={(v) => handleChange('contactPerson', v)}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              icon={Mail}
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => handleChange('email', v)}
              required
            />
            <FormField
              icon={Phone}
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={(v) => handleChange('phone', v)}
              required
            />
          </div>
          <FormField
            icon={FileText}
            label="Requirement"
            textarea
            value={form.requirement}
            onChange={(v) => handleChange('requirement', v)}
            placeholder="Describe your requirement in detail..."
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              icon={DollarSign}
              label="Budget"
              value={form.budget}
              onChange={(v) => handleChange('budget', v)}
              placeholder="e.g. \u20B925,000 - \u20B950,000"
            />
            <FormField
              icon={Calendar}
              label="Timeline"
              value={form.timeline}
              onChange={(v) => handleChange('timeline', v)}
              placeholder="e.g. Within 2 weeks"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 p-3 text-xs text-red-500">{error}</div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border px-5 py-2 text-xs font-medium text-text-secondary transition-all hover:bg-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createInquiry.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2 text-xs font-semibold text-btn-primary-text transition-all hover:bg-accent/90 disabled:opacity-50"
            >
              {createInquiry.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              {createInquiry.isPending ? 'Sending...' : 'Send Inquiry'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function FormField({
  icon: Icon,
  label,
  value,
  onChange,
  type = 'text',
  textarea = false,
  placeholder,
  required = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  textarea?: boolean;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs text-text-secondary">
        <Icon className="h-3.5 w-3.5" />
        {label}
        {required && <span className="text-accent">*</span>}
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          rows={4}
          className="w-full surface-card px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-all focus:border-accent/40 focus:shadow-[0_0_12px_rgba(0, 255, 255, 0.06)] resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full surface-card px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-all focus:border-accent/40 focus:shadow-[0_0_12px_rgba(0, 255, 255, 0.06)]"
        />
      )}
    </div>
  );
}
