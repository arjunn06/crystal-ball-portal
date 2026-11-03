import { z } from "zod";
import { STAGE_OPTIONS, values } from "./applications.schema";

/** Flip to false to close Red Pill applications once the slots are filled. */
export const REDPILL_APPLICATIONS_OPEN = true;

export { STAGE_OPTIONS };

export const READY_OPTIONS = [
  { value: "yes", label: "Yes, I am ready to pay" },
  { value: "no", label: "Not right now" },
] as const;

export const redpillApplicationSchema = z.object({
  name: z.string().trim().min(2, { message: "Enter your full name" }).max(100),
  email: z.string().trim().email({ message: "Enter a valid email" }).max(255),
  phone: z
    .string()
    .trim()
    .min(7, { message: "Enter a valid WhatsApp number" })
    .max(20, { message: "Enter a valid WhatsApp number" })
    .regex(/^[+0-9][0-9\s\-()]*$/, { message: "Enter a valid WhatsApp number" }),
  age: z.coerce
    .number({ message: "Enter your age" })
    .int({ message: "Enter your age" })
    .min(10, { message: "Enter a valid age" })
    .max(99, { message: "Enter a valid age" }),
  stage: z.enum(values(STAGE_OPTIONS), { message: "Choose one" }),
  readyToPay: z.enum(values(READY_OPTIONS), { message: "Choose one" }),
  /** Honeypot: real people never see this field, bots fill it in. */
  website: z.string().max(200).optional(),
});

export type RedPillApplicationInput = z.infer<typeof redpillApplicationSchema>;
