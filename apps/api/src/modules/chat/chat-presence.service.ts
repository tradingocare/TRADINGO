import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../common/services/redis.service';

const PRESENCE_PREFIX = 'chat:online:';
const PRESENCE_TTL = 120;

@Injectable()
export class ChatPresenceService {
  private readonly logger = new Logger(ChatPresenceService.name);

  constructor(private readonly redis: RedisService) {}

  async setOnline(userId: string): Promise<void> {
    await this.redis.set(`${PRESENCE_PREFIX}${userId}`, '1', PRESENCE_TTL);
  }

  async setOffline(userId: string): Promise<void> {
    await this.redis.del(`${PRESENCE_PREFIX}${userId}`);
  }

  async isOnline(userId: string): Promise<boolean> {
    return this.redis.exists(`${PRESENCE_PREFIX}${userId}`);
  }

  async refreshOnline(userId: string): Promise<void> {
    const ttl = await this.redis.ttl(`${PRESENCE_PREFIX}${userId}`);
    if (ttl > 0) {
      await this.redis.expire(`${PRESENCE_PREFIX}${userId}`, PRESENCE_TTL);
    } else {
      await this.setOnline(userId);
    }
  }

  async getOnlineUsers(userIds: string[]): Promise<Set<string>> {
    const results = await Promise.all(
      userIds.map(async (uid) => ({ uid, online: await this.isOnline(uid) })),
    );
    return new Set(results.filter((r) => r.online).map((r) => r.uid));
  }
}
