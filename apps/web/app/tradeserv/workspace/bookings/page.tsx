'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Calendar, Clock, MapPin, User, Building2 } from 'lucide-react';

interface Booking {
  id: string;
  status: string;
  scheduledAt: string;
  durationMinutes?: number;
  amount?: number;
  notes?: string;
  meetingLink?: string;
  location?: string;
  service?: { name: string };
  company?: { name: string };
}

export default function BookingsPage() {
  const { data, isLoading, error } = useQuery<{ asProfessional: Booking[]; asClient: Booking[] }>({
    queryKey: ['tradeserv', 'bookings'],
    queryFn: () => apiClient.get('/tradeserv/bookings').then(r => r.data),
  });

  if (isLoading) return <div className="min-h-screen bg-bg-base flex items-center justify-center"><LoadingSpinner size="xl" /></div>;
  if (error) return <div className="min-h-screen bg-bg-base p-6"><EmptyState variant="error" title="Failed to load bookings" /></div>;

  const hasBookings = data && (data.asProfessional.length > 0 || data.asClient.length > 0);

  return (
    <div className="min-h-screen bg-bg-base p-6 space-y-6">
      <PageHeader title="Bookings" description="Manage your service bookings" />
      {!hasBookings ? (
        <EmptyState icon={Calendar} title="No bookings yet" description="Bookings will appear here when clients schedule sessions" />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2"><Building2 className="w-5 h-5" /> As Professional</h2>
            {data!.asProfessional.map((b) => <BookingCard key={b.id} booking={b} />)}
            {data!.asProfessional.length === 0 && <p className="text-text-tertiary text-sm">No professional bookings</p>}
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2"><User className="w-5 h-5" /> As Client</h2>
            {data!.asClient.map((b) => <BookingCard key={b.id} booking={b} />)}
            {data!.asClient.length === 0 && <p className="text-text-tertiary text-sm">No client bookings</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const statusColor: Record<string, string> = {
    PENDING: 'bg-status-warning/20 text-status-warning',
    CONFIRMED: 'bg-accent/20 text-accent',
    IN_PROGRESS: 'bg-blue-500/20 text-blue-400',
    COMPLETED: 'bg-status-success/20 text-status-success',
    CANCELLED: 'bg-status-error/20 text-status-error',
  };

  return (
    <Card className="p-4 space-y-2">
      <div className="flex items-center justify-between">
        <Badge className={statusColor[booking.status] || ''}>{booking.status}</Badge>
        {booking.amount && <span className="text-sm font-medium text-text-primary">₹{booking.amount}</span>}
      </div>
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Calendar className="w-4 h-4" />
        {new Date(booking.scheduledAt).toLocaleDateString()} {new Date(booking.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      {booking.durationMinutes && (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Clock className="w-4 h-4" />{booking.durationMinutes} min
        </div>
      )}
      {booking.location && (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <MapPin className="w-4 h-4" />{booking.location}
        </div>
      )}
      {booking.service && <p className="text-sm text-text-primary font-medium">{booking.service.name}</p>}
      {booking.notes && <p className="text-sm text-text-tertiary">{booking.notes}</p>}
    </Card>
  );
}
