import { DashboardPageHeader, StatCard } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Server, Database, Wifi, Activity, Cpu, HardDrive, Clock, Zap, CheckCircle, XCircle } from 'lucide-react';

interface Service {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: string;
  responseTime: string;
  icon: typeof Server;
  metrics: { label: string; value: string }[];
}

const services: Service[] = [
  {
    name: 'API Server',
    status: 'healthy',
    uptime: '14d 7h 32m',
    responseTime: '45ms',
    icon: Server,
    metrics: [
      { label: 'Requests/min', value: '2,847' },
      { label: 'Error Rate', value: '0.02%' },
      { label: 'Avg Latency', value: '42ms' },
      { label: 'P99 Latency', value: '156ms' },
    ],
  },
  {
    name: 'Database (PostgreSQL)',
    status: 'healthy',
    uptime: '30d 12h 15m',
    responseTime: '12ms',
    icon: Database,
    metrics: [
      { label: 'Active Connections', value: '23' },
      { label: 'Query/s', value: '1,204' },
      { label: 'Cache Hit Rate', value: '98.7%' },
      { label: 'Disk Usage', value: '42%' },
    ],
  },
  {
    name: 'WebSocket Server',
    status: 'degraded',
    uptime: '7d 3h 48m',
    responseTime: '28ms',
    icon: Wifi,
    metrics: [
      { label: 'Active Connections', value: '1,532' },
      { label: 'Msg/s', value: '8,921' },
      { label: 'Reconnect Rate', value: '2.3%' },
      { label: 'Avg Latency', value: '28ms' },
    ],
  },
  {
    name: 'Redis Cache',
    status: 'healthy',
    uptime: '30d 12h 15m',
    responseTime: '3ms',
    icon: Cpu,
    metrics: [
      { label: 'Hit Rate', value: '95.2%' },
      { label: 'Memory Used', value: '1.2 GB' },
      { label: 'Evictions/s', value: '0' },
      { label: 'Connected Slaves', value: '2' },
    ],
  },
];

const statusConfig = {
  healthy: { icon: CheckCircle, color: 'text-accent-600', bg: 'bg-accent-50 dark:bg-accent-900/20', dot: 'bg-accent-500' },
  degraded: { icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', dot: 'bg-amber-500' },
  down: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', dot: 'bg-red-500' },
};

export default function SystemHealthPage() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="System Health"
        description="Monitor the status and performance of platform services"
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Server} label="API Status" value="Healthy" change="45ms avg" changeType="positive" />
        <StatCard icon={Database} label="Database" value="Healthy" change="12ms avg" changeType="positive" />
        <StatCard icon={Wifi} label="WebSocket" value="Degraded" change="28ms avg" changeType="negative" />
        <StatCard icon={Cpu} label="Redis" value="Healthy" change="3ms avg" changeType="positive" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {services.map((service) => {
          const config = statusConfig[service.status];
          return (
            <Card key={service.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.bg} ${config.color}`}>
                    <service.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{service.name}</CardTitle>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${config.dot}`} />
                      <span className={`text-sm font-medium capitalize ${config.color}`}>
                        {service.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-tertiary">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {service.uptime}
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {service.responseTime}
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4">
                  {service.metrics.map((metric) => (
                    <div key={metric.label} className="rounded-lg bg-surface-secondary/50 p-3 dark:bg-dark-surface-secondary/50">
                      <p className="text-xs text-text-secondary dark:text-dark-text-secondary">{metric.label}</p>
                      <p className="mt-0.5 text-lg font-bold text-text-primary dark:text-dark-text-primary">
                        {metric.value}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HardDrive className="h-5 w-5 text-text-tertiary" />
            System Resources
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary dark:text-dark-text-secondary">CPU Usage</span>
                <span className="font-medium text-text-primary dark:text-dark-text-primary">34%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-secondary dark:bg-dark-surface-secondary">
                <div className="h-full w-[34%] rounded-full bg-primary-600 transition-all" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary dark:text-dark-text-secondary">Memory Usage</span>
                <span className="font-medium text-text-primary dark:text-dark-text-primary">62%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-secondary dark:bg-dark-surface-secondary">
                <div className="h-full w-[62%] rounded-full bg-amber-500 transition-all" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary dark:text-dark-text-secondary">Disk Usage</span>
                <span className="font-medium text-text-primary dark:text-dark-text-primary">47%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-secondary dark:bg-dark-surface-secondary">
                <div className="h-full w-[47%] rounded-full bg-accent-600 transition-all" />
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-6 sm:grid-cols-3">
            <div className="flex items-center justify-between rounded-lg border border-border p-3 dark:border-dark-border">
              <span className="text-sm text-text-secondary dark:text-dark-text-secondary">Total Requests (24h)</span>
              <span className="text-sm font-bold text-text-primary dark:text-dark-text-primary">4,103,287</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3 dark:border-dark-border">
              <span className="text-sm text-text-secondary dark:text-dark-text-secondary">Active Sessions</span>
              <span className="text-sm font-bold text-text-primary dark:text-dark-text-primary">8,421</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3 dark:border-dark-border">
              <span className="text-sm text-text-secondary dark:text-dark-text-secondary">Errors (24h)</span>
              <span className="text-sm font-bold text-red-600">23</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
