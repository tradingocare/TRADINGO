'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { BugReportForm } from './bug-report-form';
import { FeatureRequestForm } from './feature-request-form';
import { NpsSurvey } from './nps-survey';
import { MessageSquare, Bug, Lightbulb, Star, X } from 'lucide-react';

type Tab = 'bug' | 'feature' | 'nps';

const tabs: { id: Tab; label: string; icon: typeof Bug }[] = [
  { id: 'bug', label: 'Bug Report', icon: Bug },
  { id: 'feature', label: 'Feature Request', icon: Lightbulb },
  { id: 'nps', label: 'NPS Survey', icon: Star },
];

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('bug');
  const { toast } = useToast();

  const submitFeedback = async (type: string, data: any) => {
    try {
      const res = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...data }),
      });
      if (!res.ok) throw new Error('Failed to submit');
      toast({ title: 'Thank you!', description: 'Your feedback has been submitted successfully.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to submit feedback. Please try again.', variant: 'destructive' });
    }
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setOpen(false)} />
      )}
      <div className="fixed bottom-6 right-6 z-50">
        {open ? (
          <Card className="w-80 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold">Beta Feedback</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex border-b border-border dark:border-dark-border">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1 px-3 py-2 text-xs font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              {activeTab === 'bug' && <BugReportForm onSubmit={(d) => submitFeedback('bug', d)} />}
              {activeTab === 'feature' && <FeatureRequestForm onSubmit={(d) => submitFeedback('feature', d)} />}
              {activeTab === 'nps' && <NpsSurvey onSubmit={(s, c) => submitFeedback('nps', { score: s, comment: c })} />}
            </CardContent>
          </Card>
        ) : (
          <Button
            onClick={() => setOpen(true)}
            className="h-12 w-12 rounded-full shadow-lg"
            size="icon"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
        )}
      </div>
    </>
  );
}
