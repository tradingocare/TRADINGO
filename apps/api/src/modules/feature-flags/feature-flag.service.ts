import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export enum FeatureFlag {
  REFERRAL_UI = 'FEATURE_REFERRAL_UI',
  TRACKING = 'FEATURE_TRACKING',
  GA4 = 'FEATURE_GA4',
  PUBLIC_CRM = 'FEATURE_PUBLIC_CRM',
  LEAD_CAPTURE = 'FEATURE_LEAD_CAPTURE',
  SHARE_LINKS = 'FEATURE_SHARE_LINKS',
}

@Injectable()
export class FeatureFlagService {
  private readonly logger = new Logger(FeatureFlagService.name);

  constructor(private readonly configService: ConfigService) {}

  isEnabled(flag: FeatureFlag): boolean {
    const envValue = this.configService.get<string>(flag);
    return envValue === 'true' || envValue === '1';
  }

  getAll(): Record<FeatureFlag, boolean> {
    const result = {} as Record<FeatureFlag, boolean>;
    for (const flag of Object.values(FeatureFlag)) {
      result[flag] = this.isEnabled(flag);
    }
    return result;
  }

  requireEnabled(flag: FeatureFlag): void {
    if (!this.isEnabled(flag)) {
      this.logger.warn(`Feature flag ${flag} is disabled`);
    }
  }
}
