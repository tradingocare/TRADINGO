/**
 * Canonical commercial plan seed data — SINGLE SOURCE OF TRUTH for the six
 * locked plans and their display feature bullets.
 *
 * Consumed by MembershipService.seedPlans() (admin endpoint) and by the
 * standalone E2E seed (tests/helpers/e2e-seed.ts). This module is
 * intentionally dependency-free (no runtime imports) because the E2E seed
 * runs under ts-node outside the Nest DI graph and cannot import
 * membership.service.ts.
 *
 * LOCKED VALUES — founder approval required for any change:
 *   Trade Start   ₹6,000 | Trade Smart ₹12,000 | Trade Plus  ₹18,000 |
 *   Trade Pro    ₹24,000 | Trade Premium ₹30,000 | Trade Elite ₹40,000
 * (Tier-A annual prices; tiers B/C are multi-year term columns.)
 */
export interface CorePlanSeed {
  planId: string;
  name: string;
  pricePlanA: number;
  pricePlanB: number;
  pricePlanC: number;
  sortOrder: number;
}

export const CORE_PLANS: CorePlanSeed[] = [
  { planId:'trade_start',   name:'Trade Start',  pricePlanA:6000,  pricePlanB:12000, pricePlanC:18000, sortOrder:1 },
  { planId:'trade_smart',   name:'Trade Smart',  pricePlanA:12000, pricePlanB:18000, pricePlanC:30000, sortOrder:2 },
  { planId:'trade_plus',    name:'Trade Plus',   pricePlanA:18000, pricePlanB:30000, pricePlanC:50000, sortOrder:3 },
  { planId:'trade_pro',     name:'Trade Pro',    pricePlanA:24000, pricePlanB:50000, pricePlanC:75000, sortOrder:4 },
  { planId:'trade_premium', name:'Trade Premium',pricePlanA:30000, pricePlanB:75000, pricePlanC:110000, sortOrder:5 },
  { planId:'trade_elite',   name:'Trade Elite',  pricePlanA:40000, pricePlanB:110000,pricePlanC:150000, sortOrder:6 },
];

export const PLAN_FEATURES: Record<string, string[]> = {
  trade_start:   ['Buyer Visibility','GO Reach','Chat','RFQ (5/mo)','Basic Profile','1 Product','GOCASH Earning'],
  trade_smart:   ['Buyer Visibility','GO Reach','Chat','RFQ (20/mo)','Flexible Pricing','Direct Orders','25 Products','Seller Badge','Basic Profile','Website','GST Invoice'],
  trade_plus:    ['Buyer Visibility','GO Reach','Chat','RFQ (50/mo)','Flexible Pricing','Direct Orders','100 Products','Seller Badge','Branding','Business Profile','Website','Catalogue PDF','Basic Analytics'],
  trade_pro:     ['Buyer Visibility','GO Reach','Chat','RFQ (100/mo)','Flexible Pricing','Direct Orders','500 Products','Seller Badge','Branding','Business Profile','Website','Catalogue PDF','Analytics','Response Badge','GOCASH 2x'],
  trade_premium: ['Buyer Visibility','GO Reach','Chat','Unlimited RFQ','Flexible Pricing','Direct Orders','2000 Products','Seller Badge','Branding','Business Profile','Website','Catalogue PDF','Advanced Analytics','Relationship Manager','Featured Visibility','GOCASH 3x'],
  trade_elite:   ['Everything in Premium','Unlimited Products','Unlimited RFQs','TRADGO Elite','GO DIGITAL Featured','Price Lock','Advanced Analytics','GOCASH 3x','Priority RM','API Access','White Label Options','Custom Integration'],
  'trad-up':     ['Business Profile','Basic Verification','Product Listing (configurable)','Receive RFQs','Buyer Chat','Basic Search Visibility','Basic Dashboard','Basic Orders','Basic Notifications'],
  'trade-smart-launch': ['Business Profile','Basic Verification','Product Listing','Receive RFQs','Buyer Chat','Search Visibility','Basic Dashboard','Basic Orders','Basic Notifications','GOCASH Enabled','Premium Badge','Priority Search Ranking','Advanced Analytics','Campaign Participation','Referral Rewards','Exports','Advanced RFQ','Premium Dashboard'],
};
