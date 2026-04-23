// Plan definitions and limits

export interface PlanLimits {
  decksPerMonth: number;
  cardsPerDeck: number;
  audioCardsPerDeck: number;
  documentUpload: boolean;
  podcastFeed: boolean;
  ankiExport: boolean;
  maxUploadSizeMb: number;
}

export const PLANS: Record<string, PlanLimits> = {
  free: {
    decksPerMonth: 3,
    cardsPerDeck: 10,
    audioCardsPerDeck: 2,
    documentUpload: false,
    podcastFeed: false,
    ankiExport: true,
    maxUploadSizeMb: 0,
  },
  pro: {
    decksPerMonth: Infinity,
    cardsPerDeck: 30,
    audioCardsPerDeck: 30,
    documentUpload: true,
    podcastFeed: true,
    ankiExport: true,
    maxUploadSizeMb: 20,
  },
  exam_boost: {
    decksPerMonth: Infinity,
    cardsPerDeck: 30,
    audioCardsPerDeck: 30,
    documentUpload: true,
    podcastFeed: true,
    ankiExport: true,
    maxUploadSizeMb: 20,
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  return PLANS[plan] || PLANS.free;
}

// LemonSqueezy product/variant IDs — set these after creating products in LS dashboard
export const LEMONSQUEEZY = {
  storeId: process.env.LEMONSQUEEZY_STORE_ID || '',
  // Monthly Pro
  proMonthlyVariantId: process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID || '',
  // Annual Pro
  proAnnualVariantId: process.env.LEMONSQUEEZY_PRO_ANNUAL_VARIANT_ID || '',
  // Exam Boost (one-time 30 days)
  examBoostVariantId: process.env.LEMONSQUEEZY_EXAM_BOOST_VARIANT_ID || '',
  // Webhook signing secret
  webhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '',
  // API key
  apiKey: process.env.LEMONSQUEEZY_API_KEY || '',
};

export const PRICES = {
  proMonthly: { amount: 499, currency: 'EUR', label: '€4.99/mo' },
  proAnnual: { amount: 4788, currency: 'EUR', label: '€3.99/mo', period: '€47.88/yr' },
  examBoost: { amount: 1499, currency: 'EUR', label: '€14.99 one-time' },
};
