export class TradeAgentPriority {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionUrl?: string;
  actionLabel?: string;
  metric?: { label: string; value: string | number };
}

export class TradeAgentQuickAction {
  label: string;
  href: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
}

export class TradeAgentDashboardCopilotResponse {
  priorities: TradeAgentPriority[];
  quickActions: TradeAgentQuickAction[];
  urgentAlerts: TradeAgentPriority[];
  opportunities: TradeAgentPriority[];
  metrics: Record<string, number | string>;
}

export class TradeAgentNotificationItem {
  type: 'alert' | 'milestone' | 'insight' | 'reminder' | 'opportunity';
  title: string;
  body: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  link?: string;
  createdAt: Date;
}

export class TradeAgentNotificationsResponse {
  dailyDigest: string;
  criticalAlerts: TradeAgentNotificationItem[];
  milestones: TradeAgentNotificationItem[];
  insights: TradeAgentNotificationItem[];
  reminders: TradeAgentNotificationItem[];
  opportunities?: TradeAgentNotificationItem[];
}

export class TradeAgentMetric {
  label: string;
  value: number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
}

export class TradeAgentSuggestion {
  field: string;
  issue: string;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
}
