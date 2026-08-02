import { Injectable, Logger } from '@nestjs/common';
import { Registry } from 'prom-client';

@Injectable()
export class MetricsRegistryService {
  private readonly logger = new Logger(MetricsRegistryService.name);
  private _register: Registry | null = null;

  set register(reg: Registry) {
    this._register = reg;
    this.logger.log('Prometheus registry set');
  }

  get register(): Registry {
    if (!this._register) throw new Error('Metrics registry not initialized. Call MetricsRegistryService.register = reg from main.ts');
    return this._register;
  }

  get isReady(): boolean {
    return this._register !== null;
  }
}