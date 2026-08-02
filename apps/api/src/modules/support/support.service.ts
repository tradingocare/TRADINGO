import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { TicketStatus, TicketPriority } from '@prisma/client'
import { CreateTicketDto, AddMessageDto, UpdateTicketStatusDto, QueryTicketDto } from './dto/create-ticket.dto'

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name)

  constructor(private readonly prisma: PrismaService) {}

  private readonly ticketInclude = {
    user: { select: { id: true, name: true, email: true } },
    assignee: { select: { id: true, name: true, email: true } },
    company: { select: { id: true, name: true, slug: true } },
    _count: { select: { messages: true } },
  }

  async createTicket(userId: string, companyId: string, dto: CreateTicketDto) {
    const ticket = await this.prisma.supportTicket.create({
      data: {
        companyId,
        userId,
        subject: dto.subject,
        description: dto.description,
        category: dto.category,
        priority: (dto.priority as TicketPriority) || TicketPriority.MEDIUM,
      },
      include: this.ticketInclude,
    })
    this.logger.log(`Support ticket created: ${ticket.id} by user ${userId}`)
    return ticket
  }

  async getTickets(userId: string, companyId: string, role: string, query: QueryTicketDto) {
    const page = query.page || 1
    const limit = Math.min(query.limit || 20, 100)
    const skip = (page - 1) * limit

    const where: any = {}
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      if (query.status) where.status = query.status
    } else {
      where.companyId = companyId
      if (query.status) where.status = query.status
    }
    if (query.category) where.category = query.category
    if (query.search) {
      where.OR = [
        { subject: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: this.ticketInclude,
      }),
      this.prisma.supportTicket.count({ where }),
    ])

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: skip + limit < total, hasPrevious: page > 1 },
    }
  }

  async getTicket(ticketId: string, userId: string, companyId: string, role: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        ...this.ticketInclude,
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    })
    if (!ticket) throw new NotFoundException('Ticket not found')
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && ticket.companyId !== companyId) {
      throw new ForbiddenException('Access denied')
    }
    return ticket
  }

  async addMessage(ticketId: string, userId: string, companyId: string, role: string, dto: AddMessageDto) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } })
    if (!ticket) throw new NotFoundException('Ticket not found')
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && ticket.companyId !== companyId) {
      throw new ForbiddenException('Access denied')
    }
    if (ticket.status === TicketStatus.CLOSED) {
      throw new ForbiddenException('Cannot add message to closed ticket')
    }

    const message = await this.prisma.supportTicketMessage.create({
      data: {
        ticketId,
        userId,
        message: dto.message,
        attachments: (dto.attachments || undefined) as any,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    })

    if (ticket.status === TicketStatus.RESOLVED) {
      await this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.IN_PROGRESS },
      })
    }

    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    })

    return message
  }

  async updateStatus(ticketId: string, userId: string, role: string, dto: UpdateTicketStatusDto) {
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only admins can update ticket status')
    }
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } })
    if (!ticket) throw new NotFoundException('Ticket not found')

    const updateData: any = { status: dto.status }
    if (dto.status === TicketStatus.RESOLVED) updateData.resolvedAt = new Date()
    if (dto.status === TicketStatus.OPEN) updateData.resolvedAt = null

    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
    })

    this.logger.log(`Ticket ${ticketId} status updated to ${dto.status} by ${userId}`)
    return { message: `Ticket ${dto.status.toLowerCase()}` }
  }

  async assignTicket(ticketId: string, assigneeId: string, role: string) {
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only admins can assign tickets')
    }
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } })
    if (!ticket) throw new NotFoundException('Ticket not found')

    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { assignedTo: assigneeId },
    })
    return { message: 'Ticket assigned' }
  }

  async getCategories(role: string, companyId?: string) {
    const tickets = await this.prisma.supportTicket.findMany({
      where: role === 'ADMIN' || role === 'SUPER_ADMIN' ? {} : { companyId },
      select: { category: true },
      distinct: ['category'],
    })
    return tickets.map((t) => t.category).filter(Boolean)
  }

  async getStats(role: string) {
    const where = {}
    const [open, inProgress, waiting, resolved, closed] = await Promise.all([
      this.prisma.supportTicket.count({ where: { ...where, status: TicketStatus.OPEN } }),
      this.prisma.supportTicket.count({ where: { ...where, status: TicketStatus.IN_PROGRESS } }),
      this.prisma.supportTicket.count({ where: { ...where, status: TicketStatus.WAITING } }),
      this.prisma.supportTicket.count({ where: { ...where, status: TicketStatus.RESOLVED } }),
      this.prisma.supportTicket.count({ where: { ...where, status: TicketStatus.CLOSED } }),
    ])
    return { open, inProgress, waiting, resolved, closed, total: open + inProgress + waiting + resolved + closed }
  }
}
