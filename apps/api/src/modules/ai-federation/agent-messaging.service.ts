import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuid } from 'uuid';
import { AgentMessage } from './interfaces/federation.interfaces';

@Injectable()
export class AgentMessagingService {
  private readonly logger = new Logger(AgentMessagingService.name);

  constructor(private readonly eventBus: EventEmitter2) {}

  send(message: Omit<AgentMessage, 'id' | 'timestamp'>): string {
    const id = uuid();
    const msg: AgentMessage = { ...message, id, timestamp: new Date() };
    this.eventBus.emit(`agent.msg.${message.toAgentId}`, msg);
    this.eventBus.emit('agent.msg.all', msg);
    if (message.collaborationId) {
      this.eventBus.emit(`agent.collab.${message.collaborationId}`, msg);
    }
    this.logger.debug(`Message ${id}: ${message.fromAgentId} → ${message.toAgentId} [${message.action}]`);
    return id;
  }

  request(fromAgentId: string, toAgentId: string, action: string, payload: unknown, collaborationId?: string): string {
    return this.send({ fromAgentId, toAgentId, type: 'request', action, payload, collaborationId });
  }

  respond(
    originalMessage: AgentMessage,
    payload: unknown,
    success: boolean,
  ): string {
    return this.send({
      fromAgentId: originalMessage.toAgentId,
      toAgentId: originalMessage.fromAgentId,
      type: success ? 'response' : 'error',
      action: originalMessage.action,
      payload,
      collaborationId: originalMessage.collaborationId,
    });
  }

  broadcast(fromAgentId: string, action: string, payload: unknown): void {
    this.send({ fromAgentId, toAgentId: '*', type: 'event', action, payload });
  }

  subscribe(agentId: string, handler: (msg: AgentMessage) => void): () => void {
    const listener = (msg: AgentMessage) => { handler(msg); };
    this.eventBus.on(`agent.msg.${agentId}`, listener);
    return () => this.eventBus.off(`agent.msg.${agentId}`, listener);
  }

  subscribeAll(handler: (msg: AgentMessage) => void): () => void {
    const listener = (msg: AgentMessage) => { handler(msg); };
    this.eventBus.on('agent.msg.all', listener);
    return () => this.eventBus.off('agent.msg.all', listener);
  }

  subscribeCollaboration(collaborationId: string, handler: (msg: AgentMessage) => void): () => void {
    const listener = (msg: AgentMessage) => { handler(msg); };
    this.eventBus.on(`agent.collab.${collaborationId}`, listener);
    return () => this.eventBus.off(`agent.collab.${collaborationId}`, listener);
  }
}
