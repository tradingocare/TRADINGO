import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID', ''),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET', ''),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL', 'http://localhost:3001/api/v1/auth/google/callback'),
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: (err: any, user?: any) => void): Promise<any> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('Google account must have an email address'), undefined);
      return;
    }

    try {
      let user = await this.prisma.user.findUnique({ where: { email } });

      if (!user) {
        const passwordHash = await bcrypt.hash(uuid(), 12);
        user = await this.prisma.user.create({
          data: {
            email,
            name: profile.name?.givenName
              ? `${profile.name.givenName} ${profile.name.familyName || ''}`.trim()
              : email.split('@')[0],
            passwordHash,
            role: 'BUYER',
            isActive: true,
            emailVerifiedAt: new Date(),
          },
        });
        this.logger.log(`New user created via Google OAuth: ${email}`);
      } else if (!user.emailVerifiedAt) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { emailVerifiedAt: new Date() },
        });
      }

      done(null, { id: user.id, email: user.email, role: user.role, permissions: [] });
    } catch (err) {
      this.logger.error(`Google OAuth error: ${(err as Error).message}`);
      done(err as Error, undefined);
    }
  }
}
