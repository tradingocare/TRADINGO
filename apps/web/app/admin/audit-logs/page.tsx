'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardPageHeader, StatusBadge } from '@/components/dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/use-toast';
import { Search, ChevronLeft, ChevronRight, Loader2, ShieldAlert, AlertTriangle, Ban, Fingerprint } from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  userRole: string;
  action: string;
  resource: string;
  metadata: { attempt?: number; identifier?: string; reason?: string; field?: string; severity?: string } | unknown;
  ipAddress: string;
}

interface AuditLogResponse {
  data: AuditLog[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const FILTER_TABS: { key: string; label: string; icon?: React.ComponentType<{ className?: string }> }[] = [
  { key: '', label: 'All Events' },
  { key: 'SECURITY', label: 'Security Events', icon: ShieldAlert },
  { key: 'SECURITY_LOGIN_FAILURE', label: 'Authentication', icon: Fingerprint },
  { key: 'LOGIN', label: 'Login Activity' },
];

function isSecurityEvent(action: string): boolean {
  return action.startsWith('SECURITY_');
}

function getSeverityColor(severity?: string): string {
  switch (severity) {
    case 'critical': return 'bg-status-error';
    case 'high': return 'bg-orange-500';
    case 'medium': return 'bg-yellow-500';
    default: return 'bg-accent';
  }
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (activeTab === 'SECURITY') {
        params.set('action', 'SECURITY_');
      } else if (activeTab === 'SECURITY_LOGIN_FAILURE') {
        params.set('action', 'SECURITY_LOGIN_FAILURE');
      } else if (activeTab === 'LOGIN') {
        params.set('action', 'LOGIN');
      }
      const res = await apiClient.get<AuditLogResponse>(`/admin/audit-logs?${params.toString()}`);
      setLogs(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch {
      toast({ title: 'Error', description: 'Failed to load audit logs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page, search, activeTab]);

  useEffect(() => { fetchLogs() }, [page, activeTab, fetchLogs]);

  const handleSearch = () => { setPage(1); fetchLogs() };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPage(1);
  };

  const securityCount = logs.filter((l) => isSecurityEvent(l.action)).length;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Audit & Security Logs"
        description="Track all platform activity, security events, and access attempts"
        actions={
          <Button variant="outline" disabled>
            Export Logs
          </Button>
        }
      />

      {securityCount > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <ShieldAlert className="h-8 w-8 text-status-error" />
              <div>
                <p className="text-2xl font-bold text-text-primary">{securityCount}</p>
                <p className="text-xs text-text-tertiary">Security Events (this page)</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Ban className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-text-primary">
                  {logs.filter((l) => l.action === 'SECURITY_LOGIN_FAILURE').length}
                </p>
                <p className="text-xs text-text-tertiary">Failed Logins</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-text-primary">
                  {logs.filter((l) => l.action === 'SECURITY_PROMPT_INJECTION').length}
                </p>
                <p className="text-xs text-text-tertiary">Prompt Injection Blocks</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-1 border-b border-border px-2 pt-2">
            {FILTER_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-surface text-text-primary border-b-2 border-accent'
                      : 'text-text-tertiary hover:text-text-secondary'
                  }`}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3 border-b border-border p-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <Input
                placeholder="Search logs by user, action, resource..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleSearch}>Search</Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-accent" />
            </div>
          ) : (
            <>
              <Table>
                <THead><TR>
                  <TH>Timestamp</TH>
                  <TH>User</TH>
                  <TH>Action</TH>
                  <TH>Resource</TH>
                  <TH className="hidden md:table-cell">IP Address</TH>
                  <TH>Status</TH>
                </TR></THead>
                <TBody>
                  {logs.length === 0 ? (
                    <TR><TD colSpan={6} className="py-12 text-center text-text-secondary">No audit logs found.</TD></TR>
                  ) : (
                    logs.map((log) => {
                      const meta = log.metadata as { attempt?: number; reason?: string; field?: string } | null;
                      const isSecurity = isSecurityEvent(log.action);
                      return (
                        <TR key={log.id}>
                          <TD className="whitespace-nowrap text-xs text-text-secondary">{new Date(log.timestamp).toLocaleString()}</TD>
                          <TD>
                            <p className="text-sm font-medium text-text-primary">{log.user}</p>
                            <p className="text-[10px] text-text-tertiary">{log.userRole}</p>
                          </TD>
                          <TD>
                            <div className="flex items-center gap-1.5">
                              {isSecurity && <ShieldAlert className="h-3.5 w-3.5 text-status-error shrink-0" />}
                              <StatusBadge status={log.action.toLowerCase()} />
                            </div>
                            {meta?.attempt && (
                              <p className="text-[10px] text-text-tertiary mt-0.5">Attempt {meta.attempt}/3</p>
                            )}
                            {meta?.reason && (
                              <p className="text-[10px] text-text-tertiary mt-0.5 capitalize">{meta.reason.replace(/_/g, ' ')}</p>
                            )}
                          </TD>
                          <TD>
                            <p className="text-sm text-text-primary">{log.resource}</p>
                            {meta?.field && (
                              <p className="text-[10px] text-text-tertiary">field: {meta.field}</p>
                            )}
                          </TD>
                          <TD className="hidden md:table-cell text-xs text-text-tertiary">{log.ipAddress || '—'}</TD>
                          <TD>
                            {isSecurity ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-status-error">
                                <span className={`h-1.5 w-1.5 rounded-full ${getSeverityColor((log.metadata as any)?.severity)}`} />
                                blocked
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                                logged
                              </span>
                            )}
                          </TD>
                        </TR>
                      );
                    })
                  )}
                </TBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border px-4 py-3">
                  <p className="text-xs text-text-tertiary">Page {page} of {totalPages} ({total} total)</p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-2 text-sm text-text-secondary">{page}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
