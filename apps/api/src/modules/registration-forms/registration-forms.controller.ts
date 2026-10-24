import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RegistrationFormsService } from './registration-forms.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RateLimits } from '../../common/constants/rate-limits.const';
import {
  CreateRegistrationFormDto,
  SubmitRegistrationFormDto,
  UpdateRegistrationFormDraftDto,
} from './dto/registration-form.dto';

@ApiTags('Registration Forms')
@Controller('registration/forms')
@UseGuards(JwtAuthGuard)
export class RegistrationFormsController {
  constructor(private readonly registrationForms: RegistrationFormsService) {}

  @Post()
  @ApiOperation({ summary: 'Open (or resume) my seller registration draft' })
  @Throttle(RateLimits.WRITE_GENERAL)
  async create(@CurrentUser('sub') userId: string, @Body() dto: CreateRegistrationFormDto) {
    return this.registrationForms.create(userId, dto);
  }

  @Get(':formId')
  @ApiOperation({ summary: 'Read my registration form (owner only)' })
  async getByFormId(@CurrentUser('sub') userId: string, @Param('formId') formId: string) {
    return this.registrationForms.getByFormId(userId, formId);
  }

  @Patch(':formId/draft')
  @ApiOperation({ summary: 'Save draft fields (optimistic concurrency)' })
  @Throttle(RateLimits.WRITE_GENERAL)
  async updateDraft(
    @CurrentUser('sub') userId: string,
    @Param('formId') formId: string,
    @Body() dto: UpdateRegistrationFormDraftDto,
  ) {
    return this.registrationForms.updateDraft(userId, formId, dto);
  }

  @Post(':formId/submit')
  @ApiOperation({ summary: 'Submit the form (delegates to canonical seller onboarding)' })
  @Throttle(RateLimits.AUTH_REGISTER)
  async submit(
    @CurrentUser('sub') userId: string,
    @Param('formId') formId: string,
    @Body() dto: SubmitRegistrationFormDto,
  ) {
    return this.registrationForms.submit(userId, formId, dto);
  }
}
