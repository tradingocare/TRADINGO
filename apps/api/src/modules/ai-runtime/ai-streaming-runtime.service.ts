import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter'
import { Observable, Subject } from 'rxjs'
import { filter } from 'rxjs/operators'
import { StreamingEvent } from './dto/ai-runtime.dto'

@Injectable()
export class AiStreamingRuntimeService {
  private readonly logger = new Logger(AiStreamingRuntimeService.name)
  private readonly subjects = new Map<string, Subject<StreamingEvent>>()
  private globalSubject = new Subject<StreamingEvent>()

  constructor(private readonly eventEmitter: EventEmitter2) {}

  @OnEvent('ai-runtime.event')
  handleRuntimeEvent(event: StreamingEvent): void {
    this.globalSubject.next(event)
    if (event.taskId) {
      const subject = this.subjects.get(event.taskId)
      if (subject) subject.next(event)
    }
  }

  watchTask(taskId: string): Subject<StreamingEvent> {
    let subject = this.subjects.get(taskId)
    if (!subject) {
      subject = new Subject<StreamingEvent>()
      this.subjects.set(taskId, subject)
    }
    return subject
  }

  watchAll(): Subject<StreamingEvent> {
    return this.globalSubject
  }

  getStream(taskId?: string): Observable<StreamingEvent> {
    if (taskId) {
      return this.watchTask(taskId).asObservable()
    }
    return this.globalSubject.asObservable()
  }

  stopWatching(taskId: string): void {
    const subject = this.subjects.get(taskId)
    if (subject) {
      subject.complete()
      this.subjects.delete(taskId)
    }
  }

  emitImmediate(event: StreamingEvent): void {
    this.globalSubject.next(event)
    if (event.taskId) {
      const subject = this.subjects.get(event.taskId)
      if (subject) subject.next(event)
    }
  }
}
