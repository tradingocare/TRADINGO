import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { ApiKeyVaultService } from './api-key-vault.service'
import { BaseAiProvider } from './providers/base-provider'
import { OpenRouterProvider } from './providers/openrouter.provider'
import { GeminiProvider } from './providers/gemini.provider'
import { GroqProvider } from './providers/groq.provider'
import { TavilyProvider } from './providers/tavily.provider'
import { FirecrawlProvider } from './providers/firecrawl.provider'
import { AiProviderStatus, TaskType } from '@prisma/client'
import { CreateAiProviderDto, UpdateAiProviderDto } from './dto/provider.dto'

@Injectable()
export class ProviderRegistryService {
  private readonly logger = new Logger(ProviderRegistryService.name)
  private providers: Map<string, BaseAiProvider> = new Map()

  constructor(
    private readonly prisma: PrismaService,
    private readonly apiKeyVault: ApiKeyVaultService,
    private readonly openRouterProvider: OpenRouterProvider,
    private readonly geminiProvider: GeminiProvider,
    private readonly groqProvider: GroqProvider,
    private readonly tavilyProvider: TavilyProvider,
    private readonly firecrawlProvider: FirecrawlProvider,
  ) {
    this.registerBuiltIn(openRouterProvider)
    this.registerBuiltIn(geminiProvider)
    this.registerBuiltIn(groqProvider)
    this.registerBuiltIn(tavilyProvider)
    this.registerBuiltIn(firecrawlProvider)
  }

  private registerBuiltIn(provider: BaseAiProvider) {
    this.providers.set(provider.name, provider)
  }

  getProviderInstance(name: string): BaseAiProvider | undefined {
    return this.providers.get(name)
  }

  getAllInstances(): BaseAiProvider[] {
    return Array.from(this.providers.values())
  }

  async listProviders(page = 1, limit = 20, search?: string, status?: string) {
    const where: any = {}
    if (search) where.OR = [{ name: { contains: search } }, { displayName: { contains: search } }]
    if (status) where.healthStatus = status
    const [data, total] = await Promise.all([
      this.prisma.aiProvider.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { priority: 'asc' } }),
      this.prisma.aiProvider.count({ where }),
    ])
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrevious: page > 1 } }
  }

  async getProvider(name: string) {
    const provider = await this.prisma.aiProvider.findUnique({ where: { name } })
    if (!provider) throw new NotFoundException(`Provider '${name}' not found`)
    return provider
  }

  async createProvider(dto: CreateAiProviderDto) {
    return this.prisma.aiProvider.create({
      data: {
        name: dto.name,
        displayName: dto.displayName,
        providerType: dto.providerType,
        enabled: dto.enabled ?? false,
        priority: dto.priority ?? 0,
        baseUrl: dto.baseUrl,
        supportedModels: dto.supportedModels || [],
        supportedTasks: dto.supportedTasks as TaskType[] || [],
        timeoutMs: dto.timeoutMs ?? 30000,
        retryCount: dto.retryCount ?? 3,
        retryDelayMs: dto.retryDelayMs ?? 1000,
        rateLimitRpm: dto.rateLimitRpm ?? 60,
        rateLimitTpm: dto.rateLimitTpm ?? 100000,
        costPer1kInput: dto.costPer1kInput ?? 0,
        costPer1kOutput: dto.costPer1kOutput ?? 0,
        healthStatus: AiProviderStatus.DISABLED,
      },
    })
  }

  async updateProvider(name: string, dto: UpdateAiProviderDto) {
    const updateData: any = { ...dto }
    if (dto.supportedTasks) updateData.supportedTasks = dto.supportedTasks as TaskType[]
    return this.prisma.aiProvider.update({ where: { name }, data: updateData })
  }

  async setApiKey(providerName: string, apiKey: string) {
    const encrypted = this.apiKeyVault.encrypt(apiKey)
    await this.prisma.aiProvider.upsert({
      where: { name: providerName },
      create: { name: providerName, displayName: providerName, providerType: providerName, enabled: true, supportedModels: [], supportedTasks: [], healthStatus: AiProviderStatus.DISABLED },
      update: { metadata: { ...(await this.getProvider(providerName).catch(() => ({ metadata: null })) as any)?.metadata, encryptedApiKey: encrypted } },
    })
    return { message: `API key set for ${providerName}` }
  }

  async getApiKey(providerName: string): Promise<string> {
    const provider = await this.getProvider(providerName)
    if (!provider.metadata || !(provider.metadata as any).encryptedApiKey) {
      const instance = this.getProviderInstance(providerName)
      if (instance) return instance.getApiKey()
      throw new NotFoundException(`No API key configured for ${providerName}`)
    }
    return this.apiKeyVault.decrypt((provider.metadata as any).encryptedApiKey)
  }

  async getActiveProviders(): Promise<any[]> {
    return this.prisma.aiProvider.findMany({ where: { enabled: true }, orderBy: { priority: 'asc' } })
  }

  async getBestProviderForTask(taskType: TaskType): Promise<any> {
    const providers = await this.prisma.aiProvider.findMany({
      where: { enabled: true, healthStatus: { in: [AiProviderStatus.ACTIVE, AiProviderStatus.DEGRADED] }, supportedTasks: { has: taskType } },
      orderBy: [{ priority: 'asc' }, { healthStatus: 'asc' }],
    })
    if (providers.length === 0) throw new NotFoundException(`No active provider found for task: ${taskType}`)
    return providers[0]
  }

  async updateHealthStatus(name: string, status: AiProviderStatus) {
    return this.prisma.aiProvider.update({
      where: { name },
      data: { healthStatus: status, lastHealthCheckAt: new Date() },
    })
  }
}
