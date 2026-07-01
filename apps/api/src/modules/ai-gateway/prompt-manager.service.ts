import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { TaskType } from '@prisma/client'
import { CreateAiPromptDto, UpdateAiPromptDto } from './dto/prompt.dto'

@Injectable()
export class PromptManagerService {
  private readonly logger = new Logger(PromptManagerService.name)

  constructor(private readonly prisma: PrismaService) {}

  async getPrompt(taskType: TaskType, version?: number): Promise<any> {
    const where: any = { taskType, isActive: true }
    if (version) where.version = version
    const prompt = await this.prisma.aiPrompt.findFirst({ where, orderBy: { version: 'desc' } })
    if (!prompt) throw new NotFoundException(`No active prompt found for task: ${taskType}`)
    return prompt
  }

  async listPrompts(page = 1, limit = 20, taskTypeFilter?: string, search?: string) {
    const where: any = {}
    if (taskTypeFilter) where.taskType = taskTypeFilter
    if (search) where.OR = [{ name: { contains: search } }, { description: { contains: search } }]
    const [data, total] = await Promise.all([
      this.prisma.aiPrompt.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: [{ taskType: 'asc' }, { version: 'desc' }] }),
      this.prisma.aiPrompt.count({ where }),
    ])
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrevious: page > 1 } }
  }

  async createPrompt(dto: CreateAiPromptDto) {
    const maxVersion = await this.prisma.aiPrompt.findFirst({
      where: { taskType: dto.taskType },
      orderBy: { version: 'desc' },
      select: { version: true },
    })
    const version = dto.version ?? (maxVersion ? maxVersion.version + 1 : 1)
    return this.prisma.aiPrompt.create({
      data: {
        taskType: dto.taskType,
        version,
        name: dto.name,
        description: dto.description,
        systemPrompt: dto.systemPrompt,
        userPrompt: dto.userPrompt,
        variables: dto.variables || [],
        temperature: dto.temperature ?? 0.7,
        maxTokens: dto.maxTokens ?? 2048,
        providerOverride: dto.providerOverride,
        modelOverride: dto.modelOverride,
        isActive: dto.isActive ?? true,
      },
    })
  }

  async updatePrompt(id: string, dto: UpdateAiPromptDto) {
    const existing = await this.prisma.aiPrompt.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException('Prompt not found')
    return this.prisma.aiPrompt.update({ where: { id }, data: dto })
  }

  async activatePrompt(id: string) {
    const prompt = await this.prisma.aiPrompt.findUnique({ where: { id } })
    if (!prompt) throw new NotFoundException('Prompt not found')
    await this.prisma.aiPrompt.updateMany({ where: { taskType: prompt.taskType, isActive: true }, data: { isActive: false } })
    return this.prisma.aiPrompt.update({ where: { id }, data: { isActive: true } })
  }

  renderPrompt(prompt: any, variables: Record<string, string>): { systemPrompt: string; userPrompt: string } {
    let systemPrompt = prompt.systemPrompt
    let userPrompt = prompt.userPrompt || ''
    const vars = prompt.variables as string[] || []
    for (const v of vars) {
      const val = variables[v] || `{{${v}}}`
      systemPrompt = systemPrompt.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), val)
      userPrompt = userPrompt.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), val)
    }
    return { systemPrompt, userPrompt }
  }

  async getVersionHistory(taskType: TaskType) {
    return this.prisma.aiPrompt.findMany({
      where: { taskType },
      orderBy: { version: 'desc' },
      select: { id: true, version: true, name: true, isActive: true, createdAt: true, description: true },
    })
  }
}
