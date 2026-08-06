export const TrackingEvent = {
  PAGE_VIEW: 'page_view',
  PRODUCT_VIEW: 'product_view',
  COMPANY_VIEW: 'company_view',
  SEARCH: 'search',
  RFQ_CREATED: 'rfq_created',
  REGISTRATION_START: 'registration_start',
  REGISTRATION_COMPLETE: 'registration_complete',
  REFERRAL_SHARE: 'referral_share',
  REFERRAL_APPLY: 'referral_apply',
  REFERRAL_REWARD: 'referral_reward',
  LEAD_SUBMIT: 'lead_submit',
  CONTACT_FORM: 'contact_form',
  CTA_CLICK: 'cta_click',
  DASHBOARD_VISIT: 'dashboard_visit',
  REFERRAL_PAGE_VIEW: 'referral_page_view',
  POST_CREATED: 'post_created',
  POST_EDITED: 'post_edited',
  POST_DELETED: 'post_deleted',
  POST_VIEWED: 'post_viewed',
  POST_LIKED: 'post_liked',
  POST_UNLIKED: 'post_unliked',
  POST_SAVED: 'post_saved',
  POST_UNSAVED: 'post_unsaved',
  POST_COMMENTED: 'post_commented',
  POST_COMMENT_REPLIED: 'post_comment_replied',
  USER_FOLLOWED: 'user_followed',
  USER_UNFOLLOWED: 'user_unfollowed',
  COMPANY_FOLLOWED: 'company_followed',
  COMPANY_UNFOLLOWED: 'company_unfollowed',
  AI_POST_GENERATED: 'ai_post_generated',
  AI_POST_REWRITTEN: 'ai_post_rewritten',
  AI_TRANSLATION_USED: 'ai_translation_used',
  AI_HASHTAGS_ACCEPTED: 'ai_hashtags_accepted',
  CONTENT_FLAGGED: 'content_flagged',
  CONTENT_APPROVED: 'content_approved',
} as const;

export type TrackingEventName = typeof TrackingEvent[keyof typeof TrackingEvent];

export interface TrackingEventPayload {
  event: TrackingEventName;
  userId?: string;
  sessionId?: string;
  pageUrl?: string;
  properties?: Record<string, unknown>;
  utm?: Record<string, string>;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem('tradingo_sid');
  if (!sid) {
    sid = crypto.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem('tradingo_sid', sid);
  }
  return sid;
}

function getUtmParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
  for (const key of keys) {
    const val = params.get(key);
    if (val) utm[key] = val;
  }
  const ref = params.get('ref');
  if (ref) utm.ref = ref;
  const gclid = params.get('gclid');
  if (gclid) utm.gclid = gclid;
  const fbclid = params.get('fbclid');
  if (fbclid) utm.fbclid = fbclid;
  return utm;
}

export function buildTrackingPayload(event: TrackingEventName, overrides?: Partial<TrackingEventPayload>): TrackingEventPayload {
  return {
    event,
    sessionId: getSessionId(),
    pageUrl: typeof window !== 'undefined' ? window.location.href : '',
    utm: getUtmParams(),
    ...overrides,
  };
}
