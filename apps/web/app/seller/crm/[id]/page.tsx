'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardPageHeader } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLead, useUpdateLead, useDeleteLead, useConvertLead, useMarkLeadLost, useReassignLead, useRecalculateLeadScore } from '@/hooks/use-crm';
import { useFollowUps, useCreateFollowUp, useCompleteFollowUp } from '@/hooks/use-crm';
import { useNotes, useCreateNote, useDeleteNote, useTogglePinNote } from '@/hooks/use-crm';
import { useTasks, useCreateTask, useCompleteTask } from '@/hooks/use-crm';
import { useLeadTimeline } from '@/hooks/use-crm';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Edit3, Trash2, CheckCircle, XCircle, UserPlus, RefreshCw, Pin, PinOff, Plus, Calendar, Clock, Activity, Sparkles } from 'lucide-react';
import { AiCrmCopilot } from '@/components/crm/ai-crm-copilot';
import { useAiCrmScoring, useAiCrmNextBestAction, useAiCrmConversionProbability, useAiCrmInsights, useAiCrmSentiment, useAiCrmDealRisk, useAiCrmRecommendedActions, useAiCrmCommunicationTips } from '@/hooks/use-ai-crm';

const STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-blue-500/20 text-blue-400', CONTACTED: 'bg-yellow-500/20 text-yellow-400',
  QUALIFIED: 'bg-purple-500/20 text-purple-400', PROPOSAL: 'bg-indigo-500/20 text-indigo-400',
  NEGOTIATION: 'bg-orange-500/20 text-orange-400', WON: 'bg-green-500/20 text-green-400',
  LOST: 'bg-red-500/20 text-red-400', DISQUALIFIED: 'bg-gray-500/20 text-gray-400',
};

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const { data: lead, isLoading, error } = useLead(params.id);
  const { data: followUps } = useFollowUps(params.id);
  const { data: notes } = useNotes(params.id);
  const { data: tasks } = useTasks(params.id);
  const { data: timeline } = useLeadTimeline(params.id);
  const updateMutation = useUpdateLead();
  const deleteMutation = useDeleteLead();
  const convertMutation = useConvertLead();
  const markLostMutation = useMarkLeadLost();
  const reassignMutation = useReassignLead();
  const recalcMutation = useRecalculateLeadScore();
  const aiScoring = useAiCrmScoring();
  const aiNextBest = useAiCrmNextBestAction();
  const aiConvProb = useAiCrmConversionProbability();
  const aiInsights = useAiCrmInsights();
  const aiSentiment = useAiCrmSentiment();
  const aiDealRisk = useAiCrmDealRisk();
  const aiRecActions = useAiCrmRecommendedActions();
  const aiCommTips = useAiCrmCommunicationTips();
  const createFuMutation = useCreateFollowUp();
  const completeFuMutation = useCompleteFollowUp();
  const createNoteMutation = useCreateNote();
  const deleteNoteMutation = useDeleteNote();
  const togglePinMutation = useTogglePinNote();
  const createTaskMutation = useCreateTask();
  const completeTaskMutation = useCompleteTask();
  const router = useRouter();

  const [showAi, setShowAi] = useState(false);
  const [status, setStatus] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [fuTitle, setFuTitle] = useState('');
  const [fuDueDate, setFuDueDate] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [reassignId, setReassignId] = useState('');

  if (isLoading) return <div className="p-8 text-gray-400">Loading lead...</div>;
  if (error || !lead) return <div className="p-8 text-red-400">Lead not found</div>;

  const handleStatusChange = async (newStatus: string) => {
    setStatus('');
    try { await updateMutation.mutateAsync({ id: params.id, dto: { status: newStatus } }); toast({ title: `Lead ${newStatus.toLowerCase()}` }); } catch { toast({ title: 'Failed to update status', variant: 'destructive' }); }
  };

  const handleConvert = async () => {
    try { await convertMutation.mutateAsync({ id: params.id }); toast({ title: 'Lead converted to customer' }); } catch { toast({ title: 'Failed to convert', variant: 'destructive' }); }
  };

  const handleMarkLost = async () => {
    if (!lostReason) return;
    try { await markLostMutation.mutateAsync({ id: params.id, reason: lostReason }); toast({ title: 'Lead marked as lost' }); setLostReason(''); } catch { toast({ title: 'Failed', variant: 'destructive' }); }
  };

  const handleReassign = async () => {
    if (!reassignId) return;
    try { await reassignMutation.mutateAsync({ id: params.id, ownerId: reassignId }); toast({ title: 'Lead reassigned' }); setReassignId(''); } catch { toast({ title: 'Failed to reassign', variant: 'destructive' }); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this lead?')) return;
    try { await deleteMutation.mutateAsync(params.id); toast({ title: 'Lead deleted' }); router.push('/seller/crm'); } catch { toast({ title: 'Failed to delete', variant: 'destructive' }); }
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuTitle || !fuDueDate) return;
    try { await createFuMutation.mutateAsync({ leadId: params.id, dto: { leadId: params.id, title: fuTitle, dueDate: fuDueDate } }); toast({ title: 'Follow-up created' }); setFuTitle(''); setFuDueDate(''); } catch { toast({ title: 'Failed', variant: 'destructive' }); }
  };

  const handleCompleteFollowUp = async (id: string) => {
    try { await completeFuMutation.mutateAsync(id); toast({ title: 'Follow-up completed' }); } catch { toast({ title: 'Failed', variant: 'destructive' }); }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent) return;
    try { await createNoteMutation.mutateAsync({ leadId: params.id, dto: { content: noteContent } }); toast({ title: 'Note added' }); setNoteContent(''); } catch { toast({ title: 'Failed', variant: 'destructive' }); }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;
    try { await createTaskMutation.mutateAsync({ leadId: params.id, dto: { type: 'CALL', title: taskTitle } }); toast({ title: 'Task created' }); setTaskTitle(''); } catch { toast({ title: 'Failed', variant: 'destructive' }); }
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader title={lead.name} description={`${lead.status}${lead.company ? ` • ${lead.company.name}` : ''}`} actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAi(!showAi)} className={showAi ? 'border-orange-500/50 text-orange-400' : ''}><Sparkles className="mr-1 h-4 w-4" /> AI Copilot</Button>
          <Link href="/seller/crm"><Button variant="outline" size="sm"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button></Link>
          <Button variant="outline" size="sm" onClick={() => recalcMutation.mutate(params.id)} disabled={recalcMutation.isPending}><RefreshCw className="mr-1 h-4 w-4" /> Recalculate Score</Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="mr-1 h-4 w-4" /> Delete</Button>
        </div>
      } />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardHeader className="p-4 pb-2"><CardTitle className="text-xs text-gray-400">Score</CardTitle></CardHeader><CardContent className="p-4 pt-0 text-2xl font-bold">{lead.score || 0}</CardContent></Card>
            <Card><CardHeader className="p-4 pb-2"><CardTitle className="text-xs text-gray-400">Priority</CardTitle></CardHeader><CardContent className="p-4 pt-0 text-2xl font-bold">{lead.priority || '-'}</CardContent></Card>
            <Card><CardHeader className="p-4 pb-2"><CardTitle className="text-xs text-gray-400">Est. Value</CardTitle></CardHeader><CardContent className="p-4 pt-0 text-2xl font-bold">{lead.estimatedValue ? `₹${Number(lead.estimatedValue).toLocaleString()}` : '-'}</CardContent></Card>
            <Card><CardHeader className="p-4 pb-2"><CardTitle className="text-xs text-gray-400">Source</CardTitle></CardHeader><CardContent className="p-4 pt-0 text-2xl font-bold">{lead.source || '-'}</CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <select className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm" value={status} onChange={e => { setStatus(e.target.value); if (e.target.value) handleStatusChange(e.target.value); }}>
                <option value="">Change Status</option>
                {Object.keys(STATUS_STYLES).filter(s => s !== lead.status).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {lead.status !== 'WON' && <Button size="sm" onClick={handleConvert}><CheckCircle className="mr-1 h-4 w-4" /> Convert</Button>}
              {lead.status !== 'LOST' && (
                <div className="flex gap-2">
                  <Input placeholder="Lost reason" className="w-40" value={lostReason} onChange={e => setLostReason(e.target.value)} />
                  <Button size="sm" variant="outline" onClick={handleMarkLost}><XCircle className="mr-1 h-4 w-4" /> Mark Lost</Button>
                </div>
              )}
              <div className="flex gap-2">
                <Input placeholder="User ID" className="w-40" value={reassignId} onChange={e => setReassignId(e.target.value)} />
                <Button size="sm" variant="outline" onClick={handleReassign}><UserPlus className="mr-1 h-4 w-4" /> Reassign</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Follow-ups ({followUps?.length || 0})</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddFollowUp} className="flex gap-2"><Input placeholder="Title" className="flex-1" value={fuTitle} onChange={e => setFuTitle(e.target.value)} /><Input type="date" className="w-40" value={fuDueDate} onChange={e => setFuDueDate(e.target.value)} /><Button type="submit" size="sm"><Plus className="h-4 w-4" /></Button></form>
              {(!followUps || followUps.length === 0) ? <p className="text-sm text-gray-400">No follow-ups</p> : followUps.map((fu: any) => (
                <div key={fu.id} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <div><p className="text-sm font-medium">{fu.title}</p><p className="text-xs text-gray-400">Due: {new Date(fu.dueDate).toLocaleDateString()} • {fu.status}</p></div>
                  {fu.status === 'PENDING' && <Button size="sm" variant="ghost" onClick={() => handleCompleteFollowUp(fu.id)}><CheckCircle className="h-4 w-4 text-green-400" /></Button>}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Tasks ({tasks?.length || 0})</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddTask} className="flex gap-2"><Input placeholder="Task title" className="flex-1" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} /><Button type="submit" size="sm"><Plus className="h-4 w-4" /></Button></form>
              {(!tasks || tasks.length === 0) ? <p className="text-sm text-gray-400">No tasks</p> : tasks.map((t: any) => (
                <div key={t.id} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <div><p className="text-sm font-medium">{t.title}</p><p className="text-xs text-gray-400">{t.type} • {t.status}{t.dueDate ? ` • Due: ${new Date(t.dueDate).toLocaleDateString()}` : ''}</p></div>
                  {t.status === 'PENDING' && <Button size="sm" variant="ghost" onClick={() => completeTaskMutation.mutate(t.id)}><CheckCircle className="h-4 w-4 text-green-400" /></Button>}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Notes ({notes?.length || 0})</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddNote} className="space-y-2">
                <Textarea placeholder="Add a note..." value={noteContent} onChange={e => setNoteContent(e.target.value)} />
                <Button type="submit" size="sm"><Plus className="mr-1 h-4 w-4" /> Add Note</Button>
              </form>
              {(!notes || notes.length === 0) ? <p className="text-sm text-gray-400">No notes</p> : notes.map((n: any) => (
                <div key={n.id} className={`p-3 bg-gray-800/50 rounded-lg ${n.isPinned ? 'ring-1 ring-yellow-500/30' : ''}`}>
                  <div className="flex justify-between items-start">
                    <p className="text-sm whitespace-pre-wrap">{n.content}</p>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => togglePinMutation.mutate(n.id)}>{n.isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}</Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteNoteMutation.mutate(n.id)}><Trash2 className="h-3 w-3 text-red-400" /></Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}{n.mentions?.length ? ` • Mentions: ${n.mentions.join(', ')}` : ''}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className={`space-y-6 ${showAi ? 'hidden lg:block' : ''}`}>
          {showAi && (
            <Card>
              <CardContent className="p-4">
                <AiCrmCopilot leadId={params.id} leadData={{ name: lead.name, status: lead.status, score: lead.score, priority: lead.priority, estimatedValue: lead.estimatedValue, source: lead.source, stage: lead.stage, company: lead.company }}
                  isGenerating={aiScoring.isPending || aiNextBest.isPending || aiInsights.isPending || aiSentiment.isPending || aiDealRisk.isPending || aiRecActions.isPending || aiCommTips.isPending}
                  onScoring={data => aiScoring.mutateAsync({ leadId: params.id, data }).then(r => { toast({ title: 'AI Scoring complete' }); return r })} onNextBestAction={data => aiNextBest.mutateAsync({ leadId: params.id, data }).then(r => { toast({ title: 'AI recommendation ready' }); return r })}
                  onConversionProbability={data => aiConvProb.mutateAsync({ leadId: params.id, data }).then(r => { toast({ title: 'Conversion probability calculated' }); return r })} onInsights={data => aiInsights.mutateAsync({ leadId: params.id, data }).then(r => { toast({ title: 'AI insights ready' }); return r })}
                  onSentiment={data => aiSentiment.mutateAsync({ leadId: params.id, data }).then(r => { toast({ title: 'Sentiment analysis done' }); return r })}
                  onDealRisk={data => aiDealRisk.mutateAsync({ leadId: params.id, data }).then(r => { toast({ title: 'Risk assessment ready' }); return r })}
                  onRecommendedActions={data => aiRecActions.mutateAsync({ leadId: params.id, data }).then(r => { toast({ title: 'AI recommendations ready' }); return r })}
                  onCommunicationTips={data => aiCommTips.mutateAsync({ leadId: params.id, data }).then(r => { toast({ title: 'AI tips ready' }); return r })} />
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
              {(!timeline || timeline.length === 0) ? <p className="text-sm text-gray-400">No events</p> : timeline.map((ev: any) => (
                <div key={ev.id} className="flex gap-3 text-sm">
                  <Activity className="h-4 w-4 mt-0.5 text-gray-500 shrink-0" />
                  <div><p>{ev.description}</p><p className="text-xs text-gray-500">{new Date(ev.createdAt).toLocaleString()}</p></div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="text-gray-400">Email:</span><p>{lead.email || '-'}</p></div>
              <div><span className="text-gray-400">Mobile:</span><p>{lead.mobile || '-'}</p></div>
              <div><span className="text-gray-400">Owner:</span><p>{lead.owner?.name || '-'}</p></div>
              <div><span className="text-gray-400">Stage:</span><p>{lead.stage?.name || '-'}</p></div>
              <div><span className="text-gray-400">Created:</span><p>{new Date(lead.createdAt).toLocaleDateString()}</p></div>
              {lead.convertedAt && <div><span className="text-gray-400">Converted:</span><p>{new Date(lead.convertedAt).toLocaleDateString()}</p></div>}
              {lead.description && <div><span className="text-gray-400">Description:</span><p className="text-xs">{lead.description}</p></div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
