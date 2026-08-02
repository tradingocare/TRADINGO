import { Injectable, Logger } from '@nestjs/common';

export interface RankableResult {
  id: string;
  name: string;
  entityType: string;
  score: number;
  matchType: 'exact' | 'synonym' | 'fuzzy' | 'prefix' | 'partial';
  verificationLevel?: string;
  popularity?: number;
  categoryQuality?: number;
  aiRelevance?: number;
  tradTrustScore?: number;
  isActive?: boolean;
  createdAt?: Date;
  [key: string]: unknown;
}

export interface RankingWeights {
  exactMatch: number;
  synonymMatch: number;
  popularity: number;
  verification: number;
  categoryQuality: number;
  aiRelevance: number;
  tradTrust: number;
  freshness: number;
}

const DEFAULT_WEIGHTS: RankingWeights = {
  exactMatch: 40,
  synonymMatch: 25,
  popularity: 10,
  verification: 10,
  categoryQuality: 5,
  aiRelevance: 5,
  tradTrust: 3,
  freshness: 2,
};

@Injectable()
export class EnterpriseRankingService {
  private readonly logger = new Logger(EnterpriseRankingService.name);

  rankResults(results: RankableResult[], weights?: Partial<RankingWeights>): RankableResult[] {
    const w = { ...DEFAULT_WEIGHTS, ...weights };
    return results
      .map(r => ({
        ...r,
        score: this.calculateScore(r, w),
      }))
      .sort((a, b) => b.score - a.score);
  }

  private calculateScore(result: RankableResult, w: RankingWeights): number {
    let score = 0;

    const matchScores: Record<string, number> = {
      exact: 1.0, synonym: 0.85, fuzzy: 0.65, prefix: 0.5, partial: 0.3,
    };
    score += (matchScores[result.matchType] ?? 0.3) * w.exactMatch;

    if (result.popularity !== undefined) {
      const normPop = Math.min(result.popularity / 1000, 1);
      score += normPop * w.popularity;
    }

    if (result.verificationLevel) {
      const vScores: Record<string, number> = {
        VERIFIED: 1.0, PENDING: 0.5, UNVERIFIED: 0.2, REJECTED: 0,
      };
      score += (vScores[result.verificationLevel] ?? 0.2) * w.verification;
    }

    if (result.categoryQuality !== undefined) {
      score += Math.min(result.categoryQuality / 100, 1) * w.categoryQuality;
    }

    if (result.aiRelevance !== undefined) {
      score += Math.min(result.aiRelevance, 1) * w.aiRelevance;
    }

    if (result.tradTrustScore !== undefined) {
      score += Math.min(result.tradTrustScore / 100, 1) * w.tradTrust;
    }

    if (result.createdAt) {
      const ageDays = (Date.now() - result.createdAt.getTime()) / 86400000;
      if (ageDays <= 30) score += w.freshness;
      else if (ageDays <= 90) score += w.freshness * 0.7;
      else if (ageDays <= 180) score += w.freshness * 0.4;
      else score += w.freshness * 0.1;
    }

    return Math.round(score * 100) / 100;
  }

  applyBoost(results: RankableResult[], boostedIds: string[], boostFactor: number = 1.5): RankableResult[] {
    return results.map(r => {
      if (boostedIds.includes(r.id)) {
        return { ...r, score: r.score * boostFactor };
      }
      return r;
    }).sort((a, b) => b.score - a.score);
  }
}
