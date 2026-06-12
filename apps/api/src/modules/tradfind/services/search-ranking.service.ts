import { Injectable } from '@nestjs/common';
import {
  SEARCH_RANKING_RELEVANCE_WEIGHT,
  SEARCH_RANKING_DISTANCE_WEIGHT,
  SEARCH_RANKING_TRUST_WEIGHT,
  SEARCH_RANKING_VERIFICATION_WEIGHT,
  SEARCH_RANKING_FRESHNESS_WEIGHT,
} from '../enums/search.enums';
import { SearchRankingScore } from '../interfaces/search-types';

interface RankingInput {
  relevanceScore: number;
  distance?: number;
  maxDistance?: number;
  trustScore: number;
  verificationLevel: string;
  createdAt: Date;
}

const VERIFICATION_SCORES: Record<string, number> = {
  LEVEL_6: 100,
  LEVEL_5: 85,
  LEVEL_4: 70,
  LEVEL_3: 55,
  LEVEL_2: 40,
  LEVEL_1: 20,
  LEVEL_0: 0,
};

@Injectable()
export class SearchRankingService {
  calculateScore(input: RankingInput): SearchRankingScore {
    const relevanceScore = input.relevanceScore;
    const distanceScore = this.calculateDistanceScore(input.distance, input.maxDistance);
    const trustScore = input.trustScore / 100;
    const verificationScore = this.calculateVerificationScore(input.verificationLevel);
    const freshnessScore = this.calculateFreshnessScore(input.createdAt);

    const totalScore =
      relevanceScore * SEARCH_RANKING_RELEVANCE_WEIGHT +
      distanceScore * SEARCH_RANKING_DISTANCE_WEIGHT +
      trustScore * SEARCH_RANKING_TRUST_WEIGHT +
      verificationScore * SEARCH_RANKING_VERIFICATION_WEIGHT +
      freshnessScore * SEARCH_RANKING_FRESHNESS_WEIGHT;

    return {
      relevanceScore,
      distanceScore,
      trustScore,
      verificationScore,
      freshnessScore,
      totalScore: Math.round(totalScore * 100) / 100,
    };
  }

  private calculateDistanceScore(distance?: number, maxDistance?: number): number {
    if (distance === undefined || distance === null || !maxDistance || maxDistance <= 0) {
      return 0.5;
    }
    return Math.max(0, 1 - distance / maxDistance);
  }

  private calculateVerificationScore(level: string): number {
    return (VERIFICATION_SCORES[level] ?? VERIFICATION_SCORES.LEVEL_0) / 100;
  }

  private calculateFreshnessScore(createdAt: Date): number {
    const now = Date.now();
    const created = createdAt.getTime();
    const ageInDays = (now - created) / (1000 * 60 * 60 * 24);
    if (ageInDays <= 7) return 1.0;
    if (ageInDays <= 30) return 0.9;
    if (ageInDays <= 90) return 0.7;
    if (ageInDays <= 180) return 0.5;
    if (ageInDays <= 365) return 0.3;
    return 0.1;
  }
}
