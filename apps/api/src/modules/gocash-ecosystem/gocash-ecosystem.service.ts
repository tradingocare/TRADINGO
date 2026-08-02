import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { GocashService } from '../gocash/gocash.service';
import { NotificationService } from '../notification/notification.service';
import {
  EcosystemXPReason,
  EcosystemMissionActionType,
  EcosystemMissionPeriod,
  EcosystemStreakType,
  EcosystemEntityStatus,
  EcosystemLevelName,
  NotificationType,
} from '@prisma/client';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { UpdateAchievementDto } from './dto/update-achievement.dto';
import { UpdateBadgeDto } from './dto/update-badge.dto';

const LEVEL_XP_THRESHOLDS: Record<string, number> = {
  BRONZE: 0,
  SILVER: 500,
  GOLD: 1500,
  PLATINUM: 3000,
  DIAMOND: 6000,
  TITANIUM: 12000,
  ELITE: 25000,
  LEGEND: 50000,
};

const levels: { name: EcosystemLevelName; levelNumber: number; minXP: number; maxXP: number; benefits: any[]; rewards: Record<string, any>[]; sortOrder: number }[] = [
  { name: 'BRONZE', levelNumber: 1, minXP: 0, maxXP: 499, benefits: [], rewards: [], sortOrder: 1 },
  { name: 'SILVER', levelNumber: 2, minXP: 500, maxXP: 1499, benefits: [], rewards: [{ type: 'GOCASH', amount: 50 }], sortOrder: 2 },
  { name: 'GOLD', levelNumber: 3, minXP: 1500, maxXP: 2999, benefits: [], rewards: [{ type: 'GOCASH', amount: 150 }], sortOrder: 3 },
  { name: 'PLATINUM', levelNumber: 4, minXP: 3000, maxXP: 5999, benefits: [], rewards: [{ type: 'GOCASH', amount: 300 }], sortOrder: 4 },
  { name: 'DIAMOND', levelNumber: 5, minXP: 6000, maxXP: 11999, benefits: [], rewards: [{ type: 'GOCASH', amount: 600 }], sortOrder: 5 },
  { name: 'TITANIUM', levelNumber: 6, minXP: 12000, maxXP: 24999, benefits: [], rewards: [{ type: 'GOCASH', amount: 1200 }], sortOrder: 6 },
  { name: 'ELITE', levelNumber: 7, minXP: 25000, maxXP: 49999, benefits: [], rewards: [{ type: 'GOCASH', amount: 2500 }], sortOrder: 7 },
  { name: 'LEGEND', levelNumber: 8, minXP: 50000, maxXP: 999999, benefits: [], rewards: [{ type: 'GOCASH', amount: 5000 }], sortOrder: 8 },
];

const XP_REWARD_MAP: Partial<Record<EcosystemXPReason, number>> = {
  LOGIN: 10,
  SEARCH: 2,
  RFQ_CREATED: 25,
  QUOTE_SUBMITTED: 15,
  QUOTE_ACCEPTED: 50,
  ORDER_COMPLETED: 100,
  ORDER_DELIVERED: 75,
  PAYMENT_MADE: 30,
  REFERRAL_SUBMITTED: 20,
  REFERRAL_CONVERTED: 100,
  REVIEW_GIVEN: 10,
  REVIEW_RECEIVED: 5,
  AI_USAGE: 5,
  CAMPAIGN_PARTICIPATION: 30,
  NEGOTIATION_COMPLETED: 40,
  DELIVERY_CONFIRMED: 50,
  MEMBERSHIP_PURCHASED: 200,
  PROFILE_COMPLETED: 50,
  KYC_COMPLETED: 100,
  PRODUCT_UPLOADED: 20,
  CRM_ACTIVITY: 15,
  RM_ACTIVITY: 15,
  ADMIN_ACTIVITY: 10,
  BADGE_EARNED: 50,
  ACHIEVEMENT_UNLOCKED: 100,
  LEVEL_UP: 0,
  MILESTONE_REACHED: 75,
  DAILY_CHECKIN: 5,
  STREAK_BONUS: 50,
  WEEKLY_COMPLETION: 100,
  MONTHLY_COMPLETION: 500,
  MISSION_COMPLETED: 100,
  LEADERBOARD_RANK: 200,
};

const ACTION_TYPE_XP_REASON_MAP: Partial<Record<EcosystemMissionActionType, EcosystemXPReason>> = {
  LOGIN: EcosystemXPReason.LOGIN,
  RFQ_CREATE: EcosystemXPReason.RFQ_CREATED,
  QUOTE_SUBMIT: EcosystemXPReason.QUOTE_SUBMITTED,
  ORDER_COMPLETE: EcosystemXPReason.ORDER_COMPLETED,
  PRODUCT_UPLOAD: EcosystemXPReason.PRODUCT_UPLOADED,
  REFERRAL_SEND: EcosystemXPReason.REFERRAL_SUBMITTED,
  AI_USE: EcosystemXPReason.AI_USAGE,
  REVIEW_GIVE: EcosystemXPReason.REVIEW_GIVEN,
  KYC_COMPLETE: EcosystemXPReason.KYC_COMPLETED,
  PROFILE_COMPLETE: EcosystemXPReason.PROFILE_COMPLETED,
  NEGOTIATION_WIN: EcosystemXPReason.NEGOTIATION_COMPLETED,
  DELIVERY_CONFIRM: EcosystemXPReason.DELIVERY_CONFIRMED,
  PAYMENT_MAKE: EcosystemXPReason.PAYMENT_MADE,
  CAMPAIGN_JOIN: EcosystemXPReason.CAMPAIGN_PARTICIPATION,
  SEARCH_USE: EcosystemXPReason.SEARCH,
};

function getPeriodBounds(period: EcosystemMissionPeriod): { start: Date; end: Date } {
  const now = new Date();
  switch (period) {
    case 'DAILY': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start); end.setDate(end.getDate() + 1);
      return { start, end };
    }
    case 'WEEKLY': {
      const d = new Date(now); d.setDate(d.getDate() - d.getDay());
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(start); end.setDate(end.getDate() + 7);
      return { start, end };
    }
    case 'MONTHLY': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { start, end };
    }
  }
}

@Injectable()
export class GocashEcosystemService {
  private readonly logger = new Logger(GocashEcosystemService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gocashService: GocashService,
    private readonly notificationService: NotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private getXpAmount(reason: EcosystemXPReason): number {
    return XP_REWARD_MAP[reason] ?? 10;
  }

  private async getOrCreateUserLevel(userId: string, companyId?: string) {
    let userLevel = await this.prisma.ecosystemUserLevel.findUnique({
      where: { userId },
      include: { currentLevel: true },
    });
    if (!userLevel) {
      const bronze = await this.prisma.ecosystemLevel.findFirst({ where: { name: 'BRONZE' } });
      if (!bronze) throw new NotFoundException('BRONZE level not seeded');
      userLevel = await this.prisma.ecosystemUserLevel.create({
        data: { userId, companyId, currentLevelId: bronze.id, totalXP: 0 },
        include: { currentLevel: true },
      });
    }
    return userLevel;
  }

  private async checkLevelUp(userId: string, companyId: string | undefined) {
    const userLevel = await this.getOrCreateUserLevel(userId, companyId);
    const currentLevelName = userLevel.currentLevel.name;
    const totalXp = userLevel.totalXP;
    const levelOrder: EcosystemLevelName[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'TITANIUM', 'ELITE', 'LEGEND'];
    const currentIdx = levelOrder.indexOf(currentLevelName);
    for (let i = currentIdx + 1; i < levelOrder.length; i++) {
      const nextName = levelOrder[i];
      const threshold = LEVEL_XP_THRESHOLDS[nextName];
      if (totalXp >= threshold) {
        const nextLevel = await this.prisma.ecosystemLevel.findUnique({ where: { name: nextName } });
        if (!nextLevel) continue;
        await this.prisma.ecosystemUserLevel.update({
          where: { userId },
          data: { currentLevelId: nextLevel.id, maxLevelReached: nextName, lastLevelUpAt: new Date() },
        });
        this.logger.log(`User ${userId} leveled up to ${nextName}`);
        this.eventEmitter.emit('ecosystem.level.up', { userId, companyId, oldLevel: currentLevelName, newLevel: nextName });
        await this.awardXp(userId, companyId, EcosystemXPReason.LEVEL_UP);
        await this.processLevelRewards(userId, companyId, nextLevel.rewards as Record<string, any>[]);
      }
    }
  }

  private async processLevelRewards(userId: string, companyId: string | undefined, rewards: Record<string, any>[]) {
    if (!rewards || !Array.isArray(rewards)) return;
    for (const reward of rewards) {
      if (reward.type === 'GOCASH' && reward.amount) {
        try {
          const wallet = await this.gocashService.getWalletByUserId(userId);
          if (wallet) {
            await this.gocashService.credit({
              walletId: wallet.id,
              amount: Number(reward.amount),
              type: 'ADJUSTMENT',
              reason: 'Level up reward',
              actorId: userId,
              actorType: 'USER',
              referenceId: userId,
              referenceType: 'USER',
            });
          }
        } catch (e) {
          this.logger.error(`Failed to process gocash reward: ${e}`);
        }
      }
    }
  }

  async awardXp(userId: string, companyId: string | undefined, reason: EcosystemXPReason, metadata?: Record<string, any>) {
    const amount = this.getXpAmount(reason);
    await this.prisma.ecosystemXPTransaction.create({
      data: { userId, companyId, amount, reason, metadata: metadata ?? {} },
    });
    const userLevel = await this.getOrCreateUserLevel(userId, companyId);
    await this.prisma.ecosystemUserLevel.update({
      where: { userId },
      data: { totalXP: { increment: amount } },
    });
    await this.checkLevelUp(userId, companyId);
  }

  async getXpBalance(userId: string) {
    return this.getOrCreateUserLevel(userId);
  }

  async getXpHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.ecosystemXPTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      this.prisma.ecosystemXPTransaction.count({ where: { userId } }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrevious: page > 1 } };
  }

  async getLevels() {
    return this.prisma.ecosystemLevel.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async getBadges(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    return this.prisma.ecosystemBadge.findMany({ where, orderBy: { sortOrder: 'asc' } });
  }

  async getUserBadges(userId: string) {
    return this.prisma.ecosystemUserBadge.findMany({
      where: { userId }, include: { badge: true }, orderBy: { earnedAt: 'desc' },
    });
  }

  async assignBadge(userId: string, badgeId: string, companyId?: string) {
    const existing = await this.prisma.ecosystemUserBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId } },
    });
    if (existing) return existing;
    const ub = await this.prisma.ecosystemUserBadge.create({ data: { userId, badgeId, companyId } });
    this.eventEmitter.emit('ecosystem.badge.earned', { userId, companyId, badgeId });
    await this.awardXp(userId, companyId, EcosystemXPReason.BADGE_EARNED);
    return ub;
  }

  async getMissions(userId: string, period?: EcosystemMissionPeriod) {
    const where: any = { isActive: true };
    if (period) where.period = period;
    const missions = await this.prisma.ecosystemMission.findMany({ where, orderBy: { sortOrder: 'asc' } });
    const userMissions = await this.prisma.ecosystemUserMission.findMany({ where: { userId } });
    const userMissionMap = new Map(userMissions.map((um) => [um.missionId, um]));
    return missions.map((m) => ({ ...m, userProgress: userMissionMap.get(m.id) ?? null }));
  }

  async getUserMissions(userId: string, status?: EcosystemEntityStatus) {
    const where: any = { userId };
    if (status) where.status = status;
    return this.prisma.ecosystemUserMission.findMany({
      where, include: { mission: true }, orderBy: { createdAt: 'desc' },
    });
  }

  async getAchievements(userId: string) {
    const achievements = await this.prisma.ecosystemAchievement.findMany({
      where: { isActive: true, hidden: false }, orderBy: { sortOrder: 'asc' },
    });
    const userAchievements = await this.prisma.ecosystemUserAchievement.findMany({ where: { userId } });
    const uaMap = new Map(userAchievements.map((ua) => [ua.achievementId, ua]));
    return achievements.map((a) => ({ ...a, userProgress: uaMap.get(a.id) ?? null }));
  }

  async getUserAchievements(userId: string, status?: EcosystemEntityStatus) {
    const where: any = { userId };
    if (status) where.status = status;
    return this.prisma.ecosystemUserAchievement.findMany({
      where, include: { achievement: true }, orderBy: { createdAt: 'desc' },
    });
  }

  async dailyCheckin(userId: string, companyId?: string) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const existing = await this.prisma.ecosystemDailyCheckin.findUnique({
      where: { userId_checkinDate_streakType: { userId, checkinDate: today, streakType: 'DAILY_CHECKIN' } },
    });
    if (existing) throw new BadRequestException('Already checked in today');

    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const prevStreak = await this.prisma.ecosystemStreak.findUnique({
      where: { userId_streakType: { userId, streakType: 'DAILY_CHECKIN' } },
    });
    const wasActiveYesterday = await this.prisma.ecosystemDailyCheckin.findUnique({
      where: { userId_checkinDate_streakType: { userId, checkinDate: yesterday, streakType: 'DAILY_CHECKIN' } },
    });
    const newCount = wasActiveYesterday && prevStreak ? prevStreak.currentCount + 1 : 1;
    const bonusEarned = newCount > 0 && newCount % 7 === 0;

    await this.prisma.$transaction([
      this.prisma.ecosystemDailyCheckin.create({
        data: { userId, companyId, checkinDate: today, streakCount: newCount, streakType: 'DAILY_CHECKIN', bonusEarned, xpEarned: this.getXpAmount(EcosystemXPReason.DAILY_CHECKIN) },
      }),
      this.prisma.ecosystemStreak.upsert({
        where: { userId_streakType: { userId, streakType: 'DAILY_CHECKIN' } },
        update: { currentCount: newCount, maxCount: Math.max(newCount, prevStreak?.maxCount ?? 0), lastCheckinAt: new Date() },
        create: { userId, companyId, streakType: 'DAILY_CHECKIN', currentCount: newCount, maxCount: newCount, lastCheckinAt: new Date() },
      }),
    ]);

    await this.awardXp(userId, companyId, EcosystemXPReason.DAILY_CHECKIN);
    if (bonusEarned) {
      await this.awardXp(userId, companyId, EcosystemXPReason.STREAK_BONUS, { streakCount: newCount });
    }
    this.eventEmitter.emit('ecosystem.checkin.completed', { userId, companyId, streakCount: newCount, bonusEarned });
    return { streakCount: newCount, bonusEarned };
  }

  async getDailyCheckinHistory(userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    return this.prisma.ecosystemDailyCheckin.findMany({
      where: { userId, checkinDate: { gte: startDate, lte: endDate } },
      orderBy: { checkinDate: 'asc' },
    });
  }

  async getStreaks(userId: string) {
    return this.prisma.ecosystemStreak.findMany({ where: { userId } });
  }

  async getDashboard(userId: string, companyId?: string) {
    const userLevel = await this.getOrCreateUserLevel(userId, companyId);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const [badges, achievements, completedMissions, activeMissions, streaks, xpRecent, todayXpResult, todayRewardsCount, activeMission] = await Promise.all([
      this.prisma.ecosystemUserBadge.count({ where: { userId } }),
      this.prisma.ecosystemUserAchievement.count({ where: { userId, status: 'COMPLETED' as EcosystemEntityStatus } }),
      this.prisma.ecosystemUserMission.count({ where: { userId, status: 'COMPLETED' as EcosystemEntityStatus } }),
      this.prisma.ecosystemUserMission.count({ where: { userId, status: 'ACTIVE' as EcosystemEntityStatus } }),
      this.prisma.ecosystemStreak.findMany({ where: { userId } }),
      this.prisma.ecosystemXPTransaction.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 10 }),
      this.prisma.ecosystemXPTransaction.aggregate({
        where: { userId, createdAt: { gte: today, lt: tomorrow } },
        _sum: { amount: true },
      }),
      this.prisma.ecosystemXPTransaction.count({
        where: { userId, createdAt: { gte: today, lt: tomorrow } },
      }),
      this.prisma.ecosystemUserMission.findFirst({
        where: { userId, status: 'ACTIVE' as EcosystemEntityStatus },
        include: { mission: true },
        orderBy: { mission: { xpReward: 'desc' } },
      }),
    ]);
    const checkedInToday = await this.prisma.ecosystemDailyCheckin.findUnique({
      where: { userId_checkinDate_streakType: { userId, checkinDate: today, streakType: 'DAILY_CHECKIN' } },
    });
    const currentStreak = streaks.find((s) => s.streakType === 'DAILY_CHECKIN')?.currentCount ?? 0;
    const nextLevelXp = this.getNextLevelXp(userLevel.currentLevel.name);
    const xpPerDay = todayXpResult._sum.amount ?? 0;
    const daysToNextLevel = xpPerDay > 0 && nextLevelXp > userLevel.totalXP
      ? Math.ceil((nextLevelXp - userLevel.totalXP) / xpPerDay)
      : 0;
    const businessImpact = xpPerDay > 0
      ? `On track to reach next level in ~${daysToNextLevel} days`
      : 'Complete missions to level up faster';
    return {
      level: userLevel.currentLevel,
      totalXp: userLevel.totalXP,
      nextLevelXp,
      badges, achievements, completedMissions, activeMissions,
      streaks: streaks.map((s) => ({ streakType: s.streakType, currentCount: s.currentCount, maxCount: s.maxCount })),
      checkedInToday: !!checkedInToday,
      currentStreak,
      recentXp: xpRecent,
      todayXp: xpPerDay,
      todayRewards: todayRewardsCount,
      todayMission: activeMission?.mission?.name ?? null,
      recommendedAction: activeMission ? `Complete "${activeMission.mission.name}" for +${activeMission.mission.xpReward} XP` : currentStreak === 0 ? 'Start your daily check-in streak' : 'Complete missions to earn XP',
      businessImpact,
    };
  }

  private getNextLevelXp(current: EcosystemLevelName): number {
    const levelOrder: EcosystemLevelName[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'TITANIUM', 'ELITE', 'LEGEND'];
    const idx = levelOrder.indexOf(current);
    if (idx >= levelOrder.length - 1) return LEVEL_XP_THRESHOLDS[current];
    return LEVEL_XP_THRESHOLDS[levelOrder[idx + 1]];
  }

  async aiRewardIntelligence(userId: string, companyId?: string) {
    const userLevel = await this.getOrCreateUserLevel(userId, companyId);
    const xpStats = await this.prisma.ecosystemXPTransaction.groupBy({
      by: ['reason'],
      where: { userId, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      _sum: { amount: true }, _count: true,
    });
    const streaks = await this.prisma.ecosystemStreak.findMany({ where: { userId } });
    const pendingAchievements = await this.prisma.ecosystemUserAchievement.count({ where: { userId, status: 'ACTIVE' as EcosystemEntityStatus } });
    const pendingMissions = await this.prisma.ecosystemUserMission.count({ where: { userId, status: 'ACTIVE' as EcosystemEntityStatus } });
    const lowActivity: string[] = [];
    const reasonCounts = new Map(xpStats.map((s) => [s.reason, s._count ?? 0]));
    if ((reasonCounts.get('LOGIN') ?? 0) < 3) lowActivity.push('Encourage daily login habit');
    if ((reasonCounts.get('RFQ_CREATED') ?? 0) < 1) lowActivity.push('Create more RFQs to earn XP');
    if ((reasonCounts.get('QUOTE_SUBMITTED') ?? 0) < 1) lowActivity.push('Submit more quotes for XP');
    if ((reasonCounts.get('AI_USAGE') ?? 0) < 1) lowActivity.push('Use AI features for quick XP');
    if (streaks.every((s) => s.streakType !== 'DAILY_CHECKIN' || s.currentCount === 0)) lowActivity.push('Start a daily check-in streak');
    if (pendingAchievements > 0) lowActivity.push(`${pendingAchievements} achievements nearly complete`);
    if (pendingMissions > 0) lowActivity.push(`${pendingMissions} active missions to complete`);

    const nextLevel = this.getNextLevelXp(userLevel.currentLevel.name);
    const progress = nextLevel > 0 ? Math.round((userLevel.totalXP / nextLevel) * 100) : 100;
    return {
      level: userLevel.currentLevel.name,
      totalXp: userLevel.totalXP,
      nextLevelXp: nextLevel, progress,
      xpBreakdown: xpStats,
      streaks: streaks.map((s) => ({ type: s.streakType, current: s.currentCount, max: s.maxCount })),
      recommendations: lowActivity,
    };
  }

  async getAdminDashboard() {
    const [totalUsers, totalXp, totalCheckins, totalBadges, totalMissions, totalAchievements] = await Promise.all([
      this.prisma.ecosystemUserLevel.count(),
      this.prisma.ecosystemXPTransaction.aggregate({ _sum: { amount: true } }),
      this.prisma.ecosystemDailyCheckin.count(),
      this.prisma.ecosystemUserBadge.count(),
      this.prisma.ecosystemUserMission.count(),
      this.prisma.ecosystemUserAchievement.count(),
    ]);
    return { totalUsers, totalXp: totalXp._sum.amount ?? 0, totalCheckins, totalBadges, totalMissions, totalAchievements };
  }

  async getAdminXpChart(days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const data = await this.prisma.ecosystemXPTransaction.findMany({ where: { createdAt: { gte: startDate } }, orderBy: { createdAt: 'asc' } });
    const chart = new Map<string, number>();
    data.forEach((tx) => { const key = tx.createdAt.toISOString().slice(0, 10); chart.set(key, (chart.get(key) ?? 0) + tx.amount); });
    return Array.from(chart.entries()).map(([date, amount]) => ({ date, amount }));
  }

  async createMission(data: {
    name: string; description?: string; period: EcosystemMissionPeriod;
    actionType: EcosystemMissionActionType; targetCount: number;
    xpReward?: number; gocashReward?: number; badgeId?: string;
    requirements?: any; startDate?: string; endDate?: string; sortOrder?: number;
  }) {
    return this.prisma.ecosystemMission.create({
      data: {
        name: data.name, description: data.description, period: data.period,
        actionType: data.actionType, targetCount: data.targetCount,
        xpReward: data.xpReward ?? 0,
        gocashReward: data.gocashReward ? Number(data.gocashReward) : undefined,
        badgeId: data.badgeId, requirements: data.requirements,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async updateMission(id: string, data: UpdateMissionDto) {
    return this.prisma.ecosystemMission.update({ where: { id }, data });
  }

  async deleteMission(id: string) {
    return this.prisma.ecosystemMission.delete({ where: { id } });
  }

  async createAchievement(data: {
    name: string; description?: string; icon?: string; color?: string;
    category?: string; criteria?: any; xpReward?: number;
    gocashReward?: number; badgeId?: string; sortOrder?: number; hidden?: boolean;
  }) {
    return this.prisma.ecosystemAchievement.create({
      data: {
        name: data.name,
        slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: data.description, icon: data.icon, color: data.color,
        category: data.category, criteria: data.criteria,
        xpReward: data.xpReward ?? 0,
        gocashReward: data.gocashReward ? Number(data.gocashReward) : undefined,
        badgeId: data.badgeId, sortOrder: data.sortOrder ?? 0, hidden: data.hidden ?? false,
      },
    });
  }

  async updateAchievement(id: string, data: UpdateAchievementDto) {
    return this.prisma.ecosystemAchievement.update({ where: { id }, data });
  }

  async deleteAchievement(id: string) {
    return this.prisma.ecosystemAchievement.delete({ where: { id } });
  }

  async createBadge(data: {
    name: string; description?: string; icon?: string; color?: string;
    category?: string; criteria?: any; rewards?: any; sortOrder?: number;
  }) {
    return this.prisma.ecosystemBadge.create({
      data: {
        name: data.name,
        slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: data.description, icon: data.icon, color: data.color,
        category: data.category, criteria: data.criteria, rewards: data.rewards,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async updateBadge(id: string, data: UpdateBadgeDto) {
    return this.prisma.ecosystemBadge.update({ where: { id }, data });
  }

  async deleteBadge(id: string) {
    return this.prisma.ecosystemBadge.delete({ where: { id } });
  }

  async getUserSummary(userId: string) {
    const userLevel = await this.getOrCreateUserLevel(userId);
    const [badges, achievements, missions, streaks, xpRecent] = await Promise.all([
      this.prisma.ecosystemUserBadge.findMany({ where: { userId }, include: { badge: true }, orderBy: { earnedAt: 'desc' } }),
      this.prisma.ecosystemUserAchievement.findMany({ where: { userId, status: 'COMPLETED' as EcosystemEntityStatus }, include: { achievement: true }, orderBy: { completedAt: 'desc' } }),
      this.prisma.ecosystemUserMission.findMany({ where: { userId, status: 'ACTIVE' as EcosystemEntityStatus }, include: { mission: true }, orderBy: { createdAt: 'desc' }, take: 5 }),
      this.prisma.ecosystemStreak.findMany({ where: { userId } }),
      this.prisma.ecosystemXPTransaction.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);
    return {
      level: userLevel.currentLevel, totalXp: userLevel.totalXP,
      badges, achievements, activeMissions: missions, streaks, recentXp: xpRecent,
    };
  }

  async processMissionProgress(actionType: EcosystemMissionActionType, userId: string, companyId?: string) {
    const activeMissions = await this.prisma.ecosystemMission.findMany({ where: { actionType, isActive: true } });
    for (const mission of activeMissions) {
      const pb = getPeriodBounds(mission.period);
      const existing = await this.prisma.ecosystemUserMission.findFirst({
        where: { userId, missionId: mission.id, periodStart: pb.start, periodEnd: pb.end },
      });
      if (existing) {
        if (existing.status === 'COMPLETED') continue;
        const updated = await this.prisma.ecosystemUserMission.update({
          where: { id: existing.id },
          data: { progress: { increment: 1 } },
        });
        if (updated.progress >= mission.targetCount) {
          await this.completeMission(updated.id, userId, companyId, mission);
        }
      } else {
        const created = await this.prisma.ecosystemUserMission.create({
          data: { userId, companyId, missionId: mission.id, progress: 1, targetCount: mission.targetCount, periodStart: pb.start, periodEnd: pb.end },
        });
        if (created.progress >= mission.targetCount) {
          await this.completeMission(created.id, userId, companyId, mission);
        }
      }
    }
  }

  private async completeMission(userMissionId: string, userId: string, companyId: string | undefined, mission: Record<string, any>) {
    await this.prisma.ecosystemUserMission.update({
      where: { id: userMissionId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
    this.eventEmitter.emit('ecosystem.mission.completed', { userId, companyId, missionId: mission.id, missionName: mission.name });
    if (mission.xpReward > 0) {
      await this.prisma.ecosystemXPTransaction.create({
        data: { userId, companyId, amount: mission.xpReward, reason: 'MISSION_COMPLETED', metadata: { missionId: mission.id, bonus: true } },
      });
      await this.prisma.ecosystemUserLevel.update({
        where: { userId }, data: { totalXP: { increment: mission.xpReward } },
      });
      await this.checkLevelUp(userId, companyId);
    }
    if (mission.gocashReward) {
      try {
        const wallet = await this.gocashService.getWalletByUserId(userId);
        if (wallet) {
          await this.gocashService.credit({
            walletId: wallet.id, amount: Number(mission.gocashReward),
            type: 'ADJUSTMENT', reason: `Mission completed: ${mission.name}`,
            actorId: userId, actorType: 'USER', referenceId: mission.id, referenceType: 'MISSION',
          });
        }
      } catch (e) { this.logger.error(`Failed to process gocash reward for mission ${mission.id}: ${e}`); }
    }
    if (mission.badgeId) {
      await this.assignBadge(userId, mission.badgeId, companyId);
    }
  }

  async seedInitialData() {
    const existingLevels = await this.prisma.ecosystemLevel.count();
    if (existingLevels === 0) {
      await this.prisma.ecosystemLevel.createMany({ data: levels });
      this.logger.log('Levels seeded');
    } else {
      this.logger.log('Levels already seeded');
    }

    const existingBadges = await this.prisma.ecosystemBadge.count();
    if (existingBadges === 0) {
      const badges = [
        { name: 'Early Adopter', slug: 'early-adopter', description: 'One of the first users on the platform', icon: '🌟', category: 'milestone', sortOrder: 1 },
        { name: 'First Trade', slug: 'first-trade', description: 'Completed your first trade', icon: '🤝', category: 'trading', sortOrder: 2 },
        { name: 'Streak Master', slug: 'streak-master', description: 'Maintained a 30-day login streak', icon: '🔥', category: 'engagement', sortOrder: 3 },
        { name: 'RFQ Pro', slug: 'rfq-pro', description: 'Created 50 RFQs', icon: '📋', category: 'trading', sortOrder: 4 },
        { name: 'Quote Champion', slug: 'quote-champion', description: 'Submitted 100 quotes', icon: '💬', category: 'trading', sortOrder: 5 },
        { name: 'Deal Closer', slug: 'deal-closer', description: 'Closed 25 deals', icon: '✅', category: 'trading', sortOrder: 6 },
        { name: 'Social Butterfly', slug: 'social-butterfly', description: 'Referred 10 friends', icon: '🦋', category: 'referral', sortOrder: 7 },
        { name: 'AI Explorer', slug: 'ai-explorer', description: 'Used AI features 100 times', icon: '🤖', category: 'innovation', sortOrder: 8 },
        { name: 'Trusted Seller', slug: 'trusted-seller', description: 'Achieved TradTrust score of 900+', icon: '🏆', category: 'reputation', sortOrder: 9 },
        { name: 'Verified Buyer', slug: 'verified-buyer', description: 'Completed KYC verification', icon: '🛡️', category: 'verification', sortOrder: 10 },
        { name: 'Globetrotter', slug: 'globetrotter', description: 'Traded across 10+ countries', icon: '🌍', category: 'trading', sortOrder: 11 },
        { name: 'Mentor', slug: 'mentor', description: 'Helped 5 new sellers onboard', icon: '🎓', category: 'community', sortOrder: 12 },
      ];
      await this.prisma.ecosystemBadge.createMany({ data: badges });
      this.logger.log('Badges seeded');
    } else {
      this.logger.log('Badges already seeded');
    }
  }

  @OnEvent('ecosystem.checkin.completed')
  async handleCheckinCompleted(payload: Record<string, any>) {
    this.logger.log(`Checkin completed for user ${payload.userId}, streak: ${payload.streakCount}`);
    if (payload.companyId && payload.userId) {
      try {
        const badge = payload.bonusEarned ? '🔥' : '✅';
        await this.notificationService.createWithTemplate(
          payload.companyId, payload.userId,
          NotificationType.DAILY_CHECKIN,
          { streakCount: payload.streakCount, xpEarned: '5' },
          { sourceModule: 'ECOSYSTEM', link: '/buyer/ecosystem' },
        );
      } catch (e) { this.logger.error(`Failed to send checkin notification: ${e}`); }
    }
  }

  @OnEvent('ecosystem.level.up')
  async handleLevelUp(payload: Record<string, any>) {
    this.logger.log(`User ${payload.userId} leveled up to ${payload.newLevel}`);
    if (payload.companyId && payload.userId) {
      try {
        await this.notificationService.createWithTemplate(
          payload.companyId, payload.userId,
          NotificationType.LEVEL_UP,
          { newLevel: payload.newLevel, oldLevel: payload.oldLevel },
          { sourceModule: 'ECOSYSTEM', link: '/buyer/ecosystem' },
        );
      } catch (e) { this.logger.error(`Failed to send level up notification: ${e}`); }
    }
  }

  @OnEvent('ecosystem.badge.earned')
  async handleBadgeEarned(payload: Record<string, any>) {
    this.logger.log(`Badge earned by user ${payload.userId}`);
    if (payload.companyId && payload.userId) {
      try {
        const badge = await this.prisma.ecosystemBadge.findUnique({ where: { id: payload.badgeId } });
        await this.notificationService.createWithTemplate(
          payload.companyId, payload.userId,
          NotificationType.BADGE_EARNED,
          { badgeName: badge?.name ?? 'New Badge' },
          { sourceModule: 'ECOSYSTEM', link: '/buyer/ecosystem' },
        );
      } catch (e) { this.logger.error(`Failed to send badge notification: ${e}`); }
    }
  }

  @OnEvent('ecosystem.mission.completed')
  async handleMissionCompleted(payload: Record<string, any>) {
    this.logger.log(`Mission ${payload.missionName} completed by user ${payload.userId}`);
    if (payload.companyId && payload.userId) {
      try {
        await this.notificationService.createWithTemplate(
          payload.companyId, payload.userId,
          NotificationType.MISSION_COMPLETED,
          { missionName: payload.missionName, xpReward: '100', gocashReward: '0' },
          { sourceModule: 'ECOSYSTEM', link: '/buyer/ecosystem' },
        );
      } catch (e) { this.logger.error(`Failed to send mission notification: ${e}`); }
    }
  }
}
