import { z } from "zod";

export const ROLES = [
  "candidate",
  "MP",
  "MLA",
  "party_unit",
  "office",
  "principal",
  "investor",
  "other",
] as const;

export const NEEDS = ["advisory", "mandata", "both"] as const;
export const CHANNELS = ["email", "phone", "whatsapp"] as const;
export const TIMELINES = ["90", "180", "cycle", "governing"] as const;

const text = (min: number, max: number) =>
  z
    .string()
    .transform((v) => v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/\s+/g, " ").trim())
    .pipe(z.string().min(min).max(max));

const optionalText = (max: number) =>
  z
    .union([z.string(), z.undefined(), z.null()])
    .transform((v) => {
      const s = String(v ?? "")
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      return s ? s.slice(0, max) : undefined;
    });

export const intakeSchema = z
  .object({
    name: text(2, 120),
    role: z.enum(ROLES),
    geography: text(3, 240),
    timeline: z.enum(TIMELINES),
    challenge: text(12, 4000),
    room: text(2, 500),
    needType: z
      .string()
      .transform((v) => {
        if (v === "mandata.ai" || v === "platform") return "mandata";
        return v;
      })
      .pipe(z.enum(NEEDS)),
    contactChannel: z.enum(CHANNELS),
    email: z
      .email()
      .max(180)
      .transform((v) => v.trim().toLowerCase()),
    phone: optionalText(40),
    consent: z.literal(true),
    sourcePage: optionalText(200),
    turnstileToken: z.string().max(4000).optional(),
  })
  .superRefine((val, ctx) => {
    if ((val.contactChannel === "phone" || val.contactChannel === "whatsapp") && !val.phone) {
      ctx.addIssue({
        code: "custom",
        message: "Phone is required for this channel.",
        path: ["phone"],
      });
    }
  });

export const infoRequestSchema = z.object({
  name: text(2, 120),
  email: z
    .email()
    .max(180)
    .transform((v) => v.trim().toLowerCase()),
  phone: optionalText(40),
  topic: text(2, 160),
  message: text(8, 2000),
  consent: z.literal(true),
  sourcePage: optionalText(200),
  turnstileToken: z.string().max(4000).optional(),
});

export const whatsappNotifySchema = z.object({
  to: text(8, 20),
  ref: text(4, 32),
  name: optionalText(120),
});

export type IntakeInput = z.infer<typeof intakeSchema>;
export type InfoRequestInput = z.infer<typeof infoRequestSchema>;
