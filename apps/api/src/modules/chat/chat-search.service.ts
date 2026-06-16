import { Injectable, Logger } from '@nestjs/common';
import { SearchService, SearchResult } from '../search/search.service';

const MESSAGES_INDEX = 'chat_messages';

export interface MessageSearchHit {
  id: string;
  conversationId: string;
  senderId: string;
  senderCompanyId: string;
  content: string | null;
  type: string;
  createdAt: string;
}

@Injectable()
export class ChatSearchService {
  private readonly logger = new Logger(ChatSearchService.name);
  private enabled = true;

  constructor(private readonly searchService: SearchService) {}

  async indexMessage(message: {
    id: string;
    conversationId: string;
    senderId: string;
    senderCompanyId: string;
    content: string | null;
    type: string;
    createdAt: Date;
  }): Promise<void> {
    if (!this.enabled) return;
    try {
      await this.searchService.indexDocument(MESSAGES_INDEX, message.id, {
        conversationId: message.conversationId,
        senderId: message.senderId,
        senderCompanyId: message.senderCompanyId,
        content: message.content,
        type: message.type,
        createdAt: message.createdAt.toISOString(),
      });
    } catch (err) {
      this.logger.warn(`OpenSearch indexing failed: ${(err as Error).message}`);
      this.enabled = false;
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    if (!this.enabled) return;
    try {
      await this.searchService.deleteDocument(MESSAGES_INDEX, messageId);
    } catch (err) {
      this.logger.warn(`OpenSearch delete failed: ${(err as Error).message}`);
    }
  }

  async searchMessages(
    conversationId: string,
    query: string,
    page = 1,
    limit = 20,
  ): Promise<SearchResult<MessageSearchHit> | null> {
    if (!this.enabled) return null;
    try {
      return await this.searchService.search<MessageSearchHit>(MESSAGES_INDEX, query, { conversationId }, { page, limit });
    } catch (err) {
      this.logger.warn(`OpenSearch search failed: ${(err as Error).message}`);
      return null;
    }
  }
}
