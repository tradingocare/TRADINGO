import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-linkedin-oauth2';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class LinkedInStrategy extends PassportStrategy(Strategy, 'linkedin') {
  private readonly logger = new Logger(LinkedInStrategy.name);

  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const clientID = configService.get<string>('LINKEDIN_CLIENT_ID');
    const clientSecret = configService.get<string>('LINKEDIN_CLIENT_SECRET');
    const callbackURL = configService.get<string>('LINKEDIN_CALLBACK_URL');
    if (!clientID || !clientSecret || !callbackURL) {
      super({ clientID: 'DISABLED', clientSecret: 'DISABLED', callbackURL: '', scope: [] } as any);
      Logger.warn('LinkedIn OAuth disabled: LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, or LINKEDIN_CALLBACK_URL not set');
      return;
    }
    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile', 'openid'],
      state: true,
    } as any);
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: (err: any, user?: any) => void): Promise<any> {
    const providerId = profile.id;
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('LinkedIn account must have an email address'), undefined);
      return;
    }

    try {
      let user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { provider: 'linkedin', providerId },
            { email },
          ],
        },
      });

      if (!user) {
        const passwordHash = await bcrypt.hash(uuid(), 12);
        user = await this.prisma.user.create({
          data: {
            email,
            name: profile.displayName || email.split('@')[0],
            passwordHash,
            role: 'BUYER',
            isActive: true,
            emailVerifiedAt: new Date(),
            provider: 'linkedin',
            providerId,
          },
        });
        this.logger.log(`New user created via LinkedIn OAuth: ${email}`);
      } else {
        const updateData: any = { emailVerifiedAt: user.emailVerifiedAt ?? new Date() };
        if (!user.provider) updateData.provider = 'linkedin';
        if (!user.providerId) updateData.providerId = providerId;
        await this.prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }

      done(null, { id: user.id, email: user.email, role: user.role, permissions: [] });
    } catch (err) {
      this.logger.error(`LinkedIn OAuth error: ${(err as Error).message}`);
      done(err as Error, undefined);
    }
  }
}
