'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBooking, useUpdateBookingStatus, useMyProfile } from '@/hooks/use-tradeserv';
import { StatusBadge } from '@/components/dashboard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Calendar, Clock, MapPin, ExternalLink, ArrowLeft, MessageSquare, AlertCircle, XCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  CONFIRMED: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  IN_PROGRESS: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  COMPLETED: 'bg-green-500/10 text-green-400 border-green-500/30',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/30',
};

export default function BookingDetailPage() {
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: booking, isLoading, error } = useBooking(id);
  const { data: profile } = useMyProfile();
  const { mutateAsync: updateStatus, isPending: updating } = useUpdateBookingStatus();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-bg-base p-6">
        <EmptyState
          variant="error"
          title="Booking not found"
          description="This booking could not be loaded. It may have been removed or you may not have access."
          action={<Button variant="outline" onClick={() => router.back()}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>}
        />
      </div>
    );
  }

  const isProfessional = profile?.id === booking.companyId;
  const hasReview = booking.reviews && booking.reviews.length > 0;

  const handleStatusUpdate = async (status: string, extra?: { cancelReason?: string; meetingLink?: string }) => {
    setActionLoading(status);
    try {
      await updateStatus({ id, data: { status, ...extra } });
      toast({ title: 'Success', description: 'Booking status updated' });
    } catch {
      toast({ title: 'Error', description: 'Failed to update booking status', variant: 'destructive' });
    }
    setActionLoading(null);
  };

  const getStatusActions = () => {
    if (isProfessional) {
      switch (booking.status) {
        case 'PENDING':
          return (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => handleStatusUpdate('CONFIRMED')} disabled={updating}>
                {actionLoading === 'CONFIRMED' ? <LoadingSpinner size="sm" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                Confirm
              </Button>
              <Button size="sm" variant="outline" className="text-red-400 border-red-400/30 hover:bg-red-500/10" onClick={() => handleStatusUpdate('CANCELLED', { cancelReason: 'Cancelled by professional' })} disabled={updating}>
                {actionLoading === 'CANCELLED' ? <LoadingSpinner size="sm" /> : <XCircle className="w-4 h-4 mr-1" />}
                Cancel
              </Button>
            </div>
          );
        case 'CONFIRMED':
          return (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => handleStatusUpdate('IN_PROGRESS')} disabled={updating}>
                {actionLoading === 'IN_PROGRESS' ? <LoadingSpinner size="sm" /> : null}
                Start Service
              </Button>
              <Button size="sm" variant="outline" className="text-red-400 border-red-400/30 hover:bg-red-500/10" onClick={() => handleStatusUpdate('CANCELLED', { cancelReason: 'Cancelled by professional' })} disabled={updating}>
                {actionLoading === 'CANCELLED' ? <LoadingSpinner size="sm" /> : <XCircle className="w-4 h-4 mr-1" />}
                Cancel
              </Button>
            </div>
          );
        case 'IN_PROGRESS':
          return (
            <Button size="sm" onClick={() => handleStatusUpdate('COMPLETED')} disabled={updating}>
              {actionLoading === 'COMPLETED' ? <LoadingSpinner size="sm" /> : <CheckCircle className="w-4 h-4 mr-1" />}
              Mark Complete
            </Button>
          );
        default:
          return null;
      }
    }
    return null;
  };

  const amount = booking.amount
    ? `\u20B9${Number(booking.amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
    : null;

  return (
    <div className="min-h-screen bg-bg-base p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Booking Detail</h1>
          <p className="text-sm text-text-secondary">Booking #{booking.id.slice(0, 8)}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push('/tradeserv/workspace/bookings')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> All Bookings
        </Button>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${STATUS_COLORS[booking.status] || ''}`}>
                {booking.status.replace(/_/g, ' ')}
              </span>
              {amount && <span className="text-lg font-bold text-text-primary">{amount}</span>}
            </div>
            {getStatusActions()}
          </div>

          {booking.cancelReason && (
            <div className="flex items-start gap-2 rounded-lg bg-red-500/5 border border-red-500/20 p-3 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Cancellation reason: {booking.cancelReason}</span>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Schedule</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-accent" />
              <div>
                <p className="text-text-primary">{new Date(booking.scheduledAt).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="text-text-tertiary">{new Date(booking.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
            {booking.durationMinutes && (
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-accent" />
                <div>
                  <p className="text-text-primary">{booking.durationMinutes} minutes</p>
                  <p className="text-text-tertiary">Estimated duration</p>
                </div>
              </div>
            )}
            {booking.location && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-accent" />
                <div>
                  <p className="text-text-primary">{booking.location}</p>
                  <p className="text-text-tertiary">Location</p>
                </div>
              </div>
            )}
          </div>
          {booking.meetingLink && (
            <a
              href={booking.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm text-accent hover:text-accent/80"
            >
              <ExternalLink className="w-4 h-4" /> Join Meeting
            </a>
          )}
        </Card>

        {booking.company && (
          <Card className="p-6">
            <h3 className="text-sm font-medium text-text-secondary mb-4">Professional</h3>
            <div className="flex items-center gap-3">
              {booking.company.logo ? (
                <img src={booking.company.logo} alt={`${booking.company.name} logo`} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center text-sm font-medium text-text-secondary">
                  {booking.company.name?.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-medium text-text-primary">{booking.company.name}</p>
                {booking.service && <p className="text-sm text-text-tertiary">{booking.service.name}</p>}
              </div>
            </div>
          </Card>
        )}

        {booking.client && (
          <Card className="p-6">
            <h3 className="text-sm font-medium text-text-secondary mb-4">Client</h3>
            <div className="flex items-center gap-3">
              {booking.client.logo ? (
                <img src={booking.client.logo} alt={`${booking.client.name} avatar`} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center text-sm font-medium text-text-secondary">
                  {booking.client.name?.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-medium text-text-primary">{booking.client.name}</p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Payment</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-tertiary">Status</span>
              <StatusBadge status={booking.paymentStatus || 'PENDING'} />
            </div>
            {amount && (
              <div className="flex justify-between">
                <span className="text-text-tertiary">Amount</span>
                <span className="font-medium text-text-primary">{amount}</span>
              </div>
            )}
            {booking.paymentId && (
              <div className="flex justify-between">
                <span className="text-text-tertiary">Payment ID</span>
                <span className="text-text-primary font-mono text-xs">{booking.paymentId.slice(0, 12)}...</span>
              </div>
            )}
          </div>
        </Card>

        {booking.notes && (
          <Card className="p-6">
            <h3 className="text-sm font-medium text-text-secondary mb-4">Notes</h3>
            <p className="text-sm text-text-primary">{booking.notes}</p>
          </Card>
        )}

        {booking.status === 'COMPLETED' && !isProfessional && (
          <Card className="p-6">
            <h3 className="text-sm font-medium text-text-secondary mb-4">Review</h3>
            {hasReview ? (
              <div className="space-y-2">
                {booking.reviews.map((r) => (
                  <div key={r.id} className="rounded-lg bg-surface-secondary p-3">
                    <div className="flex items-center gap-2 mb-1">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <span key={i} className="text-amber-400 text-sm">{'\u2605'}</span>
                      ))}
                      {Array.from({ length: 5 - r.rating }).map((_, i) => (
                        <span key={i} className="text-text-tertiary text-sm">{'\u2605'}</span>
                      ))}
                    </div>
                    {r.title && <p className="font-medium text-sm text-text-primary">{r.title}</p>}
                    {r.description && <p className="text-xs text-text-secondary mt-1">{r.description}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <MessageSquare className="w-4 h-4" />
                <span>Leave a review for this booking</span>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
