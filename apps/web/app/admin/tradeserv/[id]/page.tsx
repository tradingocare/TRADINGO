'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle, Star, Shield, Mail, Phone, Globe, Calendar, Award, Briefcase, Clock, BookOpen, MessageSquare, Image as ImageIcon, MapPin } from 'lucide-react';
import { DashboardPageHeader, StatCard, StatusBadge } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useAdminProfessionalDetail, useApproveProfessional, useRejectProfessional } from '@/hooks/use-tradeserv';

export default function AdminTradeservDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [actionId, setActionId] = useState<string | null>(null);

  const { data: professional, isLoading, error } = useAdminProfessionalDetail(id);
  const { mutateAsync: approve } = useApproveProfessional();
  const { mutateAsync: reject } = useRejectProfessional();

  const handleApprove = async () => {
    setActionId('approve');
    try { await approve({ id }); } catch { /* toast handled by hook */ }
    setActionId(null);
  };

  const handleReject = async () => {
    setActionId('reject');
    try { await reject({ id }); } catch { /* toast handled by hook */ }
    setActionId(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Loading..." />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !professional) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Professional Detail" />
        <EmptyState
          variant="error"
          icon={Shield}
          title="Failed to load professional"
          description="The professional could not be found or an error occurred."
          action={
            <Link href="/admin/tradeserv">
              <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to TradeServ</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const p = professional as any;
  const services = p.professionalServices ?? [];
  const portfolio = p.professionalPortfolio ?? [];
  const certifications = p.professionalCertifications ?? [];
  const languages = p.professionalLanguages ?? [];
  const serviceAreas = p.professionalServiceAreas ?? [];
  const reviews = p.reviewsAsProfessional ?? [];
  const bookings = p.bookingsAsProfessional ?? [];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={p.name}
        description={`Professional Detail — ${p.professionalType?.replace(/_/g, ' ') || 'N/A'}`}
        actions={
          <Link href="/admin/tradeserv">
            <Button variant="outline" size="sm"><ArrowLeft className="mr-2 h-3 w-3" /> Back</Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              {p.logo ? (
                <img src={p.logo} alt={p.name} className="h-16 w-16 rounded-xl object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface-secondary text-2xl font-bold text-text-tertiary">
                  {p.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-text-primary">{p.name}</h2>
                  <StatusBadge status={p.professionalStatus || 'UNKNOWN'} />
                </div>
                {p.description && (
                  <p className="mt-1 text-sm text-text-secondary">{p.description}</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-text-tertiary">
                  {p.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {p.email}</span>}
                  {p.mobile && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {p.mobile}</span>}
                  {p.website && <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {p.website}</span>}
                  {p.establishedYear && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Est. {p.establishedYear}</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trust & Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Trust Score</span>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-400" />
                <span className="font-semibold text-text-primary">{p.trustScore ?? 0}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Verification</span>
              <Badge variant="outline">{p.verificationLevel || 'LEVEL_0'}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Type</span>
              <span className="text-sm text-text-primary">{p.professionalType?.replace(/_/g, ' ') || '-'}</span>
            </div>
            {p.employeeCount && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Employees</span>
                <span className="text-sm text-text-primary">{p.employeeCount}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Joined</span>
              <span className="text-sm text-text-primary">{new Date(p.createdAt).toLocaleDateString()}</span>
            </div>
            {p.professionalApprovedAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Approved</span>
                <span className="text-sm text-text-primary">{new Date(p.professionalApprovedAt).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {p.professionalStatus === 'PENDING_REVIEW' && (
        <Card className="border-amber-500/20">
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <h3 className="font-semibold text-text-primary">Pending Review</h3>
              <p className="text-sm text-text-secondary">This professional is awaiting approval.</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="default"
                className="bg-green-600 text-white hover:bg-green-700"
                disabled={actionId !== null}
                onClick={handleApprove}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {actionId === 'approve' ? 'Approving...' : 'Approve'}
              </Button>
              <Button
                variant="default"
                className="bg-red-600 text-white hover:bg-red-700"
                disabled={actionId !== null}
                onClick={handleReject}
              >
                <XCircle className="mr-2 h-4 w-4" />
                {actionId === 'reject' ? 'Rejecting...' : 'Reject'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> Services ({services.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {services.length === 0 ? (
              <EmptyState variant="empty" icon={Briefcase} title="No services" description="No services have been added yet" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-2 font-medium text-text-tertiary">Name</th>
                      <th className="pb-2 font-medium text-text-tertiary">Category</th>
                      <th className="pb-2 font-medium text-text-tertiary">Price Range</th>
                      <th className="pb-2 font-medium text-text-tertiary">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((s: any) => (
                      <tr key={s.id} className="border-b border-border last:border-0">
                        <td className="py-2 text-text-primary">{s.name}</td>
                        <td className="py-2 text-xs text-text-secondary">{s.category || '-'}</td>
                        <td className="py-2 text-xs text-text-secondary">
                          {s.priceMin ? `₹${s.priceMin}${s.priceMax && s.priceMax !== s.priceMin ? ` - ₹${s.priceMax}` : ''}` : '-'}
                        </td>
                        <td className="py-2">{s.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Award className="h-4 w-4" /> Certifications ({certifications.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {certifications.length === 0 ? (
              <EmptyState variant="empty" icon={Award} title="No certifications" description="No certifications have been added yet" />
            ) : (
              <div className="space-y-2">
                {certifications.map((c: any) => (
                  <div key={c.id} className="rounded-lg border border-border bg-surface p-3">
                    <p className="text-sm font-medium text-text-primary">{c.name}</p>
                    <p className="text-xs text-text-tertiary">{c.issuingAuthority}{c.issueDate ? ` · ${new Date(c.issueDate).getFullYear()}` : ''}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Portfolio ({portfolio.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {portfolio.length === 0 ? (
              <EmptyState variant="empty" icon={ImageIcon} title="No portfolio items" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {portfolio.slice(0, 6).map((item: any) => (
                  <div key={item.id} className="rounded-lg border border-border bg-surface p-3">
                    <p className="text-sm font-medium text-text-primary">{item.title}</p>
                    {item.clientName && <p className="text-xs text-text-tertiary">Client: {item.clientName}</p>}
                  </div>
                ))}
                {portfolio.length > 6 && (
                  <p className="col-span-full text-center text-xs text-text-tertiary">+{portfolio.length - 6} more items</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {languages.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-text-tertiary">Languages</p>
                <div className="flex flex-wrap gap-1">
                  {languages.map((l: any) => (
                    <Badge key={l.id || l.language} variant="secondary">{l.language}</Badge>
                  ))}
                </div>
              </div>
            )}
            {serviceAreas.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-text-tertiary">Service Areas</p>
                <div className="flex flex-wrap gap-1">
                  {serviceAreas.map((a: any) => (
                    <Badge key={a.id} variant="outline">{a.city}{a.state ? `, ${a.state}` : ''}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-text-tertiary">Response Time:</span> <span className="text-text-primary">{p.responseTimeMinutes ? `${p.responseTimeMinutes} min` : '-'}</span></div>
              <div><span className="text-text-tertiary">Business Type:</span> <span className="text-text-primary">{p.businessType || '-'}</span></div>
              {p.gstNumber && <div className="col-span-2"><span className="text-text-tertiary">GST:</span> <span className="font-mono text-text-primary">{p.gstNumber}</span></div>}
              {p.panNumber && <div className="col-span-2"><span className="text-text-tertiary">PAN:</span> <span className="font-mono text-text-primary">{p.panNumber}</span></div>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Bookings ({bookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <EmptyState variant="empty" icon={Calendar} title="No bookings" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 font-medium text-text-tertiary">Date</th>
                    <th className="pb-2 font-medium text-text-tertiary">Status</th>
                    <th className="pb-2 font-medium text-text-tertiary">Duration</th>
                    <th className="pb-2 font-medium text-text-tertiary">Payment</th>
                    <th className="pb-2 font-medium text-text-tertiary">Amount</th>
                    <th className="pb-2 font-medium text-text-tertiary">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b: any) => (
                    <tr key={b.id} className="border-b border-border last:border-0">
                      <td className="py-2 text-text-primary">{new Date(b.scheduledAt).toLocaleDateString()}</td>
                      <td className="py-2"><StatusBadge status={b.status} /></td>
                      <td className="py-2 text-xs text-text-secondary">{b.durationMinutes ? `${b.durationMinutes} min` : '-'}</td>
                      <td className="py-2">{b.paymentStatus ? <StatusBadge status={b.paymentStatus} /> : <span className="text-xs text-text-tertiary">-</span>}</td>
                      <td className="py-2 text-xs text-text-secondary">{b.amount ? `₹${Number(b.amount).toFixed(2)}` : '-'}</td>
                      <td className="py-2 text-xs text-text-tertiary">{new Date(b.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Reviews ({reviews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <EmptyState variant="empty" icon={MessageSquare} title="No reviews" />
          ) : (
            <div className="space-y-3">
              {reviews.map((r: any) => (
                <div key={r.id} className="rounded-lg border border-border bg-surface p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">{r.client?.name || 'Anonymous'}</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-text-tertiary">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.title && <p className="mt-1 text-xs font-medium text-text-secondary">{r.title}</p>}
                  {r.description && <p className="mt-0.5 text-xs text-text-tertiary">{r.description}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
