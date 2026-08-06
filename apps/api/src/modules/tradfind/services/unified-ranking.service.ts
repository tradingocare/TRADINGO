import { Injectable } from '@nestjs/common';

export interface UnifiedRankingScore {
  relevanceScore: number;
  distanceScore: number;
  trustScore: number;
  verificationScore: number;
  freshnessScore: number;
  qualityScore: number;
  membershipBoost: number;
  totalScore: number;
}

export type RankingProfile = 'tradfind' | 'enterprise' | 'nearme' | 'buyer-recs';

interface RankingWeights {
  relevance: number;
  distance: number;
  trust: number;
  verification: number;
  freshness: number;
  quality: number;
  membership: number;
}

const PROFILE_WEIGHTS: Record<RankingProfile, RankingWeights> = {
  tradfind: { relevance: 0.35, distance: 0.10, trust: 0.20, verification: 0.10, freshness: 0.10, quality: 0.10, membership: 0.05 },
  enterprise: { relevance: 0.40, distance: 0.00, trust: 0.05, verification: 0.10, freshness: 0.05, quality: 0.20, membership: 0.20 },
  nearme: { relevance: 0.10, distance: 0.40, trust: 0.20, verification: 0.10, freshness: 0.05, quality: 0.10, membership: 0.05 },
  'buyer-recs': { relevance: 0.25, distance: 0.05, trust: 0.15, verification: 0.10, freshness: 0.10, quality: 0.15, membership: 0.20 },
};

const VERIFICATION_SCORES: Record<string, number> = {
  LEVEL_6: 100, LEVEL_5: 85, LEVEL_4: 70, LEVEL_3: 55, LEVEL_2: 40, LEVEL_1: 20, LEVEL_0: 0,
};

const PLAN_BOOST: Record<string, number> = {
  TRADE_ELITE: 1.30, TRADE_PREMIUM: 1.20, TRADE_PRO: 1.15, TRADE_PLUS: 1.10, TRADE_SMART: 1.05,
};

@Injectable()
export class UnifiedRankingService {
  computeScore(params: {
    relevanceScore: number;
    distance?: number;
    maxDistance?: number;
    trustScore: number;
    verificationLevel: string;
    createdAt: Date;
    qualityScore?: number;
    membershipPlan?: string;
    profile?: RankingProfile;
  }): UnifiedRankingScore {
    const profile = params.profile || 'tradfind';
    const weights = PROFILE_WEIGHTS[profile];

    const relevanceScore = params.relevanceScore;
    const distanceScore = this.normalizeDistance(params.distance, params.maxDistance);
    const trustScore = params.trustScore / 100;
    const verificationScore = (VERIFICATION_SCORES[params.verificationLevel] ?? 0) / 100;
    const freshnessScore = this.calcFreshness(params.createdAt);
    const qualityScore = Math.min(1, (params.qualityScore ?? 0) / 100);
    const membershipBoost = params.membershipPlan ? (PLAN_BOOST[params.membershipPlan] ?? 1.0) : 1.0;

    const baseScore =
      relevanceScore * weights.relevance +
      distanceScore * weights.distance +
      trustScore * weights.trust +
      verificationScore * weights.verification +
      freshnessScore * weights.freshness +
      qualityScore * weights.quality;

    const totalScore = baseScore * membershipBoost * (1 + weights.membership * (membershipBoost - 1));

    return {
      relevanceScore, distanceScore, trustScore, verificationScore, freshnessScore,
      qualityScore, membershipBoost,
      totalScore: Math.round(totalScore * 10000) / 10000,
    };
  }

  reorderByScore<T extends Record<string, unknown>>(hits: T[], getScore: (hit: T) => UnifiedRankingScore): T[] {
    return [...hits].sort((a, b) => {
      const sa = getScore(a);
      const sb = getScore(b);
      return sb.totalScore - sa.totalScore;
    });
  }

  private normalizeDistance(distance?: number, maxDistance?: number): number {
    if (distance === undefined || distance === null || !maxDistance || maxDistance <= 0) return 0.5;
    return Math.max(0, 1 - distance / maxDistance);
  }

  private calcFreshness(createdAt: Date): number {
    const ageInDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays <= 7) return 1.0;
    if (ageInDays <= 30) return 0.9;
    if (ageInDays <= 90) return 0.7;
    if (ageInDays <= 180) return 0.5;
    if (ageInDays <= 365) return 0.3;
    return 0.1;
  }
}
