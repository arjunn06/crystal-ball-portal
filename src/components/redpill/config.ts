/**
 * Red Pill page configuration.
 *
 * Every fact we do not know for certain lives here and is rendered ONLY when it is filled in.
 * Leave a value undefined and the matching line, chip or FAQ item simply does not appear.
 * Nothing on the page may be invented: no seat counts, dates, guarantees or student numbers.
 */

export const PRICE = "₹2,999";
export const VIDEO_ID = "2fxjbw5fdsk";
export const ENROLL_PATH = "/enroll" as const;

export type RpConfig = {
  /** 'safe' is the lower-risk headline if counsel objects to "Traded live". */
  heroVariant: "default" | "safe" | "personal";
  /** 'soft' rewords "you trade the market together" as "we work through the live market together". */
  weeksVariant: "default" | "soft";
  /** 'first' needs Arjun's approval. 'third' is the safe default. */
  noteVoice: "first" | "third";

  /** ISO 8601 with offset, e.g. "2026-11-02T20:00:00+05:30". Chip renders only while in the future. */
  cohortStart?: string;
  cohortNumber?: number;
  /** ISO 8601. Shown with the cohort start in the price card. */
  registrationClose?: string;
  /** Only set if a real, enforced cap exists. */
  seatCap?: number;
  scheduleLine?: string; // e.g. "Classes run Mon to Fri at 8 PM IST."
  firstSession?: string; // e.g. "Mon 2 Nov, 8:00 PM IST"

  /** Exactly one of: "Inclusive of all taxes." | "No extra charges at checkout." | "Plus applicable taxes." */
  taxLine?: string;
  /** One plain sentence. Must match the Cancellation and Refund page. */
  refundLine?: string;
  /** e.g. "UPI, cards or netbanking": list only methods enabled in the Razorpay dashboard. */
  paymentMethods?: string;
  receiptsOn?: boolean;
  supportContact?: string;
  paymentsOnlyOnSiteConfirmed?: boolean; // "team never asks for payment by DM"

  youtubeChannelUrl?: string;
  videoDuration?: string; // "m:ss"
  bluePillLink: boolean;

  /** Optional FAQ answers, each rendered only when supplied. */
  faqMissedSession?: string;
  faqAffiliate?: string;
  faqWhyPrice?: string;

  /** Entity details for the footer, each part rendered only when supplied. */
  entity?: {
    name?: string;
    address?: string;
    email?: string;
    hours?: string;
    gstin?: string;
    grievance?: string;
  };
};

export const RP: RpConfig = {
  heroVariant: "default",
  weeksVariant: "default",
  noteVoice: "third",
  bluePillLink: false,
};

export const HERO_FRAGMENTS: Record<RpConfig["heroVariant"], string[]> = {
  default: ["One model.", "Taught live.", "Traded live."],
  safe: ["One model.", "One month.", "Live on Zoom."],
  personal: ["Learn the IFVG model", "I actually trade."],
};

/** Student messages, wording exactly as written in the members Discord. "..." marks a visible trim. */
export type Quote = {
  id: "tobi" | "cython" | "jeevan" | "sanu" | "veera";
  handle: string;
  cohort?: string;
  text: string;
  /** Substrings rendered with emphasis (wording unchanged). */
  emphasis?: string[];
  lang?: "ta-Latn";
  /** Approved English gloss. Left empty until Arjun approves one. */
  translation?: string;
};

export const QUOTES: Record<Quote["id"], Quote> = {
  tobi: {
    id: "tobi",
    handle: "Tobi",
    cohort: "Red Pill 3",
    text: "Soo... I'm happy that I joined the red pill 3 class. I would say it was worth it. My journey in trading is around 8-9 months. Where I've always been jumping between strategies. Like when see in yt I feel like oh this works, that works, but when I try to execute I was so confused, blew around 4 CFD accounts till date. Then I started following arjun bro and joined the red pill. I've learnt things psychologically, like how trading is simple and we traders are the one's who make it complicated. I'm following arjun bro's strategy since I came to know about it. I'm paper trading it, I know that the strategy works, I lose sometimes. So it is up to me to be disciplined. Execute, repeat the winners and learn from the losers.",
    emphasis: [
      "blew around 4 CFD accounts till date.",
      "I lose sometimes. So it is up to me to be disciplined.",
    ],
  },
  cython: {
    id: "cython",
    handle: "Çythøñ",
    text: "Bro, in my opinion, ifvg strategy is excellent and your teaching is also really good. I understood the concepts clearly. But I have one doubt - is what we learned in this class enough for long-term trading or to become a full-time trader? Or are there still more advanced things we need to learn and practice?",
  },
  jeevan: {
    id: "jeevan",
    handle: "Jeevan",
    text: "Bro, first of all, I really appreciate the way you teach and explain the IFVG strategy. The strategy is really good, and your guidance has helped me understand market dynamics and execution much better. ...",
  },
  sanu: {
    id: "sanu",
    handle: "Sanu",
    lang: "ta-Latn",
    text: "Bro honest ah sollanum na enaku vanthu neenga sonna strategy concepts la nallave purinchu intha strategy ku thevaiyaana ellame sollitinga athu mattum illama simple ah puriyuramaari eruchu ...",
  },
  veera: {
    id: "veera",
    handle: "Veera pradeep 081",
    lang: "ta-Latn",
    text: "Bro unga strategy pakka simple ah nalla puriyara mari iruku but students ah unga kudavea travel panra mari pakka plan oda move panna nalla Irukum bro excicute panrathula tha confusion ah Iruku bro and risk management lot size ithula konja confusion ah Iruku bro but unga class pakka bro nalla research bro",
  },
};

export type FaqEntry = {
  id: string;
  q: string;
  a: string;
  links?: { label: string; href: string }[];
};

export function buildFaq(c: RpConfig): FaqEntry[] {
  const items: FaqEntry[] = [
    {
      id: "experience",
      q: "Do I need trading experience?",
      a: "Week 1 starts at intro to trading and candles, then builds through nine modules, from price action to the IFVG model. Ask your questions live as we go.",
    },
    {
      id: "signals",
      q: "Is this a signals group?",
      a: "No. The members Discord is where Arjun shares his own trade updates so you can see the model applied. They are for learning, not recommendations, and you make your own decisions.",
    },
    {
      id: "blew",
      q: "I blew accounts before. Is this for me?",
      a: "It is built for traders who want to stop switching strategies and commit to one model. One member, Tobi, wrote that he blew around 4 CFD accounts before joining. His message is on this page.",
      links: [{ label: "Read Tobi's message", href: "#tobi" }],
    },
    {
      id: "ict",
      q: "Is this just ICT from YouTube?",
      a: "IFVG comes from ICT, and the ideas are free to find. The walkthrough is free to watch first. The month adds the order, one model, live Q&A, live sessions where we trade together, and daily execution reviews.",
      links: [{ label: "See the nine modules", href: "#modules" }],
    },
    {
      id: "money",
      q: "Will I make money?",
      a: "Nobody can promise that, and we do not. The Red Pill teaches a process. One month teaches you the model and gives you live practice. Getting consistent takes longer, and that part is on you.",
    },
    {
      id: "markets",
      q: "Which markets does it cover?",
      a: "The course teaches the IFVG model and the price action behind it. Module 9 covers futures and forex prop firm rules, explained as education. We do not recommend or endorse any broker or prop firm.",
    },
    {
      id: "need",
      q: "What do I need to join?",
      a: "Zoom, a Discord account, and a Google account or an email address to sign in.",
    },
    {
      id: "recurring",
      q: "Is there a recurring charge?",
      a: `No. It is one payment of ${PRICE} on Razorpay. Nothing renews.`,
    },
    {
      id: "join",
      q: "How do I join?",
      a: `Sign in with Google or an email code, pay ${PRICE} on Razorpay, then get your Red Pill role in the Discord. Session links are shared there.`,
    },
    {
      id: "advice",
      q: "Is this investment advice?",
      a: "No. The Red Pill is trading education. It does not give investment advice or recommendations, and nothing in the sessions or the Discord is a tip.",
    },
  ];
  if (c.faqMissedSession)
    items.push({ id: "missed", q: "What if I miss a live session?", a: c.faqMissedSession });
  if (c.refundLine) items.push({ id: "refund", q: "What is the refund policy?", a: c.refundLine });
  if (c.faqAffiliate)
    items.push({
      id: "affiliate",
      q: "Do you earn from any broker or prop firm?",
      a: c.faqAffiliate,
    });
  if (c.faqWhyPrice) items.push({ id: "why-price", q: `Why is it ${PRICE}?`, a: c.faqWhyPrice });
  return items;
}

const ist = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** "Mon, 2 Nov, 8:00 pm" in IST, or null if the date is missing, invalid or already past. */
export function futureIst(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime()) || d.getTime() < Date.now()) return null;
  return ist
    .format(d)
    .replace(/\bam\b/, "AM")
    .replace(/\bpm\b/, "PM");
}
