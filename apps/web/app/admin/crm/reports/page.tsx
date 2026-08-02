'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardPageHeader, StatCard, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { useLeadConversionReport, useWinRateReport, usePipelineValueReport, useFollowUpEfficiencyReport, useRmPerformanceReport } from '@/hooks/use-crm';
import { useQuery } from '@tanstack/react-query';
import * as crmApi from '@/lib/api/crm';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { TrendingUp, Target, XCircle, Layers, Activity, Users } from 'lucide-react';

export default function AdminCrmReportsPage() {
  const { data: conversion, isLoading: l1 } = useLeadConversionReport();
  const { data: winRate, isLoading: l2 } = useWinRateReport();
  const { data: lostReasons, isLoading: l3 } = useQuery({ queryKey: ['crm', 'report', 'lost-reasons'], queryFn: () => crmApi.getLostReasonsReport().then(r => r.data) });
  const { data: pipelineValue, isLoading: l4 } = usePipelineValueReport();
  const { data: fuEfficiency, isLoading: l5 } = useFollowUpEfficiencyReport();
  const { data: rmPerformance, isLoading: l6 } = useRmPerformanceReport();

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="CRM Reports" description="Lead and pipeline analytics" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {l1 ? <StatCardSkeleton /> : conversion && <StatCard icon={Target} label="Conversion Rate" value={`${conversion.conversionRate}%`} />}
        {l2 ? <StatCardSkeleton /> : winRate && <StatCard icon={TrendingUp} label="Win Rate" value={`${winRate.winRate}%`} />}
        {l5 ? <StatCardSkeleton /> : fuEfficiency && <StatCard icon={Activity} label="Follow-up Completion" value={`${fuEfficiency.completionRate}%`} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Pipeline Value by Stage</CardTitle></CardHeader>
          <CardContent>
            {l4 ? <TableSkeleton rows={4} /> : !pipelineValue?.length ? <p className="text-sm text-text-tertiary">No data</p> : (
              <div className="space-y-3">
                {pipelineValue.map((s: any) => (
                  <div key={s.name} className="flex justify-between items-center">
                    <span className="text-sm">{s.name}</span>
                    <div className="text-right">
                      <p className="text-sm font-medium">₹{s.value.toLocaleString()}</p>
                      <p className="text-xs text-text-tertiary">{s.count} leads</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Lost Reasons</CardTitle></CardHeader>
          <CardContent>
            {l3 ? <TableSkeleton rows={4} /> : !lostReasons?.length ? <p className="text-sm text-text-tertiary">No lost leads</p> : (
              <div className="space-y-3">
                {lostReasons.map((r: any) => (
                  <div key={r.reason} className="flex justify-between items-center">
                    <span className="text-sm">{r.reason}</span>
                    <span className="text-sm font-medium">{r.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>RM Performance</CardTitle></CardHeader>
        <CardContent className="p-0">
          {l6 ? <TableSkeleton rows={5} /> : !rmPerformance?.length ? <EmptyState title="No data" /> : (
            <Table>
              <THead><TR><TH>RM</TH><TH>Companies</TH><TH>Leads</TH><TH>Won</TH><TH>Conversion</TH></TR></THead>
              <TBody>
                {rmPerformance.map((rm: any) => (
                  <TR key={rm.rmId}>
                    <TD>{rm.rmName}</TD>
                    <TD>{rm.managedCompanies}</TD>
                    <TD>{rm.totalLeads}</TD>
                    <TD>{rm.wonLeads}</TD>
                    <TD className="font-medium">{rm.conversionRate}%</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
