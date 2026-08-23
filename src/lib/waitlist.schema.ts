import { z } from "zod";

export const waitlistSchema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email" }).max(255),
  phone: z
    .string()
    .trim()
    .min(7, { message: "Enter a valid phone number" })
    .max(20, { message: "Enter a valid phone number" })
    .regex(/^[+0-9][0-9\s\-()]*$/, { message: "Enter a valid phone number" }),
  name: z.string().trim().max(100).optional(),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;
