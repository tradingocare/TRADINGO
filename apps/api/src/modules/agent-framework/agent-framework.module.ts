import { Global, Module } from '@nestjs/common';
import { AgentRegistryService } from './agent-registry.service';
import { AgentExecutorService } from './agent-executor.service';

@Global()
@Module({
  providers: [AgentRegistryService, AgentExecutorService],
  exports: [AgentRegistryService, AgentExecutorService],
})
export class AgentFrameworkModule {}
