'use client';

import { cn } from '@/lib/utils';
import { Trophy, Medal, Award } from 'lucide-react';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

interface LeaderboardEntry {
  rank: number;
  entityId?: string;
  entityName?: string;
  score: number;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

const rankBadge = (rank: number) => {
  if (rank === 1) return <Trophy className="h-3.5 w-3.5 text-yellow-400" />;
  if (rank === 2) return <Medal className="h-3.5 w-3.5 text-text-tertiary" />;
  if (rank === 3) return <Award className="h-3.5 w-3.5 text-accent-500" />;
  return null;
};

export function LeaderboardTable({ entries, currentUserId }: LeaderboardTableProps) {
  if (!entries?.length) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <Trophy className="mb-2 h-8 w-8 text-text-tertiary" />
        <p className="text-sm text-text-tertiary">No leaderboard data yet</p>
      </div>
    );
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>Rank</TH>
          <TH>Name</TH>
          <TH className="text-right">Score</TH>
        </TR>
      </THead>
      <TBody>
        {entries.map((entry) => (
          <TR
            key={`${entry.rank}-${entry.entityId}`}
            className={cn(
              entry.entityId === currentUserId && 'bg-accent-500/5',
            )}
          >
            <TD>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                  entry.rank <= 3 ? 'bg-accent-500/10 text-accent-500' : 'text-text-tertiary',
                )}>
                  {rankBadge(entry.rank) || entry.rank}
                </span>
              </div>
            </TD>
            <TD>
              <span className={cn(
                'font-medium',
                entry.entityId === currentUserId ? 'text-accent-500' : 'text-text-primary',
              )}>
                {entry.entityName || 'Unknown'}
              </span>
              {entry.entityId === currentUserId && (
                <span className="ml-2 rounded bg-accent-500/10 px-1.5 py-0.5 text-[10px] text-accent-500">You</span>
              )}
            </TD>
            <TD className="text-right font-medium">{entry.score.toLocaleString()} XP</TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
