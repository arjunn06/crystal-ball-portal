import { z } from "zod";

/** Flip to false to close the 1-1 training form once slots are filled. */
export const APPLICATIONS_OPEN = true;

export const EXPERIENCE_OPTIONS = [
  { value: "under_6_months", label: "Under 6 months" },
  { value: "6_12_months", label: "6 to 12 months" },
  { value: "1_2_years", label: "1 to 2 years" },
  { value: "2_4_years", label: "2 to 4 years" },
  { value: "4_plus_years", label: "4+ years" },
] as const;

export const STAGE_OPTIONS = [
  { value: "learning", label: "Still learning, not trading live yet" },
  { value: "evaluation", label: "Going through prop firm evaluations" },
  { value: "funded", label: "Funded with a prop firm" },
  { value: "personal", label: "Trading my own capital" },
] as const;

export const IFVG_OPTIONS = [
  { value: "new", label: "New to IFVG" },
  { value: "learning", label: "Learning it, not consistent yet" },
  { value: "trading", label: "I trade it regularly" },
  { value: "primary", label: "It is my primary model" },
] as const;

export const HOURS_OPTIONS = [
  { value: "under_5", label: "Under 5 hours" },
  { value: "5_10", label: "5 to 10 hours" },
  { value: "10_20", label: "10 to 20 hours" },
  { value: "20_plus", label: "20+ hours" },
] as const;

export const INVESTMENT_OPTIONS = [
  { value: "ready", label: "Yes, I am ready to invest if selected" },
  { value: "need_details", label: "I need to know the details first" },
] as const;

export const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "invited", label: "Invited to call" },
  { value: "declined", label: "Declined" },
] as const;

const values = <T extends readonly { value: string }[]>(options: T) =>
  options.map((o) => o.value) as [T[number]["value"], ...T[number]["value"][]];

const longAnswer = (label: string) =>
  z
    .string()
    .trim()
    .min(30, { message: `Tell me a little more about ${label} (at least 30 characters)` })
    .max(1500, { message: "Keep this under 1,500 characters" });

export const applicationSchema = z.object({
  name: z.string().trim().min(2, { message: "Enter your full name" }).max(100),
  email: z.string().trim().email({ message: "Enter a valid email" }).max(255),
  phone: z
    .string()
    .trim()
    .min(7, { message: "Enter a valid WhatsApp number" })
    .max(20, { message: "Enter a valid WhatsApp number" })
    .regex(/^[+0-9][0-9\s\-()]*$/, { message: "Enter a valid WhatsApp number" }),
  location: z.string().trim().min(2, { message: "Enter your city and country" }).max(120),
  discord: z.string().trim().max(60).optional(),
  social: z.string().trim().max(200).optional(),
  experience: z.enum(values(EXPERIENCE_OPTIONS), { message: "Choose one" }),
  stage: z.enum(values(STAGE_OPTIONS), { message: "Choose one" }),
  ifvgLevel: z.enum(values(IFVG_OPTIONS), { message: "Choose one" }),
  markets: z.string().trim().max(200).optional(),
  struggle: longAnswer("what you struggle with"),
  goal: longAnswer("your goal"),
  whyYou: longAnswer("why you should be picked"),
  hoursPerWeek: z.enum(values(HOURS_OPTIONS), { message: "Choose one" }),
  investment: z.enum(values(INVESTMENT_OPTIONS), { message: "Choose one" }),
  availability: z.string().trim().min(3, { message: "Tell me when you are usually free" }).max(300),
  consent: z.boolean().refine((v) => v === true, { message: "Please confirm to continue" }),
  /** Honeypot: real people never see this field, bots fill it in. */
  website: z.string().max(200).optional(),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;

export const applicationStatusSchema = z.enum(values(STATUS_OPTIONS));
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;

export const labelFor = (options: readonly { value: string; label: string }[], value: string) =>
  options.find((o) => o.value === value)?.label ?? value;
