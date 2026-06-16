import { Module } from '@nestjs/common';
import { LaunchService } from './launch.service';
import { LaunchDashboardController } from './launch-dashboard.controller';
import { LaunchChecklistController } from './launch-checklist.controller';
import { IncidentsController } from './incidents.controller';

@Module({
  controllers: [LaunchDashboardController, LaunchChecklistController, IncidentsController],
  providers: [LaunchService],
  exports: [LaunchService],
})
export class LaunchModule {}
