'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User, Camera, MapPin, Globe, ExternalLink, Copy, QrCode, Plus, X, Pencil,
  Briefcase, BookOpen, Award, Building2, Mail, Phone, Linkedin,
  CheckCircle, AlertCircle, ChevronDown, ChevronUp, Image, Video, FileText,
  Star, Shield, Clock, Languages, DollarSign, Save, Eye,
} from 'lucide-react';
import { DashboardPageHeader, StatusBadge } from '@/components/dashboard';
import { GlassCard } from '@/components/tradeserv/glass-card';
import { FormInput } from '@/components/tradeserv/form-input';
import { SaveToast } from '@/components/tradeserv/save-toast';
import { useSaveToast } from '@/hooks/use-save-toast';
import { useMyProfile, useUpdateProfile, useAddService, useDeleteService } from '@/hooks/use-tradeserv';
import { useToast } from '@/components/ui/use-toast';

type SectionId = 'about' | 'services' | 'portfolio' | 'certifications' | 'business';

const SECTION_LABELS: Record<SectionId, string> = {
  about: 'About',
  services: 'Services',
  portfolio: 'Portfolio',
  certifications: 'Certifications',
  business: 'Business Info',
};

export default function ProfileManagementPage() {
  const { toast } = useToast();
  const { data: profile, isLoading: profileLoading, error: profileError } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const addServiceMutation = useAddService();
  const deleteServiceMutation = useDeleteService();
  const { saved: aboutSaved, handleSave: handleAboutSave } = useSaveToast();
  const { saved: businessSaved, handleSave: handleBusinessSave } = useSaveToast();
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);
  const [about, setAbout] = useState({ summary: '', languages: '', experience: '', location: '', website: '', linkedin: '' });
  const [services, setServices] = useState<{ id: string; name: string; desc: string; price: string; category: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; title: string; desc: string; image: boolean }[]>([]);
  const [business, setBusiness] = useState({ companyName: '', gstin: '', pan: '', address: '', website: '', linkedin: '' });
  const [newSvc, setNewSvc] = useState({ name: '', desc: '', price: '', category: '' });
  const [showNewSvc, setShowNewSvc] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setAbout({
      summary: profile.description || '',
      languages: (profile.languages || []).join(', '),
      experience: profile.establishedYear ? `${new Date().getFullYear() - profile.establishedYear}+ Years` : '',
      location: (profile.locations || []).join(', '),
      website: profile.website || '',
      linkedin: profile.socialLinks?.linkedin || '',
    });
    setBusiness({
      companyName: profile.name || '',
      gstin: '',
      pan: '',
      address: (profile.locations || []).join(', '),
      website: profile.website || '',
      linkedin: profile.socialLinks?.linkedin || '',
    });
    setServices(
      (profile.professionalServices || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        desc: s.description || '',
        price: s.priceMin?.toString() || '',
        category: s.category || '',
      })),
    );
    setProjects(
      (profile.professionalPortfolio || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        desc: p.description || '',
        image: true,
      })),
    );
  }, [profile]);

  const name = profile?.name || 'Professional';
  const slug = profile?.slug || '';
  const title = profile?.description || 'TradeServ Professional';
  const email = profile?.email || '';
  const mobile = profile?.mobile || '';
  const professionalStatus = (profile?.professionalStatus || 'PENDING_REVIEW').toLowerCase();
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const addService = async () => {
    if (!newSvc.name || !newSvc.desc || !newSvc.price) return;
    try {
      await addServiceMutation.mutateAsync({
        name: newSvc.name,
        description: newSvc.desc,
        priceMin: parseFloat(newSvc.price),
        category: newSvc.category,
      });
      setNewSvc({ name: '', desc: '', price: '', category: '' });
      setShowNewSvc(false);
      toast({ title: 'Success', description: 'Service added successfully' });
    } catch {
      toast({ title: 'Error', description: 'Failed to add service', variant: 'destructive' });
    }
  };

  const removeService = async (id: string) => {
    if (id.startsWith('s')) {
      setServices(services.filter((s) => s.id !== id));
      return;
    }
    try {
      await deleteServiceMutation.mutateAsync(id);
      toast({ title: 'Success', description: 'Service removed successfully' });
    } catch {
      toast({ title: 'Error', description: 'Failed to remove service', variant: 'destructive' });
    }
  };

  const toggleSection = (id: SectionId) => setActiveSection(activeSection === id ? null : id);

  const onSaveAbout = async () => {
    try {
      await updateProfile.mutateAsync({
        description: about.summary,
        website: about.website || undefined,
        socialLinks: { linkedin: about.linkedin },
      });
      handleAboutSave();
    } catch {
      toast({ title: 'Error', description: 'Failed to save about section', variant: 'destructive' });
    }
  };

  const onSaveBusiness = async () => {
    try {
      await updateProfile.mutateAsync({
        name: business.companyName || undefined,
        website: business.website || undefined,
        socialLinks: { linkedin: business.linkedin },
      });
      handleBusinessSave();
    } catch {
      toast({ title: 'Error', description: 'Failed to save business info', variant: 'destructive' });
    }
  };

  if (profileError) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Profile Management" description="Manage every part of your public profile from one place" />
        <GlassCard>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-text-tertiary">Failed to load profile. Please try again later.</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Profile Management"
        description="Manage every part of your public profile from one place"
      />

      {/* 1. Profile Overview */}
      <GlassCard>
        {profileLoading ? (
          <div className="space-y-4">
            <div className="h-24 animate-pulse rounded-2xl bg-surface-secondary" />
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 animate-pulse rounded-2xl bg-surface-secondary" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-48 animate-pulse rounded bg-surface-secondary" />
                <div className="h-4 w-64 animate-pulse rounded bg-surface-secondary" />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="relative mb-6 h-24 overflow-hidden rounded-2xl bg-gradient-to-r from-[#f59e0b]/20 via-[#f59e0b]/5 to-transparent">
              <div className="absolute bottom-3 left-4 flex items-center gap-2 text-[10px] text-text-tertiary">
                <Camera className="h-3 w-3" /> Change Cover
              </div>
            </div>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:-mt-12">
              <div className="group relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-bg-base bg-accent/15 text-2xl font-bold text-[#f59e0b] sm:h-24 sm:w-24 sm:text-3xl">
                {initials}
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer">
                  <Camera className="h-5 w-5 text-btn-primary-text" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-text-primary">{name}</h2>
                  <StatusBadge status={professionalStatus} />
                  {profile?.trustScore && profile.trustScore > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                      <Shield className="h-2.5 w-2.5" /> TradTrust {profile.trustScore}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-text-tertiary">{title}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-text-tertiary">
                  {profile?.locations?.length ? (
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{profile.locations.join(', ')}</span>
                  ) : null}
                  {profile?.establishedYear ? (
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date().getFullYear() - profile.establishedYear}+ Years</span>
                  ) : null}
                  {email ? (
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{email}</span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
              <span className="flex items-center gap-1.5 text-xs text-text-tertiary font-mono">tradeserv.com/p/{slug}</span>
              <button type="button" onClick={() => navigator.clipboard.writeText(`https://tradingo.com/tradeserv/p/${slug}`)}
                className="flex items-center gap-1 rounded-full bg-surface-secondary px-3 py-1 text-[10px] text-text-tertiary transition-all hover:bg-bg-elevated">
                <Copy className="h-3 w-3" /> Copy URL
              </button>
              <Link href={`/tradeserv/p/${slug}`} target="_blank"
                className="flex items-center gap-1 rounded-full bg-surface-secondary px-3 py-1 text-[10px] text-text-tertiary transition-all hover:bg-bg-elevated">
                <ExternalLink className="h-3 w-3" /> Preview
              </Link>
              <div className="ml-auto flex items-center gap-1.5 text-[10px] text-text-tertiary">
                <QrCode className="h-3.5 w-3.5" /> QR Code (coming soon)
              </div>
            </div>
          </>
        )}
      </GlassCard>

      {/* 2. Profile Completion Engine */}
      <GlassCard>
        {profileLoading ? (
          <div className="h-12 animate-pulse rounded-xl bg-surface-secondary" />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                  <span className="text-lg font-bold text-[#f59e0b]">{Math.min(profile?.profileCompletionPercentage ?? 0, 100)}%</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">Profile Completion</h3>
                  <p className="text-xs text-text-tertiary">
                    {profile?.profileCompletionPercentage ? 'Complete your profile to get more clients' : 'Start building your profile'}
                  </p>
                </div>
              </div>
              <div className="hidden sm:block w-48 h-1.5 overflow-hidden rounded-full bg-surface-secondary">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min(profile?.profileCompletionPercentage ?? 0, 100)}%` }} />
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-5">
              {(Object.entries(SECTION_LABELS) as [SectionId, string][]).map(([id, label]) => (
                <button key={id} type="button" onClick={() => toggleSection(id)}
                  className={`rounded-xl p-3 text-left transition-all ${activeSection === id ? 'bg-accent/10 border border-[#f59e0b]/20' : 'bg-surface border border-transparent hover:bg-surface-secondary'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-text-tertiary">{label}</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </GlassCard>

      {/* 3. Edit About */}
      <GlassCard>
        <button type="button" onClick={() => toggleSection('about')} className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-[#f59e0b]" />
            <h3 className="text-sm font-semibold text-text-primary">About</h3>
          </div>
          {activeSection === 'about' ? <ChevronUp className="h-4 w-4 text-text-tertiary" /> : <ChevronDown className="h-4 w-4 text-text-tertiary" />}
        </button>
        {activeSection === 'about' && (
          <div className="mt-4 space-y-4 border-t border-border pt-4">
            <FormInput label="Professional Summary" value={about.summary} onChange={(v) => setAbout({ ...about, summary: v })} textarea />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput label="Languages (comma separated)" value={about.languages} onChange={(v) => setAbout({ ...about, languages: v })} icon={Languages} />
              <FormInput label="Years of Experience" value={about.experience} onChange={(v) => setAbout({ ...about, experience: v })} icon={Clock} />
            </div>
            <FormInput label="Location" value={about.location} onChange={(v) => setAbout({ ...about, location: v })} icon={MapPin} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput label="Website" value={about.website} onChange={(v) => setAbout({ ...about, website: v })} icon={Globe} />
              <FormInput label="LinkedIn URL" value={about.linkedin} onChange={(v) => setAbout({ ...about, linkedin: v })} icon={Linkedin} />
            </div>
            <button type="button" onClick={onSaveAbout} disabled={updateProfile.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-bg-base transition-all hover:bg-accent/90 disabled:opacity-50">
              <Save className="h-3.5 w-3.5" /> {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </GlassCard>

      {/* 4. Manage Services */}
      <GlassCard>
        <button type="button" onClick={() => toggleSection('services')} className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-[#f59e0b]" />
            <h3 className="text-sm font-semibold text-text-primary">Services ({services.length})</h3>
          </div>
          {activeSection === 'services' ? <ChevronUp className="h-4 w-4 text-text-tertiary" /> : <ChevronDown className="h-4 w-4 text-text-tertiary" />}
        </button>
        {activeSection === 'services' && (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            {services.map((svc) => (
              <div key={svc.id} className="flex items-start justify-between rounded-xl bg-surface p-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text-primary">{svc.name}</p>
                    {svc.category && <span className="rounded bg-surface px-1.5 py-0.5 text-[9px] text-text-tertiary">{svc.category}</span>}
                  </div>
                  <p className="mt-0.5 text-xs text-text-tertiary">{svc.desc}</p>
                  {svc.price && <p className="mt-1 text-xs font-medium text-[#f59e0b]">{'\u20B9'}{svc.price}+</p>}
                </div>
                <button type="button" onClick={() => removeService(svc.id)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-text-tertiary transition-all hover:bg-red-500/10 hover:text-red-400">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {showNewSvc ? (
              <div className="rounded-xl bg-surface p-3.5 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormInput label="Service Name" value={newSvc.name} onChange={(v) => setNewSvc({ ...newSvc, name: v })} />
                  <FormInput label="Category" value={newSvc.category} onChange={(v) => setNewSvc({ ...newSvc, category: v })} />
                </div>
                <FormInput label="Description" value={newSvc.desc} onChange={(v) => setNewSvc({ ...newSvc, desc: v })} textarea />
                <FormInput label="Starting Price" value={newSvc.price} onChange={(v) => setNewSvc({ ...newSvc, price: v })} icon={DollarSign} />
                <div className="flex gap-2">
                  <button type="button" onClick={addService} disabled={addServiceMutation.isPending}
                    className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-bg-base disabled:opacity-50">
                    {addServiceMutation.isPending ? 'Adding...' : 'Add'}
                  </button>
                  <button type="button" onClick={() => setShowNewSvc(false)}
                    className="rounded-full border border-border px-4 py-1.5 text-xs text-text-tertiary">Cancel</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setShowNewSvc(true)}
                className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-surface px-4 py-3 text-xs text-text-tertiary transition-all hover:border-border hover:text-text-secondary w-full justify-center">
                <Plus className="h-4 w-4" /> Add Service
              </button>
            )}
          </div>
        )}
      </GlassCard>

      {/* 5. Manage Portfolio */}
      <GlassCard>
        <button type="button" onClick={() => toggleSection('portfolio')} className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <Image className="h-5 w-5 text-[#f59e0b]" />
            <h3 className="text-sm font-semibold text-text-primary">Portfolio ({projects.length})</h3>
          </div>
          {activeSection === 'portfolio' ? <ChevronUp className="h-4 w-4 text-text-tertiary" /> : <ChevronDown className="h-4 w-4 text-text-tertiary" />}
        </button>
        {activeSection === 'portfolio' && (
          <div className="mt-4 space-y-4 border-t border-border pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {projects.map((p) => (
                <div key={p.id} className="overflow-hidden rounded-xl border border-border bg-surface">
                  <div className="flex aspect-video items-center justify-center bg-surface">
                    <Image className="h-8 w-8 text-text-tertiary" />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-text-primary">{p.title}</p>
                    <p className="mt-1 text-xs text-text-tertiary line-clamp-2">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface px-4 py-3 text-xs text-text-tertiary transition-all hover:border-border">
              <Plus className="h-4 w-4" /> Add Project
            </button>
            <div className="flex gap-2">
              <div className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface px-4 py-4 text-xs text-text-tertiary">
                <Video className="h-4 w-4" /> Videos (coming soon)
              </div>
              <div className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface px-4 py-4 text-xs text-text-tertiary">
                <FileText className="h-4 w-4" /> Documents (coming soon)
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* 6. Manage Certifications */}
      <GlassCard>
        <button type="button" onClick={() => toggleSection('certifications')} className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-[#f59e0b]" />
            <h3 className="text-sm font-semibold text-text-primary">Certifications</h3>
          </div>
          {activeSection === 'certifications' ? <ChevronUp className="h-4 w-4 text-text-tertiary" /> : <ChevronDown className="h-4 w-4 text-text-tertiary" />}
        </button>
        {activeSection === 'certifications' && (
          <div className="mt-4 space-y-4 border-t border-border pt-4">
            <div className="space-y-2">
              {(profile?.professionalCertifications || []).length > 0 ? (
                (profile.professionalCertifications as any[]).map((c) => (
                  <div key={c.id} className="rounded-xl bg-surface p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{c.name}</p>
                        <p className="text-xs text-text-tertiary">{c.issuingAuthority} &middot; {new Date(c.issueDate).getFullYear()}</p>
                        {c.certificateUrl && <p className="text-xs text-text-tertiary font-mono mt-1">{c.certificateUrl}</p>}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-text-tertiary">No certifications added yet</p>
              )}
            </div>
          </div>
        )}
      </GlassCard>

      {/* 7. Business Information */}
      <GlassCard>
        <button type="button" onClick={() => toggleSection('business')} className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#f59e0b]" />
            <h3 className="text-sm font-semibold text-text-primary">Business Information</h3>
          </div>
          {activeSection === 'business' ? <ChevronUp className="h-4 w-4 text-text-tertiary" /> : <ChevronDown className="h-4 w-4 text-text-tertiary" />}
        </button>
        {activeSection === 'business' && (
          <div className="mt-4 space-y-4 border-t border-border pt-4">
            <FormInput label="Company / Firm Name" value={business.companyName} onChange={(v) => setBusiness({ ...business, companyName: v })} icon={Building2} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput label="GSTIN" value={business.gstin} onChange={(v) => setBusiness({ ...business, gstin: v })} placeholder="Enter GSTIN (optional)" />
              <FormInput label="PAN" value={business.pan} onChange={(v) => setBusiness({ ...business, pan: v })} placeholder="Enter PAN (optional)" />
            </div>
            <FormInput label="Office Address" value={business.address} onChange={(v) => setBusiness({ ...business, address: v })} icon={MapPin} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput label="Website" value={business.website} onChange={(v) => setBusiness({ ...business, website: v })} icon={Globe} />
              <FormInput label="LinkedIn" value={business.linkedin} onChange={(v) => setBusiness({ ...business, linkedin: v })} icon={Linkedin} />
            </div>
            <button type="button" onClick={onSaveBusiness} disabled={updateProfile.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-bg-base transition-all hover:bg-accent/90 disabled:opacity-50">
              <Save className="h-3.5 w-3.5" /> {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </GlassCard>

      {/* 8. Public Profile Preview */}
      <GlassCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-[#f59e0b]" />
            <h3 className="text-sm font-semibold text-text-primary">Public Profile Preview</h3>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link href={`/tradeserv/p/${slug}`} target="_blank"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-bg-base transition-all hover:bg-accent/90">
            <ExternalLink className="h-3.5 w-3.5" /> Live Preview
          </Link>
          <button type="button" onClick={() => navigator.clipboard.writeText(`https://tradingo.com/tradeserv/p/${slug}`)}
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-xs text-text-tertiary transition-all hover:bg-surface">
            <Copy className="h-3.5 w-3.5" /> Copy Public URL
          </button>
          <Link href={`/tradeserv/p/${slug}`} target="_blank"
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-xs text-text-tertiary transition-all hover:bg-surface">
            <Eye className="h-3.5 w-3.5" /> View as Visitor
          </Link>
          <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary ml-auto">
            <QrCode className="h-4 w-4" /> QR Code (coming soon)
          </div>
        </div>
      </GlassCard>

      {/* Save Toasts */}
      <SaveToast show={aboutSaved} message="About section updated" />
      <SaveToast show={businessSaved} message="Business info updated" />
    </div>
  );
}
