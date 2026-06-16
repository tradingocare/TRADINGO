import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  async connectToRedis(configService: ConfigService): Promise<void> {
    const url = configService.get<string>('redis.url')!;
    const pubClient = new Redis(url);
    const subClient = pubClient.duplicate();

    this.adapterConstructor = createAdapter(pubClient, subClient, {
      key: 'tradingo:chat:',
    });
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
