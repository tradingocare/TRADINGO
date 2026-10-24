import { IsOptional, IsString, IsInt, IsObject, Min, Max, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { VendorOnboardingDto } from '../../auth/dto/create-vendor.dto';

export class CreateRegistrationFormDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-z][a-z0-9_-]{2,40}$/, { message: 'Unknown plan. Please choose a plan from /plans.' })
  @ApiPropertyOptional({ description: 'Logical plan hint (validated, never authority)' })
  selectedPlanId?: string;
}

export class UpdateRegistrationFormDraftDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  @ApiPropertyOptional({ description: 'Wizard step (1-7)' })
  currentStep?: number;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z][a-z0-9_-]{2,40}$/, { message: 'Unknown plan. Please choose a plan from /plans.' })
  @ApiPropertyOptional({ description: 'Plan change (re-resolved + re-pinned server-side)' })
  selectedPlanId?: string;

  @IsOptional()
  @IsObject()
  @ApiPropertyOptional({ description: 'Step fields (denylist-sanitized before persist)' })
  fields?: Record<string, unknown>;

  @IsString()
  @ApiPropertyOptional({ description: 'Last-seen updatedAt for optimistic concurrency (ISO)' })
  clientUpdatedAt!: string;
}

// Submit body reuses the canonical onboarding contract (no duplicate DTO).
// CreateVendorDto.password IS inherited by this DTO — the contract therefore
// relies on the wizard stripping it before the R5B submit call (it does),
// and on vendorOnboarding never reading it (existing session). A future hard
// guarantee could exclude the field here; that is a contract change deferred
// to a dedicated phase.
export class SubmitRegistrationFormDto extends VendorOnboardingDto {}
