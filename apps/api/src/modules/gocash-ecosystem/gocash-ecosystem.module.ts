import { Module, OnModuleInit } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from '../../prisma/prisma.module';
import { GocashModule } from '../gocash/gocash.module';
import { NotificationModule } from '../notification/notification.module';
import { GocashEcosystemService } from './gocash-ecosystem.service';
import { GocashEcosystemController } from './gocash-ecosystem.controller';
import { AdminEcosystemController } from './admin-ecosystem.controller';

@Module({
  imports: [
    PrismaModule,
    GocashModule,
    NotificationModule,
    EventEmitterModule.forRoot({ wildcard: false, delimiter: '.', maxListeners: 20 }),
  ],
  controllers: [GocashEcosystemController, AdminEcosystemController],
  providers: [GocashEcosystemService],
  exports: [GocashEcosystemService],
})
export class GocashEcosystemModule implements OnModuleInit {
  constructor(private readonly service: GocashEcosystemService) {}

  async onModuleInit() {
    await this.service.seedInitialData();
  }
}
