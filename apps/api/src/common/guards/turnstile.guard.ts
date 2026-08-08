import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { TurnstileService } from '../services/turnstile.service';

@Injectable()
export class TurnstileGuard implements CanActivate {
  constructor(private readonly turnstileService: TurnstileService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.body?.turnstileToken || request.headers['cf-turnstile-token'];

    if (!token) {
      if (process.env.NODE_ENV === 'development') return true;
      if (!this.turnstileService.isConfigured) return true;
      throw new HttpException({ status: 'error', message: 'Turnstile token required' }, HttpStatus.FORBIDDEN);
    }

    const result = await this.turnstileService.verify(token, request.ip);
    if (!result.success) {
      throw new HttpException({ status: 'error', message: 'Security verification failed' }, HttpStatus.FORBIDDEN);
    }
    return true;
  }
}
