import {
  BadRequestException,
  ConflictException,
  GoneException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Prisma, RegistrationFormStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { MembershipService } from '../membership/membership.service';
import { CreateVendorDto } from '../auth/dto/create-vendor.dto';
import {
  CreateRegistrationFormDto,
  SubmitRegistrationFormDto,
  UpdateRegistrationFormDraftDto,
} from './dto/registration-form.dto';

// D-REG-02: TRF-YYMMDD-XXXXX-XXXXX — Crockford base32 (no I/L/O/U),
// 10 chars from randomBytes(8) ≈ 50-bit entropy. Date prefix is a
// support-routing aid, not a sequence (sequential IDs leak volume).
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

// D-REG-01 §4 / P1-11 doctrine: NEVER persist these key names anywhere in
// draftPayload (recursive, case-insensitive). Passwords, OTPs, auth/session
// tokens, gateway secrets, payment/invoice authority, computed money.
const NEVER_KEYS = new Set([
  'password', 'confirmpassword', 'otp', 'verificationtoken', 'resettoken',
  'accesstoken', 'refreshtoken', 'sessiontoken', 'secret', 'clientsecret',
  'apikey', 'apisecret', 'webhooksecret', 'signature', 'cardnumber', 'cvv',
  'upipin', 'invoicenumber', 'paymentsuccess', 'computedprice', 'computedtax',
  'totalamount',
]);

// AVOID (omit chosen): identity/bank fields the Company record already
// canonically stores — the form references, never re-stores. Submit carries
// them transiently in the onboarding DTO instead.
const AVOID_KEYS = new Set([
  'pannumber', 'panholdername', 'dateofbirth', 'gstnumber', 'gstexemptreason',
  'accountnumber', 'ifsccode', 'accountholdername', 'accounttype',
  'bankaccount', 'mobilenumber', 'alternatemobile',
]);

function stripSensitiveKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripSensitiveKeys);
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const key = k.toLowerCase();
      if (NEVER_KEYS.has(key) || AVOID_KEYS.has(key)) continue;
      out[k] = stripSensitiveKeys(v);
    }
    return out;
  }
  return value;
}

@Injectable()
export class RegistrationFormsService {
  private readonly logger = new Logger(RegistrationFormsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly membershipService: MembershipService,
  ) {}

  // ── Form ID (D-REG-02) ──────────────────────────────────────────────
  private async allocateFormId(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const rand = randomBytes(8);
      let code = '';
      let acc = 0;
      let bits = 0;
      for (const byte of rand) {
        acc = (acc << 8) | byte;
        bits += 8;
        while (bits >= 5 && code.length < 10) {
          bits -= 5;
          code += CROCKFORD[(acc >>> bits) & 31];
        }
      }
      const now = new Date();
      const stamp =
        String(now.getFullYear()).slice(2) +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0');
      const formId = `TRF-${stamp}-${code.slice(0, 5)}-${code.slice(5, 10)}`;
      const exists = await this.prisma.sellerRegistrationForm.findUnique({
        where: { formId },
        select: { id: true },
      });
      if (!exists) return formId;
    }
    throw new ServiceUnavailableException('Could not allocate a form reference. Please try again.');
  }

  // ── Plan resolution (hint in, never authority out) ──────────────────
  private async resolvePlan(planId: string): Promise<{ planId: string; versionId: string | null }> {
    const plan = await this.prisma.membershipPlan.findUnique({ where: { planId } });
    if (!plan) {
      throw new BadRequestException(`Unknown plan "${planId}". Please choose a plan from /plans.`);
    }
    if (!plan.isActive || (plan.visibility !== 'PUBLIC' && (plan.visibility as string) !== 'LAUNCH')) {
      throw new BadRequestException('Plan is not available for new enrollment');
    }
    let versionId: string | null = null;
    try {
      const version = await this.membershipService.getActivePlanVersion(planId);
      versionId = version?.id ?? null;
    } catch {
      versionId = null;
    }
    return { planId, versionId };
  }

  private completionFor(step: number, status: RegistrationFormStatus): number {
    if (status !== RegistrationFormStatus.DRAFT) return 100;
    return Math.min(99, Math.round((Math.max(1, step) / 7) * 100));
  }

  private toView(form: {
    formId: string;
    status: RegistrationFormStatus;
    currentStep: number;
    completionPct: number;
    selectedPlanId: string | null;
    selectedPlanVersionId: string | null;
    companyId: string | null;
    submittedAt: Date | null;
    draftPayload: unknown;
    updatedAt: Date;
  }) {
    return {
      formId: form.formId,
      status: form.status,
      currentStep: form.currentStep,
      completionPct: form.completionPct,
      selectedPlanId: form.selectedPlanId,
      selectedPlanVersionId: form.selectedPlanVersionId,
      companyId: form.companyId,
      submittedAt: form.submittedAt,
      draftPayload: form.draftPayload,
      updatedAt: form.updatedAt,
    };
  }

  private async audit(userId: string, action: string, formId: string, step?: number) {
    // Metadata carries references only — never payload contents.
    await this.prisma.auditLog.create({
      data: { userId, action, resource: `registration-form:${formId}`, metadata: step !== undefined ? { step } : {} },
    });
  }

  // ── Create (idempotent: one live DRAFT per user) ────────────────────
  async create(userId: string, dto: CreateRegistrationFormDto) {
    const live = await this.prisma.sellerRegistrationForm.findFirst({
      where: { userId, status: RegistrationFormStatus.DRAFT },
      orderBy: { updatedAt: 'desc' },
    });
    if (live) {
      this.logger.log(`Registration form resumed for user: ${userId}`);
      return { created: false, form: this.toView(live) };
    }

    let selectedPlanId: string | null = null;
    let selectedPlanVersionId: string | null = null;
    if (dto.selectedPlanId) {
      const resolved = await this.resolvePlan(dto.selectedPlanId);
      selectedPlanId = resolved.planId;
      selectedPlanVersionId = resolved.versionId;
    }

    const formId = await this.allocateFormId();
    try {
      const form = await this.prisma.sellerRegistrationForm.create({
        data: {
          formId,
          userId,
          selectedPlanId,
          selectedPlanVersionId,
          status: RegistrationFormStatus.DRAFT,
          currentStep: 1,
          completionPct: this.completionFor(1, RegistrationFormStatus.DRAFT),
          draftPayload: {},
        },
      });
      await this.audit(userId, 'FORM_CREATED', formId, 1);
      this.logger.log(`Registration form created: ${formId}`);
      return { created: true, form: this.toView(form) };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('A registration form already exists for this reference. Please try again.');
      }
      throw err;
    }
  }

  // ── Read (owner view; cross-user reads 404, never 403-exists leaks) ──
  async getByFormId(userId: string, formId: string) {
    const form = await this.prisma.sellerRegistrationForm.findFirst({
      where: { formId, userId },
    });
    if (!form) throw new NotFoundException('Registration form not found');
    if (form.status === RegistrationFormStatus.EXPIRED) {
      throw new GoneException('This registration form has expired. Please start a new application.');
    }
    return { form: this.toView(form) };
  }

  // ── Draft save (denylist + plan revalidation + optimistic lock) ─────
  async updateDraft(userId: string, formId: string, dto: UpdateRegistrationFormDraftDto) {
    const form = await this.prisma.sellerRegistrationForm.findFirst({
      where: { formId, userId },
    });
    if (!form) throw new NotFoundException('Registration form not found');
    if (form.status !== RegistrationFormStatus.DRAFT) {
      throw new UnprocessableEntityException('Submitted forms are immutable. Please start a new application to re-apply.');
    }

    const seen = new Date(dto.clientUpdatedAt);
    if (Number.isNaN(seen.getTime())) {
      throw new BadRequestException('clientUpdatedAt must be a valid ISO timestamp');
    }

    let selectedPlanId = form.selectedPlanId;
    let selectedPlanVersionId = form.selectedPlanVersionId;
    if (dto.selectedPlanId !== undefined && dto.selectedPlanId !== form.selectedPlanId) {
      const resolved = await this.resolvePlan(dto.selectedPlanId);
      selectedPlanId = resolved.planId;
      selectedPlanVersionId = resolved.versionId;
    }

    const step = dto.currentStep ?? form.currentStep;
    const merged = {
      ...((form.draftPayload as Record<string, unknown> | null) ?? {}),
      ...((stripSensitiveKeys(dto.fields ?? {}) as Record<string, unknown> | null) ?? {}),
    };

    // PRP-02B optimistic pattern: conditional update; count==0 means the
    // row moved under us (or vanished) — never silently overwrite.
    const updated = await this.prisma.sellerRegistrationForm.updateMany({
      where: { id: form.id, userId, updatedAt: seen, status: RegistrationFormStatus.DRAFT },
      data: {
        draftPayload: merged as Prisma.InputJsonValue,
        currentStep: step,
        selectedPlanId,
        selectedPlanVersionId,
        completionPct: this.completionFor(step, RegistrationFormStatus.DRAFT),
      },
    });

    if (updated.count === 0) {
      const current = await this.prisma.sellerRegistrationForm.findFirst({
        where: { formId, userId },
      });
      if (!current) throw new NotFoundException('Registration form not found');
      if (current.status !== RegistrationFormStatus.DRAFT) {
        throw new UnprocessableEntityException('Submitted forms are immutable. Please start a new application to re-apply.');
      }
      throw new ConflictException({
        statusCode: 409,
        message: 'DRAFT_CONFLICT',
        error: 'Draft Conflict',
        form: this.toView(current),
      });
    }

    const fresh = await this.prisma.sellerRegistrationForm.findUniqueOrThrow({ where: { id: form.id } });
    await this.audit(userId, 'FORM_UPDATED', formId, step);
    return { form: this.toView(fresh) };
  }

  // ── Submit (completeness gate → delegate to canonical onboarding) ───
  async submit(userId: string, formId: string, dto: SubmitRegistrationFormDto) {
    const form = await this.prisma.sellerRegistrationForm.findFirst({
      where: { formId, userId },
    });
    if (!form) throw new NotFoundException('Registration form not found');
    if (form.status !== RegistrationFormStatus.DRAFT) {
      throw new ConflictException('This registration form was already submitted.');
    }
    // The pinned plan is intent; the submit body carries the full KYC pack.
    // An explicit mismatch is rejected rather than silently substituted.
    const body = dto as CreateVendorDto;
    if (body.planId && form.selectedPlanId && body.planId !== form.selectedPlanId) {
      throw new BadRequestException('Submitted plan does not match the form selection. Please re-confirm the plan and retry.');
    }

    // Delegation: identity creation lives ENTIRELY in AuthService (no
    // duplicate onboarding, no direct User/Company writes here). Throws
    // propagate untouched — the form stays DRAFT with nothing persisted.
    const result = await this.authService.vendorOnboarding(userId, body);

    const linked = await this.prisma.sellerRegistrationForm.update({
      where: { id: form.id },
      data: {
        companyId: result.companyId,
        status: RegistrationFormStatus.SUBMITTED,
        submittedAt: new Date(),
        completionPct: 100,
      },
    });
    await this.audit(userId, 'FORM_SUBMITTED', formId, form.currentStep);
    this.logger.log(`Registration form submitted: ${formId}`);
    return { form: this.toView(linked), companyId: result.companyId };
  }
}
