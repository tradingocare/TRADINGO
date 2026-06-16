'use client';

import { useEffect, useState } from 'react';
import { DashboardPageHeader } from '@/components/dashboard';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getBetaInvites, createBetaInvite, revokeBetaInvite, getBetaInviteStats, BetaInvite } from '@/lib/api/beta';
import { Mail, CheckCircle, Clock, XCircle, RefreshCw, Plus, Search, Send, UserPlus, AlertTriangle } from 'lucide-react';

interface InviteStats {
  total: number;
  pending: number;
  accepted: number;
  expired: number;
  revoked: number;
}

const statusVariant: Record<string, 'warning' | 'success' | 'secondary' | 'destructive'> = {
  PENDING: 'warning',
  ACCEPTED: 'success',
  EXPIRED: 'secondary',
  REVOKED: 'destructive',
};

function InviteModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    setError(null);
    try {
      await createBetaInvite({ email, companyName: companyName || undefined, message: message || undefined });
      setEmail('');
      setCompanyName('');
      setMessage('');
      onSuccess();
      onClose();
    } catch {
      setError('Failed to send invite. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg dark:border-dark-border dark:bg-dark-surface">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">Send Beta Invite</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-text-secondary hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary dark:text-dark-text-primary">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary dark:text-dark-text-primary">
              Company Name <span className="text-text-tertiary">(optional)</span>
            </label>
            <Input
              placeholder="Acme Corp"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary dark:text-dark-text-primary">
              Message <span className="text-text-tertiary">(optional)</span>
            </label>
            <Textarea
              placeholder="Welcome to the TRADINGO beta program..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={sending}>
              Cancel
            </Button>
            <Button type="submit" disabled={sending || !email}>
              <Send className="mr-2 h-4 w-4" />
              {sending ? 'Sending...' : 'Send Invite'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BetaInvitesPage() {
  const [invites, setInvites] = useState<BetaInvite[]>([]);
  const [stats, setStats] = useState<InviteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [invitesData, statsData] = await Promise.all([
        getBetaInvites(),
        getBetaInviteStats(),
      ]);
      setInvites(invitesData);
      setStats(statsData);
    } catch {
      setError('Failed to load beta invites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    try {
      await revokeBetaInvite(id);
      await fetchData();
    } catch {
      // silently fail
    } finally {
      setRevoking(null);
    }
  };

  const filtered = invites.filter((inv) =>
    inv.email.toLowerCase().includes(search.toLowerCase()),
  );

  const statConfig = [
    { label: 'Total Invites', value: String(stats?.total ?? 0), icon: Mail },
    { label: 'Pending', value: String(stats?.pending ?? 0), icon: Clock },
    { label: 'Accepted', value: String(stats?.accepted ?? 0), icon: CheckCircle },
    { label: 'Expired / Revoked', value: String((stats?.expired ?? 0) + (stats?.revoked ?? 0)), icon: XCircle },
  ];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Beta Invites"
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Send Invite
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statConfig.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} />
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <Input
                placeholder="Search by email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={fetchData} variant="ghost" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-text-secondary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <AlertTriangle className="h-10 w-10 text-red-500" />
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary">{error}</p>
              <Button onClick={fetchData} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" /> Retry
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <UserPlus className="h-10 w-10 text-text-tertiary" />
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
                {search ? 'No invites match your search' : 'No invites sent yet. Send your first beta invite.'}
              </p>
              {!search && (
                <Button onClick={() => setModalOpen(true)} variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Send Invite
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border dark:border-dark-border">
                    <th className="py-3 pr-4 text-left font-medium text-text-secondary">Email</th>
                    <th className="py-3 pr-4 text-left font-medium text-text-secondary">Company</th>
                    <th className="py-3 pr-4 text-left font-medium text-text-secondary">Status</th>
                    <th className="py-3 pr-4 text-left font-medium text-text-secondary">Created</th>
                    <th className="py-3 pr-4 text-left font-medium text-text-secondary">Expires</th>
                    <th className="py-3 text-right font-medium text-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => (
                    <tr key={inv.id} className="border-b border-border dark:border-dark-border">
                      <td className="py-3 pr-4 text-text-primary dark:text-dark-text-primary">{inv.email}</td>
                      <td className="py-3 pr-4 text-text-secondary">{inv.companyName || '-'}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={statusVariant[inv.status] || 'secondary'}>{inv.status}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-text-secondary whitespace-nowrap">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4 text-text-secondary whitespace-nowrap">
                        {new Date(inv.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        {inv.status === 'PENDING' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRevoke(inv.id)}
                            disabled={revoking === inv.id}
                          >
                            {revoking === inv.id ? 'Revoking...' : 'Revoke'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <InviteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
