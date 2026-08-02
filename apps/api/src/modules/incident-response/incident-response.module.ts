import { Module } from '@nestjs/common';
import { IncidentResponseService } from './incident-response.service';
import { IncidentResponseController } from './incident-response.controller';
import { LaunchModule } from '../launch/launch.module';

@Module({
  imports: [LaunchModule],
  providers: [IncidentResponseService],
  controllers: [IncidentResponseController],
  exports: [IncidentResponseService],
})
export class IncidentResponseModule {}
