import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { QueueNames, AiJobData, AiJobTypes } from './queues'

@Processor(QueueNames.AI)
export class AiProcessor extends WorkerHost {
  private readonly logger = new Logger(AiProcessor.name)

  async process(job: Job<AiJobData>): Promise<void> {
    this.logger.log(`Processing AI job ${job.id} of type ${job.data.type}`)

    switch (job.data.type) {
      case AiJobTypes.PROCESS_BULK:
        await this.handleBulkProcess(job)
        break
      case AiJobTypes.GENERATE_DESCRIPTION:
      case AiJobTypes.GENERATE_SEO:
      case AiJobTypes.TRANSLATE:
      case AiJobTypes.SUGGEST_SPECS:
      case AiJobTypes.SUGGEST_IMAGES:
      case AiJobTypes.QUALITY_SCORE:
      case AiJobTypes.DUPLICATE_DETECT:
        await this.handleSingleTask(job)
        break
      default:
        this.logger.warn(`Unknown AI job type: ${job.data.type}`)
    }
  }

  private async handleBulkProcess(job: Job<AiJobData>) {
    const { companyId, userId, productIds, options } = job.data
    this.logger.log(`Bulk processing ${productIds.length} products for company ${companyId}`)
    await job.updateProgress(50)
    await job.updateProgress(100)
  }

  private async handleSingleTask(job: Job<AiJobData>) {
    const { companyId, productIds } = job.data
    this.logger.log(`Single AI task ${job.data.type} for product ${productIds[0]} (company ${companyId})`)
    await job.updateProgress(100)
  }
}
