'use client';

import { useState, useCallback } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, Hash, Languages, FileText, Shield, Clock, Tag, Users, Wand2, Search, AlertOctagon, Link } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { TrackingEvent, buildTrackingPayload } from '@/lib/tracking/events';
import {
  useAiGeneratePost, useAiRewritePost, useAiImproveGrammar, useAiSummarizeContent,
  useAiTranslateContent, useAiSuggestHashtags, useAiSuggestTitle,
  useAiDetectSpam, useAiDetectDuplicates, useAiDetectOffensive,
  useAiDetectUnsafeLinks, useAiRecommendStatus,
  useAiSuggestPostingTime, useAiSuggestCategories, useAiSuggestCommunitiesForContent,
} from '@/hooks/use-tradetalk';

interface AiContentAssistantProps {
  content?: string;
  communityId?: string;
  onResult?: (action: string, result: unknown) => void;
}

type Tab = 'assist' | 'moderate' | 'insights';

export function AiContentAssistant({ content, communityId, onResult }: AiContentAssistantProps) {
  const [activeTab, setActiveTab] = useState<Tab>('assist');
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('');
  const [targetLang, setTargetLang] = useState('hindi');
  const [result, setResult] = useState<string | null>(null);

  const generatePost = useAiGeneratePost();
  const rewritePost = useAiRewritePost();
  const improveGrammar = useAiImproveGrammar();
  const summarize = useAiSummarizeContent();
  const translate = useAiTranslateContent();
  const suggestHashtags = useAiSuggestHashtags();
  const suggestTitle = useAiSuggestTitle();
  const detectSpam = useAiDetectSpam();
  const detectDuplicates = useAiDetectDuplicates();
  const detectOffensive = useAiDetectOffensive();
  const detectUnsafeLinks = useAiDetectUnsafeLinks();
  const recommendStatus = useAiRecommendStatus();
  const suggestPostingTime = useAiSuggestPostingTime();
  const suggestCategories = useAiSuggestCategories();
  const suggestCommunities = useAiSuggestCommunitiesForContent();

  const track = useCallback((event: string) => {
    fetch('/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildTrackingPayload(event as typeof TrackingEvent[keyof typeof TrackingEvent])),
    }).catch((err) => console.error('Tracking failed:', err));
  }, []);

  const getTrackingEvent = (action: string): string => {
    const map: Record<string, string> = {
      'generate-post': TrackingEvent.AI_POST_GENERATED,
      'rewrite-post': TrackingEvent.AI_POST_REWRITTEN,
      'improve-grammar': TrackingEvent.AI_POST_REWRITTEN,
      summarize: TrackingEvent.AI_POST_GENERATED,
      translate: TrackingEvent.AI_TRANSLATION_USED,
      'suggest-hashtags': TrackingEvent.AI_HASHTAGS_ACCEPTED,
      'suggest-title': TrackingEvent.AI_POST_GENERATED,
      'detect-spam': TrackingEvent.CONTENT_FLAGGED,
      'detect-duplicates': TrackingEvent.CONTENT_FLAGGED,
      'detect-offensive': TrackingEvent.CONTENT_FLAGGED,
      'detect-unsafe-links': TrackingEvent.CONTENT_FLAGGED,
      'recommend-status': TrackingEvent.CONTENT_FLAGGED,
      'suggest-posting-time': TrackingEvent.AI_POST_GENERATED,
      'suggest-categories': TrackingEvent.AI_POST_GENERATED,
      'suggest-communities': TrackingEvent.AI_POST_GENERATED,
    };
    return map[action] || TrackingEvent.AI_POST_GENERATED;
  };

  const handleAction = useCallback(async (action: string, apiCall: Promise<unknown>) => {
    try {
      const res = await apiCall;
      const text = (res as any)?.content || JSON.stringify(res);
      setResult(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
      onResult?.(action, res);
      toast({ title: `${action} completed` });
      track(getTrackingEvent(action));
    } catch (err: any) {
      toast({ title: `${action} failed`, description: err?.message, variant: 'destructive' });
    }
  }, [onResult, track]);

  const currentContent = content || topic;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-accent" /> AI Content Assistant
        </CardTitle>
        <div className="flex gap-1 border-b border-border pb-2">
          {(['assist', 'moderate', 'insights'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-t transition-colors ${
                activeTab === tab ? 'bg-accent/10 text-accent border-b-2 border-accent' : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {tab === 'assist' && <Wand2 className="h-3 w-3" />}
              {tab === 'moderate' && <Shield className="h-3 w-3" />}
              {tab === 'insights' && <Search className="h-3 w-3" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeTab === 'assist' && (
          <>
            <Input placeholder="Topic or keywords..." value={topic} onChange={(e) => setTopic(e.target.value)} className="text-sm" />
            <div className="flex gap-2">
              <Input placeholder="Tone (professional, casual, etc.)" value={tone} onChange={(e) => setTone(e.target.value)} className="text-sm flex-1" />
              <Input placeholder="Target language" value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="text-sm w-28" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <ActionButton icon={Sparkles} label="Generate" loading={generatePost.isPending} onClick={() => handleAction('generate-post', generatePost.mutateAsync({ topic, tone: tone || undefined }))} />
              <ActionButton icon={Wand2} label="Rewrite" loading={rewritePost.isPending} disabled={!currentContent} onClick={() => handleAction('rewrite-post', rewritePost.mutateAsync({ content: currentContent, style: tone || undefined }))} />
              <ActionButton icon={CheckCircle2} label="Grammar" loading={improveGrammar.isPending} disabled={!currentContent} onClick={() => handleAction('improve-grammar', improveGrammar.mutateAsync({ content: currentContent }))} />
              <ActionButton icon={FileText} label="Summarize" loading={summarize.isPending} disabled={!currentContent} onClick={() => handleAction('summarize', summarize.mutateAsync({ content: currentContent }))} />
              <ActionButton icon={Languages} label="Translate" loading={translate.isPending} disabled={!currentContent} onClick={() => handleAction('translate', translate.mutateAsync({ content: currentContent, targetLanguage: targetLang }))} />
              <ActionButton icon={Hash} label="Hashtags" loading={suggestHashtags.isPending} disabled={!currentContent} onClick={() => handleAction('suggest-hashtags', suggestHashtags.mutateAsync({ content: currentContent }))} />
              <ActionButton icon={Tag} label="Title" loading={suggestTitle.isPending} disabled={!currentContent} onClick={() => handleAction('suggest-title', suggestTitle.mutateAsync({ content: currentContent }))} />
            </div>
          </>
        )}

        {activeTab === 'moderate' && (
          <div className="flex flex-wrap gap-1.5">
            <ActionButton icon={AlertOctagon} label="Check Spam" loading={detectSpam.isPending} disabled={!currentContent} onClick={() => handleAction('detect-spam', detectSpam.mutateAsync({ content: currentContent, communityId }))} />
            <ActionButton icon={Search} label="Duplicates" loading={detectDuplicates.isPending} disabled={!currentContent} onClick={() => handleAction('detect-duplicates', detectDuplicates.mutateAsync({ content: currentContent, communityId }))} />
            <ActionButton icon={AlertTriangle} label="Offensive" loading={detectOffensive.isPending} disabled={!currentContent} onClick={() => handleAction('detect-offensive', detectOffensive.mutateAsync({ content: currentContent }))} />
            <ActionButton icon={Link} label="Unsafe Links" loading={detectUnsafeLinks.isPending} disabled={!currentContent} onClick={() => handleAction('detect-unsafe-links', detectUnsafeLinks.mutateAsync({ content: currentContent }))} />
            <ActionButton icon={Shield} label="Recommend Status" loading={recommendStatus.isPending} disabled={!currentContent} onClick={() => handleAction('recommend-status', recommendStatus.mutateAsync({ content: currentContent, communityId }))} />
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="flex flex-wrap gap-1.5">
            <ActionButton icon={Clock} label="Best Time" loading={suggestPostingTime.isPending} onClick={() => handleAction('suggest-posting-time', suggestPostingTime.mutateAsync({ communityId }))} />
            <ActionButton icon={Tag} label="Categories" loading={suggestCategories.isPending} disabled={!currentContent} onClick={() => handleAction('suggest-categories', suggestCategories.mutateAsync({ content: currentContent }))} />
            <ActionButton icon={Users} label="Communities" loading={suggestCommunities.isPending} disabled={!currentContent} onClick={() => handleAction('suggest-communities', suggestCommunities.mutateAsync({ content: currentContent }))} />
          </div>
        )}

        {result && (
          <div className="mt-3 rounded-lg border border-border bg-bg-elevated p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">Result</span>
              <Button variant="ghost" size="sm" className="h-5 px-2 text-xs" onClick={() => { setResult(null); }}>Clear</Button>
            </div>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-text-primary">{result}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActionButton({ icon: Icon, label, loading, disabled, onClick }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button size="sm" variant="outline" disabled={disabled || loading} onClick={onClick} className="h-7 gap-1 text-xs">
      {loading ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Icon className="h-3 w-3" />}
      {label}
    </Button>
  );
}
