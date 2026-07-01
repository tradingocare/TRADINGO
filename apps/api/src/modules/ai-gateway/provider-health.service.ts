import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { ProviderRegistryService } from './provider-registry.service'
import { AiProviderStatus } from '@prisma/client'

interface CircuitBreakerState {
  failureThreshold: number
  recoveryTimeoutMs: number
  halfOpenMaxRequests: number
}

const DEFAULT_CIRCUIT_BREAKER: CircuitBreakerState = {
  failureThreshold: 5,
  recoveryTimeoutMs: 60000,
  halfOpenMaxRequests: 3,
}

@Injectable()
export class ProviderHealthService {
  private readonly logger = new Logger(ProviderHealthService.name)
  private circuitBreaker: CircuitBreakerState = DEFAULT_CIRCUIT_BREAKER

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: ProviderRegistryService,
  ) {}

  async checkHealth(providerName: string): Promise<{ healthy: boolean; latencyMs: number; status: string }> {
    const instance = this.registry.getProviderInstance(providerName)
    if (!instance) return { healthy: false, latencyMs: 0, status: 'not_found' }

    const start = Date.now()
    try {
      const result = await instance.healthCheck()
      const latencyMs = Date.now() - start
      const status = result.healthy ? AiProviderStatus.ACTIVE : AiProviderStatus.DEGRADED
      await this.registry.updateHealthStatus(providerName, status)
      await this.prisma.aiProvider.update({
        where: { name: providerName },
        data: { lastHealthCheckAt: new Date(), lastSuccessAt: new Date(), failureCount: 0 },
      })
      return { healthy: result.healthy, latencyMs, status }
    } catch {
      const latencyMs = Date.now() - start
      await this.recordFailure(providerName)
      return { healthy: false, latencyMs, status: AiProviderStatus.DOWN }
    }
  }

  async checkAllProviders(): Promise<Array<{ name: string; healthy: boolean; latencyMs: number; status: string }>> {
    const providers = await this.registry.getActiveProviders()
    const results = []
    for (const p of providers) {
      const result = await this.checkHealth(p.name)
      results.push({ name: p.name, ...result })
    }
    return results
  }

  async recordSuccess(providerName: string): Promise<void> {
    try {
      await this.prisma.aiProvider.update({
        where: { name: providerName },
        data: { failureCount: 0, lastSuccessAt: new Date(), circuitOpen: false, circuitOpenUntil: null },
      })
    } catch {}
  }

  async recordFailure(providerName: string): Promise<void> {
    try {
      const provider = await this.prisma.aiProvider.findUnique({ where: { name: providerName } })
      if (!provider) return
      const newFailureCount = provider.failureCount + 1
      const shouldOpenCircuit = newFailureCount >= this.circuitBreaker.failureThreshold
      await this.prisma.aiProvider.update({
        where: { name: providerName },
        data: {
          failureCount: newFailureCount,
          lastFailureAt: new Date(),
          healthStatus: AiProviderStatus.DOWN,
          circuitOpen: shouldOpenCircuit,
          circuitOpenUntil: shouldOpenCircuit ? new Date(Date.now() + this.circuitBreaker.recoveryTimeoutMs) : null,
        },
      })
      if (shouldOpenCircuit) {
        this.logger.warn(`Circuit breaker opened for provider '${providerName}' after ${newFailureCount} failures`)
      }
    } catch {}
  }

  async isCircuitOpen(providerName: string): Promise<boolean> {
    try {
      const provider = await this.prisma.aiProvider.findUnique({ where: { name: providerName }, select: { circuitOpen: true, circuitOpenUntil: true } })
      if (!provider?.circuitOpen || !provider.circuitOpenUntil) return false
      if (new Date() > provider.circuitOpenUntil) {
        await this.prisma.aiProvider.update({ where: { name: providerName }, data: { circuitOpen: false, circuitOpenUntil: null } })
        return false
      }
      return true
    } catch {
      return false
    }
  }

  async getProviderHealthDashboard() {
    const providers = await this.prisma.aiProvider.findMany({
      orderBy: { priority: 'asc' },
      select: {
        name: true, displayName: true, providerType: true, enabled: true, priority: true,
        healthStatus: true, lastHealthCheckAt: true, lastSuccessAt: true, lastFailureAt: true,
        failureCount: true, circuitOpen: true, circuitOpenUntil: true, timeoutMs: true, rateLimitRpm: true,
      },
    })
    return providers.map(p => ({
      ...p,
      circuitOpen: p.circuitOpen && p.circuitOpenUntil && new Date() < p.circuitOpenUntil ? true : false,
    }))
  }
}
