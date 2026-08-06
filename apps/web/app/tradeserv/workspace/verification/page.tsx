'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  User, Building2, MapPin, Globe, Mail, Phone, Linkedin, Facebook, Instagram,
  Youtube, FileText, Clock, Shield, CheckCircle, AlertTriangle, Camera, Copy,
  ExternalLink, QrCode, Save, ChevronDown, ChevronUp, Briefcase, Users, Award,
  Calendar, Hash, Search, Star, Loader2,
} from 'lucide-react';
import { DashboardPageHeader, StatusBadge } from '@/components/dashboard';
import { GlassCard } from '@/components/tradeserv/glass-card';
import { FormInput } from '@/components/tradeserv/form-input';
import { SaveToast } from '@/components/tradeserv/save-toast';
import { useSaveToast } from '@/hooks/use-save-toast';
import { useMyProfile, useUpdateProfile } from '@/hooks/use-tradeserv';

type DocStatus = 'verified' | 'pending' | 'rejected';

function DocRow({ label, status }: { label: string; status: DocStatus }) {
  const colorMap = { verified: 'text-emerald-400', pending: 'text-amber-400', rejected: 'text-red-400' };
  const iconMap = { verified: CheckCircle, pending: Clock, rejected: AlertTriangle };
  const Icon = iconMap[status];
  return (
    <div className="flex items-center justify-between rounded-xl bg-surface px-3.5 py-2.5">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-text-tertiary" />
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <div className={`flex items-center gap-1.5 text-xs ${colorMap[status]}`}>
        <Icon className="h-3.5 w-3.5" />
        <span className="capitalize">{status}</span>
      </div>
    </div>
  );
}

export default function BusinessIdentityPage() {
  const { data: profile, isLoading, isError } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const { saved, handleSave: showToast } = useSaveToast();

  const [activeSection, setActiveSection] = useState<string | null>('identity');
  const [biz, setBiz] = useState<Record<string, string>>({});
  const [office, setOffice] = useState<Record<string, string>>({});
  const [contact, setContact] = useState<Record<string, string>>({});
  const [hours, setHours] = useState<Record<string, string>>({});

  useMemo(() => {
    if (profile) {
      setBiz({
        companyName: profile.name || '',
        businessType: profile.businessType || '',
        yearEstablished: profile.establishedYear?.toString() || '',
        teamSize: profile.employeeCount?.toString() || '',
        description: profile.description || '',
        gstNumber: profile.gstNumber || '',
        panNumber: profile.panNumber || '',
      });
      const loc = Array.isArray(profile.locations) && profile.locations.length > 0
        ? profile.locations[0] : { city: '', state: '' };
      setOffice({
        address: '',
        city: typeof loc === 'string' ? loc : loc.city || '',
        state: typeof loc === 'string' ? '' : loc.state || '',
        pinCode: '',
      });
      setContact({
        primaryMobile: profile.mobile || '',
        email: profile.email || '',
        website: profile.website || '',
        linkedin: profile.socialLinks?.linkedin || '',
        facebook: profile.socialLinks?.facebook || '',
        instagram: profile.socialLinks?.instagram || '',
        youtube: profile.socialLinks?.youtube || '',
      });
      const bh = profile.businessHours as Record<string, string> | null;
      setHours({
        workingDays: bh?.workingDays || 'Monday to Friday',
        openingTime: bh?.openingTime || '09:00',
        closingTime: bh?.closingTime || '18:00',
        emergencyContact: bh?.emergencyContact || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    const data: Record<string, unknown> = {};
    if (biz.companyName) data.name = biz.companyName;
    if (biz.businessType) data.businessType = biz.businessType;
    if (biz.yearEstablished) data.establishedYear = parseInt(biz.yearEstablished) || undefined;
    if (biz.teamSize) data.employeeCount = parseInt(biz.teamSize) || undefined;
    if (biz.description) data.description = biz.description;
    if (biz.gstNumber) data.gstNumber = biz.gstNumber;
    if (biz.panNumber) data.panNumber = biz.panNumber;
    if (contact.primaryMobile) data.mobile = contact.primaryMobile;
    if (contact.email) data.email = contact.email;
    if (contact.website) data.website = contact.website;
    data.socialLinks = { linkedin: contact.linkedin, facebook: contact.facebook, instagram: contact.instagram, youtube: contact.youtube };
    data.businessHours = { workingDays: hours.workingDays, openingTime: hours.openingTime, closingTime: hours.closingTime, emergencyContact: hours.emergencyContact };
    await updateProfile.mutateAsync(data);
    showToast();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#f59e0b]" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="mt-3 text-sm text-text-secondary">Failed to load profile data</p>
      </div>
    );
  }

  const documents: { key: string; label: string; status: DocStatus }[] = [
    { key: 'gst', label: 'GST Registration', status: profile.gstNumber ? 'verified' : 'pending' },
    { key: 'pan', label: 'PAN Card', status: profile.panNumber ? 'verified' : 'pending' },
  ];

  const verifiedDocs = documents.filter((d) => d.status === 'verified').length;
  const pendingDocs = documents.filter((d) => d.status === 'pending').length;
  const verificationProgress = documents.length > 0 ? Math.round((verifiedDocs / documents.length) * 100) : 0;
  const tradTrustReady = pendingDocs === 0;

  const toggleSection = (id: string) => setActiveSection(activeSection === id ? null : id);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Business Identity & Verification"
        description="Manage your professional business identity and verification information"
      />

      {/* 1. Business Identity */}
      <GlassCard>
        <button type="button" onClick={() => toggleSection('identity')} className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#f59e0b]" />
            <h3 className="text-sm font-semibold text-text-primary">Business Identity</h3>
          </div>
          {activeSection === 'identity' ? <ChevronUp className="h-4 w-4 text-text-tertiary" /> : <ChevronDown className="h-4 w-4 text-text-tertiary" />}
        </button>
        {activeSection === 'identity' && (
          <div className="mt-4 space-y-4 border-t border-border pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput label="Company / Firm Name" value={biz.companyName || ''} onChange={(v) => setBiz({ ...biz, companyName: v })} icon={Building2} />
              <FormInput label="Business Type" value={biz.businessType || ''} onChange={(v) => setBiz({ ...biz, businessType: v })} icon={Briefcase} placeholder="e.g. Proprietorship, Partnership, LLP" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput label="Year Established" value={biz.yearEstablished || ''} onChange={(v) => setBiz({ ...biz, yearEstablished: v })} icon={Calendar} placeholder="e.g. 2012" />
              <FormInput label="Team Size" value={biz.teamSize || ''} onChange={(v) => setBiz({ ...biz, teamSize: v })} icon={Users} placeholder="e.g. 15+" />
            </div>
            <FormInput label="Business Description" value={biz.description || ''} onChange={(v) => setBiz({ ...biz, description: v })} textarea />
            <button type="button" onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-btn-primary-text transition-all hover:bg-accent/90">
              <Save className="h-3.5 w-3.5" /> Save Changes
            </button>
          </div>
        )}
      </GlassCard>

      {/* 2. Business Contact */}
      <GlassCard>
        <button type="button" onClick={() => toggleSection('contact')} className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#f59e0b]" />
            <h3 className="text-sm font-semibold text-text-primary">Business Contact</h3>
          </div>
          {activeSection === 'contact' ? <ChevronUp className="h-4 w-4 text-text-tertiary" /> : <ChevronDown className="h-4 w-4 text-text-tertiary" />}
        </button>
        {activeSection === 'contact' && (
          <div className="mt-4 space-y-4 border-t border-border pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput label="Mobile" value={contact.primaryMobile || ''} onChange={(v) => setContact({ ...contact, primaryMobile: v })} icon={Phone} />
              <FormInput label="Email" value={contact.email || ''} onChange={(v) => setContact({ ...contact, email: v })} icon={Mail} />
            </div>
            <FormInput label="Website" value={contact.website || ''} onChange={(v) => setContact({ ...contact, website: v })} icon={Globe} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput label="LinkedIn" value={contact.linkedin || ''} onChange={(v) => setContact({ ...contact, linkedin: v })} icon={Linkedin} placeholder="linkedin.com/in/..." />
              <FormInput label="Facebook" value={contact.facebook || ''} onChange={(v) => setContact({ ...contact, facebook: v })} icon={Facebook} placeholder="facebook.com/..." />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput label="Instagram" value={contact.instagram || ''} onChange={(v) => setContact({ ...contact, instagram: v })} icon={Instagram} placeholder="instagram.com/..." />
              <FormInput label="YouTube" value={contact.youtube || ''} onChange={(v) => setContact({ ...contact, youtube: v })} icon={Youtube} placeholder="youtube.com/@..." />
            </div>
            <button type="button" onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-btn-primary-text transition-all hover:bg-accent/90">
              <Save className="h-3.5 w-3.5" /> Save Changes
            </button>
          </div>
        )}
      </GlassCard>

      {/* 3. Tax Identity */}
      <GlassCard>
        <button type="button" onClick={() => toggleSection('tax')} className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-[#f59e0b]" />
            <h3 className="text-sm font-semibold text-text-primary">Tax Identity</h3>
          </div>
          {activeSection === 'tax' ? <ChevronUp className="h-4 w-4 text-text-tertiary" /> : <ChevronDown className="h-4 w-4 text-text-tertiary" />}
        </button>
        {activeSection === 'tax' && (
          <div className="mt-4 space-y-4 border-t border-border pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput label="GST Number" value={biz.gstNumber || ''} onChange={(v) => setBiz({ ...biz, gstNumber: v })} icon={Hash} placeholder="e.g. 27AABCU1234D1Z1" />
              <FormInput label="PAN Number" value={biz.panNumber || ''} onChange={(v) => setBiz({ ...biz, panNumber: v })} icon={Hash} placeholder="e.g. AABCU1234D" />
            </div>
            <button type="button" onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-btn-primary-text transition-all hover:bg-accent/90">
              <Save className="h-3.5 w-3.5" /> Save Changes
            </button>
          </div>
        )}
      </GlassCard>

      {/* 4. Business Documents */}
      <GlassCard>
        <button type="button" onClick={() => toggleSection('documents')} className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#f59e0b]" />
            <h3 className="text-sm font-semibold text-text-primary">Business Documents</h3>
          </div>
          {activeSection === 'documents' ? <ChevronUp className="h-4 w-4 text-text-tertiary" /> : <ChevronDown className="h-4 w-4 text-text-tertiary" />}
        </button>
        {activeSection === 'documents' && (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            {documents.map((doc) => (
              <DocRow key={doc.key} label={doc.label} status={doc.status} />
            ))}
            <div className="pt-2 text-xs text-text-tertiary">
              <p>Add GST/PAN numbers in Tax Identity section above. Verified documents enhance your TradTrust score.</p>
            </div>
          </div>
        )}
      </GlassCard>

      {/* 5. Business Hours */}
      <GlassCard>
        <button type="button" onClick={() => toggleSection('hours')} className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#f59e0b]" />
            <h3 className="text-sm font-semibold text-text-primary">Business Hours</h3>
          </div>
          {activeSection === 'hours' ? <ChevronUp className="h-4 w-4 text-text-tertiary" /> : <ChevronDown className="h-4 w-4 text-text-tertiary" />}
        </button>
        {activeSection === 'hours' && (
          <div className="mt-4 space-y-4 border-t border-border pt-4">
            <FormInput label="Working Days" value={hours.workingDays || ''} onChange={(v) => setHours({ ...hours, workingDays: v })} placeholder="e.g. Monday to Saturday" />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput label="Opening Time" value={hours.openingTime || ''} onChange={(v) => setHours({ ...hours, openingTime: v })} icon={Clock} placeholder="e.g. 09:00" />
              <FormInput label="Closing Time" value={hours.closingTime || ''} onChange={(v) => setHours({ ...hours, closingTime: v })} icon={Clock} placeholder="e.g. 18:00" />
            </div>
            <button type="button" onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-btn-primary-text transition-all hover:bg-accent/90">
              <Save className="h-3.5 w-3.5" /> Save Changes
            </button>
          </div>
        )}
      </GlassCard>

      {/* 6. Verification Overview */}
      <GlassCard>
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-[#f59e0b]" />
          <h3 className="text-sm font-semibold text-text-primary">Verification Overview</h3>
          <StatusBadge status={pendingDocs === 0 ? 'approved' : 'pending'} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-surface p-4">
            <p className="text-xs text-text-tertiary">Verification Progress</p>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-secondary">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${verificationProgress}%` }} />
              </div>
              <span className="text-xs font-semibold text-[#f59e0b]">{verificationProgress}%</span>
            </div>
          </div>
          <div className="rounded-xl bg-surface p-4">
            <p className="text-xs text-text-tertiary">Pending Documents</p>
            <p className="mt-1 text-lg font-bold text-amber-400">{pendingDocs}</p>
          </div>
          <div className="rounded-xl bg-surface p-4">
            <p className="text-xs text-text-tertiary">Completed Verification</p>
            <p className="mt-1 text-lg font-bold text-emerald-400">{verifiedDocs}/{documents.length}</p>
          </div>
          <div className="rounded-xl bg-surface p-4">
            <p className="text-xs text-text-tertiary">TradTrust Readiness</p>
            <div className="mt-1 flex items-center gap-1.5">
              {tradTrustReady ? (
                <>
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-400">Ready</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-semibold text-amber-400">{pendingDocs} Pending</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-surface p-3.5">
          <p className="text-xs text-text-tertiary">
            Complete all document verification to unlock TradTrust scoring. Verified businesses get higher visibility in TradeServ search results.
          </p>
        </div>
      </GlassCard>

      {/* 7. Business Identity Preview */}
      <GlassCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-[#f59e0b]" />
            <h3 className="text-sm font-semibold text-text-primary">Business Identity Preview</h3>
          </div>
        </div>
        <div className="mt-4 overflow-hidden surface-card-lg">
          <div className="bg-gradient-to-r from-[#f59e0b]/20 via-[#f59e0b]/5 to-transparent p-5 pb-0">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/15 text-xl font-bold text-[#f59e0b]">
                {(profile.name || 'P').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-text-primary">{profile.name}</p>
                  <StatusBadge status={pendingDocs === 0 ? 'approved' : 'pending'} />
                </div>
                <p className="text-xs text-text-tertiary">{profile.professionalType || profile.businessType || 'Professional'}</p>
                {profile.locations && profile.locations.length > 0 && (
                  <p className="mt-1 text-xs text-text-tertiary">{typeof profile.locations[0] === 'string' ? profile.locations[0] : profile.locations[0]?.city || ''}</p>
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-border p-4">
            <div className="grid gap-2 text-xs text-text-tertiary">
              <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-text-tertiary" /> {profile.email || 'Not set'}</p>
              <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-text-tertiary" /> {profile.mobile || 'Not set'}</p>
              {tradTrustReady && profile.trustScore > 0 && (
                <p className="mt-1 flex items-center gap-1.5 text-emerald-400">
                  <Star className="h-3.5 w-3.5 fill-emerald-400" /> TradTrust Score: {profile.trustScore}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => navigator.clipboard.writeText(`https://tradingo.com/tradeserv/p/${profile.slug}`)}
            className="inline-flex items-center gap-2 rounded-full bg-surface-secondary px-4 py-2 text-xs text-text-tertiary transition-all hover:bg-surface">
            <Copy className="h-3.5 w-3.5" /> Copy Public Link
          </button>
          <Link href={`/tradeserv/p/${profile.slug}`} target="_blank"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-btn-primary-text transition-all hover:bg-accent/90">
            <ExternalLink className="h-3.5 w-3.5" /> View Public Profile
          </Link>
          <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary ml-auto">
            <QrCode className="h-4 w-4" /> QR Code (coming soon)
          </div>
        </div>
      </GlassCard>

      <SaveToast show={saved} message="Business identity saved successfully" />
    </div>
  );
}
