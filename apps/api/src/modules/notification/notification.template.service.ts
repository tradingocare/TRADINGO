import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationChannel, NotificationType } from '@prisma/client';

interface RenderedTemplate {
  subject: string;
  title: string;
  body: string;
}

const FALLBACK_TEMPLATES: Record<string, { title: string; body: string; emailSubject: string }> = {
  // RFQ
  RFQ_CREATED: { title: 'RFQ Created', body: 'Your RFQ "{{rfqTitle}}" has been created successfully.', emailSubject: 'RFQ Created – Tradingo' },
  RFQ_MATCH: { title: 'New RFQ Match', body: 'Your RFQ "{{rfqTitle}}" has a new match from {{vendorName}}.', emailSubject: 'New RFQ Match – Tradingo' },
  QUOTE_RECEIVED: { title: 'New Quote Received', body: 'A new quote has been submitted for RFQ "{{rfqTitle}}" by {{vendorName}}.', emailSubject: 'New Quote Received – Tradingo' },
  QUOTE_ACCEPTED: { title: 'Quote Accepted', body: 'Your quote for RFQ "{{rfqTitle}}" has been accepted by {{buyerName}}.', emailSubject: 'Quote Accepted – Tradingo' },
  QUOTE_REJECTED: { title: 'Quote Declined', body: 'Your quote for RFQ "{{rfqTitle}}" was not selected.', emailSubject: 'Quote Update – Tradingo' },
  QUOTE_WITHDRAWN: { title: 'Quote Withdrawn', body: '{{vendorName}} has withdrawn their quote for RFQ "{{rfqTitle}}".', emailSubject: 'Quote Withdrawn – Tradingo' },
  QUOTE_EXPIRED: { title: 'Quote Expired', body: 'Your quote for RFQ "{{rfqTitle}}" has expired.', emailSubject: 'Quote Expired – Tradingo' },
  RFQ_CLOSED: { title: 'RFQ Closed', body: 'Your RFQ "{{rfqTitle}}" has been closed.', emailSubject: 'RFQ Closed – Tradingo' },
  RFQ_REOPENED: { title: 'RFQ Reopened', body: 'Your RFQ "{{rfqTitle}}" has been reopened for new quotes.', emailSubject: 'RFQ Reopened – Tradingo' },
  RFQ_EXPIRED: { title: 'RFQ Expired', body: 'Your RFQ "{{rfqTitle}}" has expired.', emailSubject: 'RFQ Expired – Tradingo' },

  // Order
  ORDER_CONFIRMED: { title: 'Order Confirmed', body: 'Order {{orderNumber}} has been confirmed.', emailSubject: 'Order Confirmed – Tradingo' },
  ORDER_PROCESSING: { title: 'Order Processing', body: 'Order {{orderNumber}} is now being processed.', emailSubject: 'Order Processing – Tradingo' },
  ORDER_DISPATCHED: { title: 'Order Dispatched', body: 'Order {{orderNumber}} has been dispatched.', emailSubject: 'Order Dispatched – Tradingo' },
  ORDER_DELIVERED: { title: 'Order Delivered', body: 'Order {{orderNumber}} has been delivered successfully.', emailSubject: 'Order Delivered – Tradingo' },
  ORDER_COMPLETED: { title: 'Order Completed', body: 'Order {{orderNumber}} has been completed successfully.', emailSubject: 'Order Completed – Tradingo' },
  ORDER_CANCELLED: { title: 'Order Cancelled', body: 'Order {{orderNumber}} has been cancelled.', emailSubject: 'Order Cancelled – Tradingo' },
  ORDER_RETURNED: { title: 'Return Requested', body: 'A return has been initiated for order {{orderNumber}}.', emailSubject: 'Return Requested – Tradingo' },
  ORDER_RETURN_APPROVED: { title: 'Return Approved', body: 'Your return for order {{orderNumber}} has been approved.', emailSubject: 'Return Approved – Tradingo' },
  ORDER_RETURN_REJECTED: { title: 'Return Rejected', body: 'Your return for order {{orderNumber}} was not approved.', emailSubject: 'Return Update – Tradingo' },

  // Payment
  PAYMENT_RECEIVED: { title: 'Payment Received', body: 'Payment of ₹{{amount}} has been received successfully.', emailSubject: 'Payment Confirmed – Tradingo' },
  PAYMENT_FAILED: { title: 'Payment Failed', body: 'Your payment of ₹{{amount}} has failed. Reason: {{reason}}', emailSubject: 'Payment Failed – Tradingo' },
  PAYMENT_REFUNDED: { title: 'Refund Processed', body: '₹{{amount}} has been refunded to your account.', emailSubject: 'Refund Processed – Tradingo' },
  CREDIT_PACK_PURCHASED: { title: 'Credit Pack Purchased', body: 'Your {{credits}} credit pack has been activated successfully.', emailSubject: 'Credit Pack Activated – Tradingo' },
  PAYOUT_PROCESSED: { title: 'Payout Processed', body: '₹{{amount}} has been sent to your bank account (Net: ₹{{netAmount}}).', emailSubject: 'Payout Processed – Tradingo' },
  PAYOUT_FAILED: { title: 'Payout Failed', body: 'Payout of ₹{{amount}} has failed. Reason: {{reason}}', emailSubject: 'Payout Failed – Tradingo' },

  // GoCash
  GOCASH_EARNED: { title: 'GoCash Credited', body: 'You earned ₹{{amount}} GoCash. Balance: ₹{{balance}}.', emailSubject: 'GoCash Credited – Tradingo' },
  GOCASH_REDEEMED: { title: 'GoCash Redeemed', body: '₹{{amount}} GoCash has been redeemed for {{redemptionType}}.', emailSubject: 'GoCash Redeemed – Tradingo' },
  GOCASH_EXPIRED: { title: 'GoCash Expired', body: '₹{{amount}} GoCash has expired from your account.', emailSubject: 'GoCash Expired – Tradingo' },
  GOCASH_REWARD: { title: 'GoCash Reward', body: '{{message}}', emailSubject: 'GoCash Reward – Tradingo' },
  TRADGO_MILESTONE: { title: 'TradGo Milestone', body: 'Congratulations! You reached the {{milestoneName}} milestone and earned ₹{{reward}} GoCash!', emailSubject: 'TradGo Milestone – Tradingo' },

  // Subscription
  PLAN_EXPIRY_WARNING: { title: 'Plan Expiring Soon', body: 'Your {{plan}} plan will expire in {{days}} days on {{expiryDate}}.', emailSubject: 'Plan Expiring Soon – Tradingo' },
  SUBSCRIPTION_RENEWED: { title: 'Subscription Renewed', body: 'Your {{plan}} plan has been renewed successfully.', emailSubject: 'Subscription Renewed – Tradingo' },
  SUBSCRIPTION_EXPIRED: { title: 'Subscription Expired', body: 'Your {{plan}} plan has expired. Renew now to continue.', emailSubject: 'Subscription Expired – Tradingo' },
  SUBSCRIPTION_GRACE: { title: 'Grace Period Active', body: 'Your {{plan}} plan is in grace period until {{graceEnd}}.', emailSubject: 'Subscription Grace Period – Tradingo' },
  SUBSCRIPTION_UPGRADED: { title: 'Plan Upgraded', body: 'Your plan has been upgraded to {{plan}}.', emailSubject: 'Plan Upgraded – Tradingo' },
  SUBSCRIPTION_DOWNGRADED: { title: 'Plan Downgraded', body: 'Your plan has been downgraded to {{plan}}.', emailSubject: 'Plan Downgraded – Tradingo' },

  // Chat
  NEW_MESSAGE: { title: 'New Message', body: 'You have a new message from {{senderName}}.', emailSubject: 'New Message – Tradingo' },
  USER_MENTION: { title: 'You Were Mentioned', body: '{{senderName}} mentioned you in {{conversationName}}.', emailSubject: 'You Were Mentioned – Tradingo' },

  // Escrow
  ESCROW_CREATED: { title: 'Escrow Created', body: 'An escrow of ₹{{amount}} has been created for order {{orderNumber}}.', emailSubject: 'Escrow Created – Tradingo' },
  ESCROW_FUNDED: { title: 'Escrow Funded', body: 'Escrow for order {{orderNumber}} has been funded with ₹{{amount}}.', emailSubject: 'Escrow Funded – Tradingo' },
  ESCROW_HELD: { title: 'Escrow Held', body: '₹{{amount}} has been held in escrow for order {{orderNumber}}.', emailSubject: 'Escrow Held – Tradingo' },
  ESCROW_RELEASED: { title: 'Escrow Released', body: '₹{{amount}} has been released from escrow for order {{orderNumber}}.', emailSubject: 'Escrow Released – Tradingo' },
  ESCROW_REFUNDED: { title: 'Escrow Refunded', body: '₹{{amount}} has been refunded from escrow for order {{orderNumber}}.', emailSubject: 'Escrow Refunded – Tradingo' },
  ESCROW_DISPUTED: { title: 'Escrow Disputed', body: 'A dispute has been raised on escrow for order {{orderNumber}}.', emailSubject: 'Escrow Dispute – Tradingo' },
  ESCROW_FROZEN: { title: 'Escrow Frozen', body: 'Escrow for order {{orderNumber}} has been frozen by admin.', emailSubject: 'Escrow Frozen – Tradingo' },
  ESCROW_REOPENED: { title: 'Escrow Reopened', body: 'Escrow for order {{orderNumber}} has been reopened.', emailSubject: 'Escrow Reopened – Tradingo' },

  // Settlement
  SETTLEMENT_INITIATED: { title: 'Settlement Initiated', body: 'A settlement of ₹{{amount}} has been initiated.', emailSubject: 'Settlement Initiated – Tradingo' },
  SETTLEMENT_PROCESSED: { title: 'Settlement Processed', body: 'Settlement of ₹{{amount}} has been processed successfully.', emailSubject: 'Settlement Processed – Tradingo' },
  SETTLEMENT_PROCESSING: { title: 'Settlement Processing', body: 'Settlement of ₹{{amount}} is being processed.', emailSubject: 'Settlement Processing – Tradingo' },
  SETTLEMENT_COMPLETED: { title: 'Settlement Completed', body: 'Settlement of ₹{{amount}} has been completed.', emailSubject: 'Settlement Completed – Tradingo' },
  SETTLEMENT_FAILED: { title: 'Settlement Failed', body: 'Settlement of ₹{{amount}} has failed. Reason: {{reason}}', emailSubject: 'Settlement Failed – Tradingo' },
  SETTLEMENT_RETRYING: { title: 'Settlement Retrying', body: 'Settlement of ₹{{amount}} is being retried.', emailSubject: 'Settlement Retrying – Tradingo' },
  SETTLEMENT_MANUAL_REVIEW: { title: 'Settlement Requires Review', body: 'Settlement of ₹{{amount}} requires manual review.', emailSubject: 'Settlement Manual Review – Tradingo' },
  SETTLEMENT_REOPENED: { title: 'Settlement Reopened', body: 'Settlement of ₹{{amount}} has been reopened.', emailSubject: 'Settlement Reopened – Tradingo' },

  // Dispute
  DISPUTE_CREATED: { title: 'Dispute Created', body: 'A dispute has been raised for order {{orderNumber}}. Reason: {{reason}}', emailSubject: 'Dispute Created – Tradingo' },
  DISPUTE_EVIDENCE_REQUIRED: { title: 'Evidence Required', body: 'Please provide evidence for dispute {{disputeId}} within 7 days.', emailSubject: 'Evidence Required – Tradingo' },
  DISPUTE_ESCALATED: { title: 'Dispute Escalated', body: 'Dispute {{disputeId}} has been escalated to admin arbitration.', emailSubject: 'Dispute Escalated – Tradingo' },
  DISPUTE_RESOLVED: { title: 'Dispute Resolved', body: 'Dispute {{disputeId}} has been resolved with {{resolutionType}}.', emailSubject: 'Dispute Resolved – Tradingo' },
  DISPUTE_REFUNDED: { title: 'Dispute Refunded', body: 'A refund of ₹{{amount}} has been issued for dispute {{disputeId}}.', emailSubject: 'Dispute Refunded – Tradingo' },
  DISPUTE_REJECTED: { title: 'Dispute Rejected', body: 'Dispute {{disputeId}} has been rejected.', emailSubject: 'Dispute Rejected – Tradingo' },
  DISPUTE_APPEALED: { title: 'Dispute Appealed', body: 'Dispute {{disputeId}} has been appealed.', emailSubject: 'Dispute Appealed – Tradingo' },
  DISPUTE_HOLD: { title: 'Dispute Hold', body: '₹{{amount}} has been placed on hold due to dispute for order {{orderNumber}}.', emailSubject: 'Dispute Hold – Tradingo' },
  DISPUTE_OPENED: { title: 'Dispute Opened', body: 'A dispute has been opened for {{reference}}.', emailSubject: 'Dispute Opened – Tradingo' },
  DISPUTE_UPDATED: { title: 'Dispute Updated', body: 'Dispute {{disputeId}} has a new update.', emailSubject: 'Dispute Updated – Tradingo' },
  DISPUTE_CLOSED: { title: 'Dispute Closed', body: 'Dispute {{disputeId}} has been closed.', emailSubject: 'Dispute Closed – Tradingo' },

  // KYC/Verification
  KYC_APPROVED: { title: 'KYC Approved', body: 'Your KYC verification has been approved.', emailSubject: 'KYC Approved – Tradingo' },
  KYC_REJECTED: { title: 'KYC Rejected', body: 'Your KYC verification was not approved. Reason: {{reason}}', emailSubject: 'KYC Rejected – Tradingo' },
  KYC_PENDING: { title: 'KYC Under Review', body: 'Your KYC documents are being reviewed.', emailSubject: 'KYC Status – Tradingo' },
  KYC_EXPIRED: { title: 'KYC Expired', body: 'Your KYC verification has expired. Please re-submit.', emailSubject: 'KYC Expired – Tradingo' },
  DOCUMENT_VERIFIED: { title: 'Document Verified', body: 'Your {{documentType}} has been verified successfully.', emailSubject: 'Document Verified – Tradingo' },
  DOCUMENT_REJECTED: { title: 'Document Rejected', body: 'Your {{documentType}} was rejected. Reason: {{reason}}', emailSubject: 'Document Rejected – Tradingo' },
  VERIFICATION_LEVEL_UPGRADED: { title: 'Verification Level Upgraded', body: 'Your company verification level has been upgraded to {{level}}.', emailSubject: 'Verification Upgraded – Tradingo' },

  // Trust
  TRUST_SCORE_CHANGED: { title: 'Trust Score Updated', body: 'Your TradTrust score has changed to {{score}}.', emailSubject: 'Trust Score Update – Tradingo' },
  TRUST_BADGE_EARNED: { title: 'Trust Badge Earned', body: 'Congratulations! Your company earned the {{badgeName}} trust badge.', emailSubject: 'Trust Badge Earned – Tradingo' },

  // Company
  COMPANY_VERIFIED: { title: 'Company Verified', body: 'Your company profile has been verified by Tradingo.', emailSubject: 'Company Verified – Tradingo' },
  PROFILE_COMPLETION_REWARD: { title: 'Profile Completion Reward', body: 'Congratulations! Complete your profile to earn ₹500 GoCash.', emailSubject: 'Profile Completion – Tradingo' },

  // Onboarding
  ONBOARDING_STEP_COMPLETED: { title: 'Onboarding Progress', body: 'You completed the {{step}} step. {{remaining}} steps remaining.', emailSubject: 'Onboarding Progress – Tradingo' },
  ONBOARDING_COMPLETED: { title: 'Onboarding Complete', body: 'Congratulations! You have completed onboarding. Start trading now!', emailSubject: 'Welcome Aboard – Tradingo' },

  // General
  WELCOME: { title: 'Welcome to Tradingo!', body: 'Welcome {{name}}! Start exploring products and connecting with verified sellers.', emailSubject: 'Welcome to Tradingo!' },
  ACCOUNT_CREATED: { title: 'Account Created', body: 'Your account has been created successfully.', emailSubject: 'Account Created – Tradingo' },
  PASSWORD_CHANGED: { title: 'Password Changed', body: 'Your account password has been changed successfully.', emailSubject: 'Password Changed – Tradingo' },
  EMAIL_VERIFIED: { title: 'Email Verified', body: 'Your email address has been verified successfully.', emailSubject: 'Email Verified – Tradingo' },
  ORGANIZATION_INVITE: { title: 'Organization Invitation', body: 'You have been invited to join {{orgName}} on Tradingo.', emailSubject: 'Organization Invitation – Tradingo' },
  ORGANIZATION_MEMBER_ADDED: { title: 'Member Added', body: '{{memberName}} has been added to your organization.', emailSubject: 'New Team Member – Tradingo' },
  ORGANIZATION_MEMBER_REMOVED: { title: 'Member Removed', body: '{{memberName}} has been removed from your organization.', emailSubject: 'Team Member Removed – Tradingo' },

  // Certifications
  CERTIFICATION_APPROVED: { title: 'Certification Approved', body: 'Your {{certName}} certification has been approved.', emailSubject: 'Certification Approved – Tradingo' },
  CERTIFICATION_REJECTED: { title: 'Certification Rejected', body: 'Your {{certName}} certification was not approved.', emailSubject: 'Certification Update – Tradingo' },
  CERTIFICATION_EXPIRING: { title: 'Certification Expiring Soon', body: 'Your {{certName}} certification will expire in {{days}} days.', emailSubject: 'Certification Expiring Soon – Tradingo' },
  CERTIFICATION_EXPIRED: { title: 'Certification Expired', body: 'Your {{certName}} certification has expired.', emailSubject: 'Certification Expired – Tradingo' },

  // System
  SYSTEM_ANNOUNCEMENT: { title: 'Announcement', body: '{{message}}', emailSubject: 'Tradingo Announcement' },
  SYSTEM_MAINTENANCE: { title: 'Scheduled Maintenance', body: 'Tradingo will be under maintenance on {{date}} from {{start}} to {{end}}.', emailSubject: 'Scheduled Maintenance – Tradingo' },

  // Ecosystem / GOCASH 2.0
  MISSION_COMPLETED: { title: 'Mission Complete', body: '🎯 Mission "{{missionName}}" completed! +{{xpReward}} XP earned.', emailSubject: 'Mission Complete – Tradingo' },
  BADGE_EARNED: { title: 'New Badge Earned', body: '🏅 Congratulations! You earned the "{{badgeName}}" badge!', emailSubject: 'Badge Earned – Tradingo' },
  LEVEL_UP: { title: 'Level Up!', body: '🎉 Level Up! You reached {{newLevel}} — Rewards unlocked!', emailSubject: 'Level Up – Tradingo' },
  DAILY_CHECKIN: { title: 'Daily Check-in', body: '✅ Day {{streakCount}} check-in streak! +{{xpEarned}} XP earned.', emailSubject: 'Daily Check-in – Tradingo' },
  REWARD_EXPIRING: { title: 'Reward Expiring Soon', body: '⏰ Your {{rewardType}} reward of {{amount}} expires in {{days}} days.', emailSubject: 'Reward Expiring Soon – Tradingo' },
  LEADERBOARD_IMPROVED: { title: 'Leaderboard Update', body: '📊 You moved up to #{{rank}} on the {{period}} leaderboard!', emailSubject: 'Leaderboard Update – Tradingo' },
  CAMPAIGN_STARTED: { title: 'Campaign Started', body: '📢 "{{campaignName}}" is now live! Participate to earn rewards.', emailSubject: 'Campaign Started – Tradingo' },
  CAMPAIGN_ENDING: { title: 'Campaign Ending Soon', body: '⏰ "{{campaignName}}" ends in {{days}} days. Complete tasks now!', emailSubject: 'Campaign Ending Soon – Tradingo' },
  AI_SUGGESTED_MISSION: { title: 'AI Mission Suggestion', body: '🤖 {{suggestion}}', emailSubject: 'AI Mission Suggestion – Tradingo' },
  REFERRAL_REWARD: { title: 'Referral Reward', body: '🎁 You earned {{amount}} GOCASH from a successful referral!', emailSubject: 'Referral Reward – Tradingo' },
  REFERRAL_MILESTONE: { title: 'Referral Milestone', body: '🏆 You reached {{count}} successful referrals! Keep sharing.', emailSubject: 'Referral Milestone – Tradingo' },
  MEMBERSHIP_UPGRADED: { title: 'Membership Upgraded', body: '⭐ Your plan has been upgraded to {{plan}}. Enjoy new benefits!', emailSubject: 'Membership Upgraded – Tradingo' },
  MEMBERSHIP_EXPIRING: { title: 'Membership Expiring', body: '⚠️ Your {{plan}} plan expires in {{days}} days. Renew to keep benefits.', emailSubject: 'Membership Expiring – Tradingo' },
  AI_CREDIT_ADDED: { title: 'AI Credits Added', body: '🤖 {{amount}} AI credits have been added to your {{plan}} plan.', emailSubject: 'AI Credits Added – Tradingo' },

  // Security & Incident Response
  SECURITY_ALERT: { title: 'Security Alert', body: '{{message}}', emailSubject: 'Security Alert – Tradingo' },
  INCIDENT_DETECTED: { title: 'Incident Detected', body: '{{incidentType}} incident detected: {{description}}', emailSubject: 'Incident Detected – Tradingo' },
  INCIDENT_RESOLVED: { title: 'Incident Resolved', body: '{{incidentType}} incident #{{incidentId}} has been resolved.', emailSubject: 'Incident Resolved – Tradingo' },
  INCIDENT_ESCALATED: { title: 'Incident Escalated', body: '{{incidentType}} incident #{{incidentId}} escalated to {{severity}}.', emailSubject: 'Incident Escalated – Tradingo' },
  UNAUTHORIZED_ACCESS: { title: 'Unauthorized Access', body: 'Unauthorized access attempt detected: {{details}}', emailSubject: 'Unauthorized Access – Tradingo' },
  BRUTE_FORCE_DETECTED: { title: 'Brute Force Detected', body: 'Multiple failed attempts from {{ipAddress}} targeting {{resource}}.', emailSubject: 'Brute Force Detected – Tradingo' },
  AUTH_ANOMALY: { title: 'Authentication Anomaly', body: 'Unusual authentication activity: {{details}}', emailSubject: 'Auth Anomaly – Tradingo' },

  // Support
  TICKET_CREATED: { title: 'Support Ticket Created', body: 'Ticket #{{ticketId}}: {{subject}}', emailSubject: 'Support Ticket Created – Tradingo' },
  TICKET_ASSIGNED: { title: 'Ticket Assigned', body: 'Ticket #{{ticketId}} assigned to you: {{subject}}', emailSubject: 'Ticket Assigned – Tradingo' },
  TICKET_MESSAGE_ADDED: { title: 'New Ticket Message', body: 'New message on ticket #{{ticketId}}: {{subject}}', emailSubject: 'New Message on Ticket – Tradingo' },
  TICKET_RESOLVED: { title: 'Ticket Resolved', body: 'Ticket #{{ticketId}} has been resolved: {{subject}}', emailSubject: 'Ticket Resolved – Tradingo' },
  TICKET_CLOSED: { title: 'Ticket Closed', body: 'Ticket #{{ticketId}} has been closed: {{subject}}', emailSubject: 'Ticket Closed – Tradingo' },
  TICKET_REOPENED: { title: 'Ticket Reopened', body: 'Ticket #{{ticketId}} has been reopened: {{subject}}', emailSubject: 'Ticket Reopened – Tradingo' },

  // TradeServ
  BOOKING_CREATED: { title: 'New Booking', body: 'You have a new booking on {{date}} from {{clientName}}.', emailSubject: 'New Booking – TradeServ' },
  BOOKING_CONFIRMED: { title: 'Booking Confirmed', body: 'Your booking on {{date}} has been confirmed by {{professionalName}}.', emailSubject: 'Booking Confirmed – TradeServ' },
  BOOKING_COMPLETED: { title: 'Booking Completed', body: 'Your booking on {{date}} with {{professionalName}} has been completed.', emailSubject: 'Booking Completed – TradeServ' },
  BOOKING_CANCELLED: { title: 'Booking Cancelled', body: 'Your booking on {{date}} has been cancelled. Reason: {{reason}}', emailSubject: 'Booking Cancelled – TradeServ' },
  BOOKING_PAYMENT_FAILED: { title: 'Payment Failed', body: 'Payment for your booking on {{date}} failed. Reason: {{reason}}', emailSubject: 'Payment Failed – TradeServ' },
  REVIEW_SUBMITTED: { title: 'New Review', body: '{{reviewerName}} left a {{rating}}-star review for your services.', emailSubject: 'New Review – TradeServ' },
  PROPOSAL_SUBMITTED: { title: 'New Proposal', body: '{{professionalName}} has submitted a proposal for your inquiry.', emailSubject: 'New Proposal – TradeServ' },
  PROPOSAL_ACCEPTED: { title: 'Proposal Accepted', body: 'Your proposal for {{clientName}} has been accepted.', emailSubject: 'Proposal Accepted – TradeServ' },
  PROPOSAL_REJECTED: { title: 'Proposal Not Accepted', body: 'Your proposal for {{clientName}} was not selected.', emailSubject: 'Proposal Update – TradeServ' },
  INQUIRY_RECEIVED: { title: 'New Inquiry', body: '{{clientName}} has sent an inquiry: {{requirement}}.', emailSubject: 'New Inquiry – TradeServ' },

  // TradeTalk Social
  POST_CREATED: { title: 'New Post', body: '{{authorName}} created a new post in {{communityName}}.', emailSubject: 'New Post – TradeTalk' },
  COMMENT_ADDED: { title: 'New Comment', body: '{{authorName}} commented on your post.', emailSubject: 'New Comment – TradeTalk' },
  FOLLOW_RECEIVED: { title: 'New Follower', body: '{{followerName}} started following you.', emailSubject: 'New Follower – TradeTalk' },
  POST_LIKED: { title: 'Post Liked', body: '{{userName}} liked your post.', emailSubject: 'Post Liked – TradeTalk' },

  // Generic
  GENERIC: { title: 'Notification', body: '{{message}}', emailSubject: 'Notification – Tradingo' },
};

@Injectable()
export class NotificationTemplateService {
  private readonly logger = new Logger(NotificationTemplateService.name);

  constructor(private readonly prisma: PrismaService) {}

  async render(
    type: NotificationType,
    channel: NotificationChannel,
    context: Record<string, unknown>,
  ): Promise<RenderedTemplate> {
    let template = await this.prisma.notificationTemplate.findUnique({
      where: { type_channel: { type, channel } },
    });

    if (!template) {
      const fallback = FALLBACK_TEMPLATES[type];
      if (!fallback) {
        return { subject: 'Notification', title: 'Notification', body: '' };
      }

      if (channel === 'EMAIL') {
        return {
          subject: this.interpolate(fallback.emailSubject, context),
          title: this.interpolate(fallback.title, context),
          body: this.interpolate(fallback.body, context),
        };
      }

      return {
        subject: '',
        title: this.interpolate(fallback.title, context),
        body: this.interpolate(fallback.body, context),
      };
    }

    return {
      subject: channel === 'EMAIL' && template.subject ? this.interpolate(template.subject, context) : '',
      title: this.interpolate(template.title, context),
      body: this.interpolate(template.body, context),
    };
  }

  private interpolate(text: string, context: Record<string, unknown>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      const value = context[key];
      return value != null ? String(value) : `{{${key}}}`;
    });
  }
}
