import { Controller, Post, Get, Param, Body, Query, UseGuards, Req, Patch, Res } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { Throttle } from '@nestjs/throttler'
import { TaskType } from '@prisma/client'
import { AiCreditsService } from './ai-credits.service'

@ApiTags('AI Gateway')
@Controller('ai-gateway')
@UseGuards(JwtAuthGuard, RolesGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class AiGatewayController {
  constructor(
    private readonly gateway: AiGatewayService,
    private readonly registry: ProviderRegistryService,
    private readonly prompts: PromptManagerService,
    private readonly health: ProviderHealthService,
    private readonly modelRegistry: ModelRegistryService,
    private readonly credits: AiCreditsService,
  ) {}

  @ApiOperation({ summary: 'Process AI gateway request' })
  @Post('process')
  @Roles('SELLER', 'ADMIN')
  async process(@Body() dto: AiGatewayRequestDto, @Req() req: any) {
    return this.gateway.process(dto, req.user?.companyId || 'system', req.user?.id)
  }

  @ApiOperation({ summary: 'Stream AI gateway response' })
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

  @ApiOperation({ summary: 'List AI providers' })
  @Get('providers')
  @Roles('ADMIN')
  async listProviders(@Query() query: AiProviderQueryDto) {
    return this.registry.listProviders(query.page, query.limit, query.search, query.status)
  }

  @ApiOperation({ summary: 'Get provider by name' })
  @Get('providers/:name')
  @Roles('ADMIN')
  async getProvider(@Param('name') name: string) {
    return this.registry.getProvider(name)
  }

  @ApiOperation({ summary: 'Create AI provider' })
  @Post('providers')
  @Roles('ADMIN')
  async createProvider(@Body() dto: CreateAiProviderDto) {
    return this.registry.createProvider(dto)
  }

  @ApiOperation({ summary: 'Update AI provider' })
  @Patch('providers/:name')
  @Roles('ADMIN')
  async updateProvider(@Param('name') name: string, @Body() dto: UpdateAiProviderDto) {
    return this.registry.updateProvider(name, dto)
  }

  @ApiOperation({ summary: 'Set provider API key' })
  @Post('providers/api-key')
  @Roles('ADMIN')
  async setApiKey(@Body() dto: SetApiKeyDto) {
    return this.registry.setApiKey(dto.providerName, dto.apiKey)
  }

  @ApiOperation({ summary: 'Check provider health' })
  @Post('providers/:name/health')
  @Roles('ADMIN')
  async checkProviderHealth(@Param('name') name: string) {
    return this.health.checkHealth(name)
  }

  @ApiOperation({ summary: 'Check all providers health' })
  @Post('providers/health/all')
  @Roles('ADMIN')
  async checkAllProviders() {
    return this.health.checkAllProviders()
  }

  @ApiOperation({ summary: 'List AI prompts' })
  @Get('prompts')
  @Roles('ADMIN')
  async listPrompts(@Query() query: AiPromptQueryDto) {
    return this.prompts.listPrompts(query.page, query.limit, query.taskType, query.search)
  }

  @ApiOperation({ summary: 'Create AI prompt' })
  @Post('prompts')
  @Roles('ADMIN')
  async createPrompt(@Body() dto: CreateAiPromptDto) {
    return this.prompts.createPrompt(dto)
  }

  @ApiOperation({ summary: 'Update AI prompt' })
  @Patch('prompts/:id')
  @Roles('ADMIN')
  async updatePrompt(@Param('id') id: string, @Body() dto: UpdateAiPromptDto) {
    return this.prompts.updatePrompt(id, dto)
  }

  @ApiOperation({ summary: 'Activate AI prompt' })
  @Post('prompts/:id/activate')
  @Roles('ADMIN')
  async activatePrompt(@Param('id') id: string) {
    return this.prompts.activatePrompt(id)
  }

  @ApiOperation({ summary: 'Get prompt version history' })
  @Get('prompts/versions/:taskType')
  @Roles('ADMIN')
  async getPromptVersions(@Param('taskType') taskType: string) {
    return this.prompts.getVersionHistory(taskType as TaskType)
  }

  @ApiOperation({ summary: 'Get active prompt by task type' })
  @Get('prompts/:taskType/active')
  @Roles('ADMIN', 'SELLER')
  async getActivePrompt(@Param('taskType') taskType: string) {
    return this.prompts.getPrompt(taskType as TaskType)
  }

  @ApiOperation({ summary: 'Get my credit balance' })
  @Get('credits/balance')
  @Roles('SELLER', 'BUYER', 'ADMIN')
  async getMyCreditBalance(@Req() req: any) {
    return this.credits.getCreditBalance(req.user?.companyId)
  }
}
