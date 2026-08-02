'use client';

import { useState } from 'react';
import { Sparkles, X, Bot, Lightbulb, Users, MessageSquare, BarChart3, Network, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAiCommunityCopilot, useAiCommunitySummary, useAiSuggestedMembers, useAiNetworkingSuggestions, useAiDiscussionIdeas, useAiCommunityInsights } from '@/hooks/use-ai-tradetalk';

interface AiCommunityCopilotProps {
  communityId: string;
  communityName: string;
}

type CopilotTab = 'summary' | 'members' | 'network' | 'discussions' | 'insights';

const TAB_CONFIG: Record<CopilotTab, { label: string; icon: React.ReactNode; description: string }> = {
  summary: { label: 'Summary', icon: <Bot className="h-4 w-4" />, description: 'AI overview of this community' },
  members: { label: 'Members', icon: <Users className="h-4 w-4" />, description: 'Suggested connections' },
  network: { label: 'Network', icon: <Network className="h-4 w-4" />, description: 'Who to connect with' },
  discussions: { label: 'Ideas', icon: <Lightbulb className="h-4 w-4" />, description: 'Future discussion topics' },
  insights: { label: 'Insights', icon: <BarChart3 className="h-4 w-4" />, description: 'Growth & opportunities' },
};

function formatContent(content: unknown): string {
  if (typeof content === 'string') return content;
  if (content && typeof content === 'object') {
    const obj = content as Record<string, unknown>;
    if (obj.text) return String(obj.text);
    if (obj.summary) return String(obj.summary);
    if (obj.analysis) return String(obj.analysis);
    if (obj.recommendations) {
      const recs = obj.recommendations as string[];
      return Array.isArray(recs) ? recs.map((r, i) => `${i + 1}. ${r}`).join('\n') : String(obj.recommendations);
    }
    if (obj.suggestions) {
      const sug = obj.suggestions as string[];
      return Array.isArray(sug) ? sug.map((s, i) => `${i + 1}. ${s}`).join('\n') : String(obj.suggestions);
    }
    return JSON.stringify(content, null, 2);
  }
  return String(content || 'No content available');
}

export function AiCommunityCopilot({ communityId, communityName }: AiCommunityCopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<CopilotTab>('summary');
  const [result, setResult] = useState<string | null>(null);
  const [loadingTab, setLoadingTab] = useState<CopilotTab | null>(null);

  const copilotMutation = useAiCommunityCopilot();
  const summaryMutation = useAiCommunitySummary();
  const membersMutation = useAiSuggestedMembers();
  const networkMutation = useAiNetworkingSuggestions();
  const discussionsMutation = useAiDiscussionIdeas();
  const insightsMutation = useAiCommunityInsights();

  const handleAction = async (tab: CopilotTab) => {
    setActiveTab(tab);
    setLoadingTab(tab);
    setResult(null);
    try {
      let res;
      switch (tab) {
        case 'summary':
          res = await summaryMutation.mutateAsync({ communityId });
          break;
        case 'members':
          res = await membersMutation.mutateAsync({ communityId, limit: 5 });
          break;
        case 'network':
          res = await networkMutation.mutateAsync({ communityId, limit: 5 });
          break;
        case 'discussions':
          res = await discussionsMutation.mutateAsync({ communityId, limit: 5 });
          break;
        case 'insights':
          res = await insightsMutation.mutateAsync({ communityId });
          break;
      }
      setResult(formatContent(res?.data?.content));
    } catch {
      setResult('Unable to generate AI analysis at this time. Please try again later.');
    } finally {
      setLoadingTab(null);
    }
  };

  const anyLoading = loadingTab !== null;

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => { setIsOpen(true); handleAction('summary'); }}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
          size="icon"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-96 shadow-2xl border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-accent" />
              AI Copilot — {communityName}
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="mb-3 flex flex-wrap gap-1">
              {(Object.entries(TAB_CONFIG) as [CopilotTab, typeof TAB_CONFIG[CopilotTab]][]).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => handleAction(key)}
                  disabled={anyLoading && loadingTab !== key}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    activeTab === key
                      ? 'bg-accent text-white'
                      : 'bg-bg-elevated text-text-secondary hover:bg-accent/10 hover:text-text-primary'
                  } ${anyLoading && loadingTab !== key ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loadingTab === key ? <Loader2 className="h-3 w-3 animate-spin" /> : config.icon}
                  {config.label}
                </button>
              ))}
            </div>

            <div className="min-h-[200px] rounded-lg border border-border bg-bg-elevated p-3">
              {loadingTab ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-accent" />
                    <p className="text-xs text-text-tertiary">{TAB_CONFIG[activeTab].description}...</p>
                  </div>
                </div>
              ) : result ? (
                <div className="prose prose-invert max-w-none text-sm text-text-secondary">
                  {result.split('\n').map((line, i) => {
                    if (line.startsWith('#')) return <h4 key={i} className="mt-3 mb-1 text-sm font-semibold text-text-primary">{line.replace(/^#+\s*/, '')}</h4>;
                    if (line.match(/^\d+\.\s/)) return <p key={i} className="ml-2 flex items-start gap-1 text-xs"><ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-accent" />{line.replace(/^\d+\.\s*/, '')}</p>;
                    if (line.startsWith('- ')) return <p key={i} className="ml-2 text-xs text-text-secondary">{line}</p>;
                    if (line.trim()) return <p key={i} className="text-xs leading-relaxed">{line}</p>;
                    return <div key={i} className="h-1" />;
                  })}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-xs text-text-tertiary">Select a tab to generate AI insights</p>
                </div>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2 text-[10px] text-text-tertiary">
              <Badge variant="outline" className="text-[8px]">AI</Badge>
              <span>Powered by TRADINGO AI Gateway</span>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
