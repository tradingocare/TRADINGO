import { Module } from '@nestjs/common'
import { AiAdminService } from './ai-admin.service'
import { AiAdminController } from './ai-admin.controller'
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module'

@Module({
  imports: [AiGatewayModule],
  controllers: [AiAdminController],
  providers: [AiAdminService],
  exports: [AiAdminService],
})
export class AdminIntelligenceModule {}
