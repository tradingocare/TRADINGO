import { Controller, Post, Get, Param, Body, Query, UseGuards, Req, Patch, Res, HttpStatus } from '@nestjs/common'
import { AiGatewayService } from './ai-gateway.service'
import { ProviderRegistryService } from './provider-registry.service'
import { PromptManagerService } from './prompt-manager.service'
import { ProviderHealthService } from './provider-health.service'
import { ModelRegistryService } from './model-registry.service'
import { AiGatewayRequestDto } from './dto/gateway.dto'
import { AiStreamRequestDto } from './dto/stream.dto'
import { CreateAiProviderDto, UpdateAiProviderDto, SetApiKeyDto, AiProviderQueryDto } from './dto/provider.dto'
import { CreateAiPromptDto, UpdateAiPromptDto, AiPromptQueryDto } from './dto/prompt.dto'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { TaskType } from '@prisma/client'
import { AiCreditsService } from './ai-credits.service'

@Controller('ai-gateway')
@UseGuards(RolesGuard)
export class AiGatewayController {
  constructor(
    private readonly gateway: AiGatewayService,
    private readonly registry: ProviderRegistryService,
    private readonly prompts: PromptManagerService,
    private readonly health: ProviderHealthService,
    private readonly modelRegistry: ModelRegistryService,
    private readonly credits: AiCreditsService,
  ) {}

  @Post('process')
  @Roles('SELLER', 'ADMIN')
  async process(@Body() dto: AiGatewayRequestDto, @Req() req: any) {
    return this.gateway.process(dto, req.user?.companyId || 'system', req.user?.id)
  }

  @Post('stream')
  @Roles('SELLER', 'ADMIN')
  async stream(@Body() dto: AiStreamRequestDto, @Req() req: any, @Res() res: any) {
    const result = await this.gateway.process(dto, req.user?.companyId || 'system', req.user?.id)

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const content = result.content
    const chunkSize = Math.max(1, Math.floor(content.length / 20))
    let pos = 0
    const interval = setInterval(() => {
      if (pos >= content.length) {
        res.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`)
        clearInterval(interval)
        res.end()
        return
      }
      const chunk = content.substring(pos, pos + chunkSize)
      pos += chunkSize
      res.write(`data: ${JSON.stringify({ content: chunk, done: false })}\n\n`)
    }, 50)
  }

  @Get('providers')
  @Roles('ADMIN')
  async listProviders(@Query() query: AiProviderQueryDto) {
    return this.registry.listProviders(query.page, query.limit, query.search, query.status)
  }

  @Get('providers/:name')
  @Roles('ADMIN')
  async getProvider(@Param('name') name: string) {
    return this.registry.getProvider(name)
  }

  @Post('providers')
  @Roles('ADMIN')
  async createProvider(@Body() dto: CreateAiProviderDto) {
    return this.registry.createProvider(dto)
  }

  @Patch('providers/:name')
  @Roles('ADMIN')
  async updateProvider(@Param('name') name: string, @Body() dto: UpdateAiProviderDto) {
    return this.registry.updateProvider(name, dto)
  }

  @Post('providers/api-key')
  @Roles('ADMIN')
  async setApiKey(@Body() dto: SetApiKeyDto) {
    return this.registry.setApiKey(dto.providerName, dto.apiKey)
  }

  @Post('providers/:name/health')
  @Roles('ADMIN')
  async checkProviderHealth(@Param('name') name: string) {
    return this.health.checkHealth(name)
  }

  @Post('providers/health/all')
  @Roles('ADMIN')
  async checkAllProviders() {
    return this.health.checkAllProviders()
  }

  @Get('prompts')
  @Roles('ADMIN')
  async listPrompts(@Query() query: AiPromptQueryDto) {
    return this.prompts.listPrompts(query.page, query.limit, query.taskType, query.search)
  }

  @Post('prompts')
  @Roles('ADMIN')
  async createPrompt(@Body() dto: CreateAiPromptDto) {
    return this.prompts.createPrompt(dto)
  }

  @Patch('prompts/:id')
  @Roles('ADMIN')
  async updatePrompt(@Param('id') id: string, @Body() dto: UpdateAiPromptDto) {
    return this.prompts.updatePrompt(id, dto)
  }

  @Post('prompts/:id/activate')
  @Roles('ADMIN')
  async activatePrompt(@Param('id') id: string) {
    return this.prompts.activatePrompt(id)
  }

  @Get('prompts/versions/:taskType')
  @Roles('ADMIN')
  async getPromptVersions(@Param('taskType') taskType: string) {
    return this.prompts.getVersionHistory(taskType as TaskType)
  }

  @Get('prompts/:taskType/active')
  @Roles('ADMIN', 'SELLER')
  async getActivePrompt(@Param('taskType') taskType: string) {
    return this.prompts.getPrompt(taskType as TaskType)
  }

  @Get('credits/balance')
  @Roles('SELLER', 'BUYER', 'ADMIN')
  async getMyCreditBalance(@Req() req: any) {
    return this.credits.getCreditBalance(req.user?.companyId)
  }
}
