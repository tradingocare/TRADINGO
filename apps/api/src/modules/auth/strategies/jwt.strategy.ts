import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../../common/services/redis.service';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
  companyId?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret')!,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: AccessTokenPayload): Promise<AccessTokenPayload> {
    const cacheKey = `user:active:${payload.sub}`;
    const companyCacheKey = `user:company:${payload.sub}`;
    const [cached, cachedCompany] = await Promise.all([
      this.redis.get(cacheKey),
      this.redis.get(companyCacheKey),
    ]);
    if (cached === 'true' && cachedCompany !== null) {
      return { ...payload, companyId: cachedCompany || undefined };
    }
    if (cached === 'false') throw new UnauthorizedException('User not found or inactive');

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, isActive: true },
    });

    if (!user?.isActive) {
      await this.redis.set(cacheKey, 'false', 300);
      throw new UnauthorizedException('User not found or inactive');
    }

    const owner =
      (await this.prisma.companyOwner.findFirst({
        where: { userId: payload.sub, isPrimary: true },
        select: { companyId: true },
      })) ??
      (await this.prisma.companyOwner.findFirst({
        where: { userId: payload.sub },
        select: { companyId: true },
      }));

    const companyId = owner?.companyId;
    await this.redis.set(cacheKey, 'true', 300);
    await this.redis.set(companyCacheKey, companyId ?? '', 300);
    return { ...payload, companyId: companyId ?? undefined };
  }
}
