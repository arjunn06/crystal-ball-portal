import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, CircleNotch } from "@phosphor-icons/react";
import { LogoIcon } from "@/components/logo-icon";
import { PillCapsule } from "@/components/site/pill-capsule";
import { SiteShell } from "@/components/site/shell";
import { btnPrimary, container } from "@/components/site/ui";
import { ChoiceGroup, Field, Message, inputClass } from "@/components/site/form-kit";
import { Input } from "@/components/ui/input";
import { submitRedPillApplication } from "@/lib/redpill-applications.functions";
import {
  READY_OPTIONS,
  REDPILL_APPLICATIONS_OPEN,
  STAGE_OPTIONS,
  redpillApplicationSchema,
} from "@/lib/redpill-applications.schema";

const TITLE = "Apply for The Red Pill | Blueprint by Arjun IFVG";
const DESC =
  "Apply to book a call with Arjun for The Red Pill. Slots are limited and Arjun picks who gets one.";

export const Route = createFileRoute("/redpill_/apply")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://blueprint.ifvg.in/redpill/apply" },
      { property: "og:image", content: "https://blueprint.ifvg.in/og-redpill.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
      { name: "twitter:image", content: "https://blueprint.ifvg.in/og-redpill.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://blueprint.ifvg.in/redpill/apply" }],
  }),
  component: RedPillApplyPage,
});

type FormState = {
  name: string;
  email: string;
  phone: string;
  age: string;
  stage: string;
  readyToPay: string;
  website: string;
};

const EMPTY: FormState = {
  name: "",
  email: "",
  phone: "",
  age: "",
  stage: "",
  readyToPay: "",
  website: "",
};

type Errors = Partial<Record<keyof FormState, string>>;

const STEPS = [
  { n: "01", t: "Apply", b: "Six quick questions. It takes about a minute." },
  {
    n: "02",
    t: "Arjun picks",
    b: "Arjun reviews every application and picks who gets a call slot.",
  },
  { n: "03", t: "Get your call", b: "If you are picked, you will be contacted to book your call." },
];

function RedPillApplyPage() {
  const submit = useServerFn(submitRedPillApplication);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<null | { duplicate: boolean }>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    const parsed = redpillApplicationSchema.safeParse(form);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormState;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      const first = Object.keys(EMPTY).find((k) => next[k as keyof FormState]);
      document
        .querySelector(`[data-field="${first}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSending(true);
    try {
      const res = await submit({ data: parsed.data });
      setDone({ duplicate: res.duplicate });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <SiteShell>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(800px_420px_at_85%_-10%,hsl(4_70%_45%/0.2),transparent_70%)]"
      />
      <header className={`${container} relative flex h-16 items-center justify-between`}>
        <Link to="/" className="flex items-center gap-2.5" aria-label="Blueprint home">
          <LogoIcon className="size-8 text-primary" />
          <span className="font-display text-[19px] font-extrabold tracking-tight">Blueprint</span>
        </Link>
      </header>

      <main
        id="main"
        className={`${container} relative grid gap-12 py-10 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-20 lg:py-16`}
      >
        <div className="lg:sticky lg:top-12 lg:self-start">
          <PillCapsule tone="red" className="relative mb-8 w-24 rotate-[-20deg]" />
          <h1 className="font-display text-[clamp(2.4rem,5vw,3.6rem)] font-extrabold leading-[1.04] tracking-[-0.04em]">
            Apply for The Red Pill.
          </h1>
          <p className="mt-6 max-w-[44ch] text-lg leading-relaxed text-muted-foreground">
            Apply to book a call with Arjun. Slots are limited and Arjun picks who gets one.
          </p>
          <ol className="mt-10 space-y-6">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-4">
                <span className="font-mono text-[13px] leading-6 text-muted-foreground">{s.n}</span>
                <div>
                  <p className="font-semibold">{s.t}</p>
                  <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">{s.b}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-2xl border border-pill-red/25 bg-surface p-6 md:p-9">
          {!REDPILL_APPLICATIONS_OPEN ? (
            <Message
              title="Applications are closed"
              body="All Red Pill call slots for this round have been picked."
            />
          ) : done ? (
            <Message
              icon
              title={done.duplicate ? "We already have your application" : "Application received"}
              body={
                done.duplicate
                  ? "An application from this email is already in. Arjun reviews every one, and you will hear from us if you are picked."
                  : "Thank you. Arjun reviews every application and picks who gets a call slot. If you are picked, you will be contacted on WhatsApp or email."
              }
            />
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-6">
              <Field name="name" label="Full name" error={errors.name}>
                <Input
                  id="name"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={inputClass}
                  maxLength={100}
                  aria-invalid={!!errors.name}
                />
              </Field>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field name="email" label="Email" error={errors.email}>
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    className={inputClass}
                    maxLength={255}
                    aria-invalid={!!errors.email}
                  />
                </Field>
                <Field name="phone" label="WhatsApp number" error={errors.phone}>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    className={inputClass}
                    maxLength={20}
                    aria-invalid={!!errors.phone}
                  />
                </Field>
              </div>
              <Field name="age" label="Age" error={errors.age}>
                <Input
                  id="age"
                  inputMode="numeric"
                  value={form.age}
                  onChange={(e) => set("age", e.target.value.replace(/\D/g, "").slice(0, 2))}
                  className={`${inputClass} sm:max-w-[160px]`}
                  aria-invalid={!!errors.age}
                />
              </Field>
              <Field name="stage" label="Where are you right now?" error={errors.stage} group>
                <ChoiceGroup
                  name="stage"
                  options={STAGE_OPTIONS}
                  value={form.stage}
                  onChange={(v) => set("stage", v)}
                />
              </Field>
              <Field
                name="readyToPay"
                label="Are you ready to pay if you are picked?"
                error={errors.readyToPay}
                group
              >
                <ChoiceGroup
                  name="readyToPay"
                  options={READY_OPTIONS}
                  value={form.readyToPay}
                  onChange={(v) => set("readyToPay", v)}
                />
              </Field>

              {/* Honeypot: hidden from people, bots fill it in. */}
              <div aria-hidden className="pointer-events-none absolute -left-[9999px] h-0 w-0">
                <label>
                  Website
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={(e) => set("website", e.target.value)}
                  />
                </label>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={sending} className={`${btnPrimary} w-full`}>
                  {sending ? (
                    <>
                      <CircleNotch className="size-4 animate-spin" weight="bold" />
                      Submitting
                    </>
                  ) : (
                    <>
                      Submit application
                      <ArrowRight className="size-4" weight="bold" />
                    </>
                  )}
                </button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Your details will be securely reviewed by our team
                </p>
              </div>
            </form>
          )}
        </div>
      </main>

      <footer className="relative border-t border-border">
        <div
          className={`${container} flex h-14 items-center justify-between text-xs text-muted-foreground`}
        >
          <span>© Blueprint by Arjun IFVG</span>
          <span>Education only, not financial advice.</span>
        </div>
      </footer>
    </SiteShell>
  );
}
