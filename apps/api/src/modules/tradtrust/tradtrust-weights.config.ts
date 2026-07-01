import { Injectable } from '@nestjs/common';

export interface TradTrustWeights {
  verificationLevel: number;
  profileCompletion: number;
  companyAge: number;
  activeStatus: number;
  certifications: number;
  onboarding: number;
  orderCompletion: number;
  deliveryPerformance: number;
  rfqQuality: number;
  quoteSuccess: number;
  negotiationSuccess: number;
  financialHealth: number;
  reputationEvents: number;
  marketplaceRank: number;
  fraudPenalty: number;
  disputePenalty: number;
}

export interface TrustGradeConfig {
  aPlus: number;
  a: number;
  bPlus: number;
  b: number;
  c: number;
}

export interface RiskLevelConfig {
  low: number;
  medium: number;
  high: number;
}

@Injectable()
export class TradTrustWeightsService {
  readonly weights: TradTrustWeights = {
    verificationLevel: 120,
    profileCompletion: 80,
    companyAge: 60,
    activeStatus: 50,
    certifications: 40,
    onboarding: 50,
    orderCompletion: 180,
    deliveryPerformance: 120,
    rfqQuality: 80,
    quoteSuccess: 70,
    negotiationSuccess: 60,
    financialHealth: 60,
    reputationEvents: 50,
    marketplaceRank: 60,
    fraudPenalty: 100,
    disputePenalty: 80,
  };

  readonly gradeThresholds: TrustGradeConfig = {
    aPlus: 900,
    a: 750,
    bPlus: 600,
    b: 450,
    c: 250,
  };

  readonly riskThresholds: RiskLevelConfig = {
    low: 600,
    medium: 300,
    high: 100,
  };

  readonly maxScore = 1000;

  getGrade(score: number): string {
    if (score >= this.gradeThresholds.aPlus) return 'A+';
    if (score >= this.gradeThresholds.a) return 'A';
    if (score >= this.gradeThresholds.bPlus) return 'B+';
    if (score >= this.gradeThresholds.b) return 'B';
    if (score >= this.gradeThresholds.c) return 'C';
    return 'D';
  }

  getRiskLevel(score: number): string {
    if (score >= this.riskThresholds.low) return 'Low';
    if (score >= this.riskThresholds.medium) return 'Medium';
    if (score >= this.riskThresholds.high) return 'High';
    return 'Critical';
  }

  getMaxBehavioralWeight(): number {
    return (
      this.weights.orderCompletion +
      this.weights.deliveryPerformance +
      this.weights.rfqQuality +
      this.weights.quoteSuccess +
      this.weights.negotiationSuccess +
      this.weights.financialHealth +
      this.weights.reputationEvents +
      this.weights.marketplaceRank
    );
  }

  getMaxProfileWeight(): number {
    return (
      this.weights.verificationLevel +
      this.weights.profileCompletion +
      this.weights.companyAge +
      this.weights.activeStatus +
      this.weights.certifications +
      this.weights.onboarding
    );
  }

  getMaxPositiveWeight(): number {
    return this.getMaxProfileWeight() + this.getMaxBehavioralWeight();
  }
}
