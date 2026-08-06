'use client';

import { useEffect, useState } from 'react';
import { DashboardPageHeader } from '@/components/dashboard';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getBetaInvites, createBetaInvite, revokeBetaInvite, getBetaInviteStats, BetaInvite } from '@/lib/api/beta';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Mail, CheckCircle, Clock, XCircle, RefreshCw, Plus, Search, Send, UserPlus, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';

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
    <Modal open={open} onClose={onClose} title="Send Beta Invite">
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
        {error && <Alert variant="error">{error}</Alert>}
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
    </Modal>
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
            <EmptyState icon={search ? Search : UserPlus} title={search ? 'No invites match your search' : 'No invites sent yet'} description={search ? undefined : 'Send your first beta invite.'} action={!search && <Button onClick={() => setModalOpen(true)} variant="outline" size="sm"><Plus className="mr-2 h-4 w-4" /> Send Invite</Button>} />
          ) : (
            <Table>
              <THead><TR>
                <TH>Email</TH>
                <TH>Company</TH>
                <TH>Status</TH>
                <TH>Created</TH>
                <TH>Expires</TH>
                <TH className="text-right">Actions</TH>
              </TR></THead>
              <TBody>
                {filtered.map((inv) => (
                  <TR key={inv.id}>
                    <TD>{inv.email}</TD>
                    <TD className="text-text-secondary">{inv.companyName || '-'}</TD>
                    <TD><Badge variant={statusVariant[inv.status] || 'secondary'}>{inv.status}</Badge></TD>
                    <TD className="whitespace-nowrap text-text-secondary">{new Date(inv.createdAt).toLocaleDateString()}</TD>
                    <TD className="whitespace-nowrap text-text-secondary">{new Date(inv.expiresAt).toLocaleDateString()}</TD>
                    <TD className="text-right">
                      {inv.status === 'PENDING' && (
                        <Button variant="destructive" size="sm" onClick={() => handleRevoke(inv.id)} disabled={revoking === inv.id}>
                          {revoking === inv.id ? 'Revoking...' : 'Revoke'}
                        </Button>
                      )}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
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
