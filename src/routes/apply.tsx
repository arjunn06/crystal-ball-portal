import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ArrowRight, CheckCircle, CircleNotch } from "@phosphor-icons/react";
import { LogoIcon } from "@/components/logo-icon";
import { SiteShell } from "@/components/site/shell";
import { btnPrimary, container } from "@/components/site/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { submitOneOnOneApplication } from "@/lib/applications.functions";
import {
  APPLICATIONS_OPEN,
  EXPERIENCE_OPTIONS,
  HOURS_OPTIONS,
  IFVG_OPTIONS,
  INVESTMENT_OPTIONS,
  STAGE_OPTIONS,
  applicationSchema,
} from "@/lib/applications.schema";

const TITLE = "Apply for Arjun IFVG's 1-1 Training | Blueprint";
const DESC =
  "Arjun IFVG's first ever 1-1 trading training. Very limited slots. Every application is reviewed personally and shortlisted applicants are invited for a call.";

export const Route = createFileRoute("/apply")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://blueprint.ifvg.in/apply" },
      { property: "og:image", content: "https://blueprint.ifvg.in/og-blueprint.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
      { name: "twitter:image", content: "https://blueprint.ifvg.in/og-blueprint.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://blueprint.ifvg.in/apply" }],
  }),
  component: ApplyPage,
});

type FormState = {
  name: string;
  email: string;
  phone: string;
  location: string;
  discord: string;
  social: string;
  experience: string;
  stage: string;
  ifvgLevel: string;
  markets: string;
  struggle: string;
  goal: string;
  whyYou: string;
  hoursPerWeek: string;
  investment: string;
  availability: string;
  consent: boolean;
  website: string;
};

const EMPTY: FormState = {
  name: "",
  email: "",
  phone: "",
  location: "",
  discord: "",
  social: "",
  experience: "",
  stage: "",
  ifvgLevel: "",
  markets: "",
  struggle: "",
  goal: "",
  whyYou: "",
  hoursPerWeek: "",
  investment: "",
  availability: "",
  consent: false,
  website: "",
};

type Errors = Partial<Record<keyof FormState, string>>;

const inputClass =
  "mt-2 h-12 rounded-lg border border-border bg-input text-[15px] text-foreground placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";
const textareaClass =
  "mt-2 block min-h-[132px] w-full resize-y rounded-lg border border-border bg-input px-3 py-3 text-[15px] leading-relaxed text-foreground transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

const STEPS = [
  { n: "01", t: "Apply", b: "Takes about five minutes. Be honest, there are no right answers." },
  {
    n: "02",
    t: "Arjun reviews",
    b: "Arjun reads every application personally. Nothing is automated.",
  },
  { n: "03", t: "Get invited", b: "If you are shortlisted, you will be invited for a call." },
];

function ApplyPage() {
  const submit = useServerFn(submitOneOnOneApplication);
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
    const parsed = applicationSchema.safeParse(form);
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
      <header className={`${container} flex h-16 items-center justify-between`}>
        <Link to="/" className="flex items-center gap-2.5" aria-label="Blueprint home">
          <LogoIcon className="size-8 text-primary" />
          <span className="font-display text-[19px] font-extrabold tracking-tight">Blueprint</span>
        </Link>
      </header>

      <main
        id="main"
        className={`${container} grid gap-12 py-10 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-20 lg:py-16`}
      >
        <div className="lg:sticky lg:top-12 lg:self-start">
          <p className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <span aria-hidden className="size-1.5 rounded-full bg-primary" />
            First ever 1-1 · Very limited slots
          </p>
          <h1 className="mt-6 font-display text-[clamp(2.4rem,5vw,3.6rem)] font-extrabold leading-[1.04] tracking-[-0.04em]">
            Train with Arjun, one on one.
          </h1>
          <p className="mt-6 max-w-[44ch] text-lg leading-relaxed text-muted-foreground">
            Arjun IFVG is opening a small number of 1-1 training slots for the first time. This is
            by application only, and not everyone who applies will be selected.
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

        <div className="rounded-2xl border border-border bg-surface p-6 md:p-9">
          {!APPLICATIONS_OPEN ? (
            <Message
              title="Applications are closed"
              body="All 1-1 slots for this round have been filled. Follow Arjun for the next opening."
            />
          ) : done ? (
            <Message
              icon
              title={done.duplicate ? "We already have your application" : "Application received"}
              body={
                done.duplicate
                  ? "An application from this email is already in. Arjun reviews every one personally, and you will hear from us if you are shortlisted."
                  : "Thank you. Arjun reviews every application personally. If you are shortlisted you will be invited for a call, so keep an eye on your WhatsApp and email."
              }
            />
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-12">
              <Section title="About you">
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
                <Field name="location" label="City and country" error={errors.location}>
                  <Input
                    id="location"
                    autoComplete="address-level2"
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                    className={inputClass}
                    maxLength={120}
                    aria-invalid={!!errors.location}
                  />
                </Field>
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field name="discord" label="Discord" optional error={errors.discord}>
                    <Input
                      id="discord"
                      value={form.discord}
                      onChange={(e) => set("discord", e.target.value)}
                      className={inputClass}
                      maxLength={60}
                    />
                  </Field>
                  <Field name="social" label="Instagram or X" optional error={errors.social}>
                    <Input
                      id="social"
                      value={form.social}
                      onChange={(e) => set("social", e.target.value)}
                      className={inputClass}
                      maxLength={200}
                    />
                  </Field>
                </div>
              </Section>

              <Section title="Your trading">
                <Field
                  name="experience"
                  label="How long have you been trading?"
                  error={errors.experience}
                  group
                >
                  <ChoiceGroup
                    name="experience"
                    options={EXPERIENCE_OPTIONS}
                    value={form.experience}
                    onChange={(v) => set("experience", v)}
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
                  name="ifvgLevel"
                  label="How well do you know IFVG?"
                  error={errors.ifvgLevel}
                  group
                >
                  <ChoiceGroup
                    name="ifvgLevel"
                    options={IFVG_OPTIONS}
                    value={form.ifvgLevel}
                    onChange={(v) => set("ifvgLevel", v)}
                  />
                </Field>
                <Field name="markets" label="Markets you trade" optional error={errors.markets}>
                  <Input
                    id="markets"
                    placeholder="NQ, ES, Gold, Forex pairs"
                    value={form.markets}
                    onChange={(e) => set("markets", e.target.value)}
                    className={inputClass}
                    maxLength={200}
                  />
                </Field>
              </Section>

              <Section title="In your words">
                <Field
                  name="struggle"
                  label="What is the biggest thing holding your trading back right now?"
                  error={errors.struggle}
                >
                  <textarea
                    id="struggle"
                    value={form.struggle}
                    onChange={(e) => set("struggle", e.target.value)}
                    className={textareaClass}
                    maxLength={1500}
                    aria-invalid={!!errors.struggle}
                  />
                </Field>
                <Field
                  name="goal"
                  label="What do you want your trading to look like in 12 months?"
                  error={errors.goal}
                >
                  <textarea
                    id="goal"
                    value={form.goal}
                    onChange={(e) => set("goal", e.target.value)}
                    className={textareaClass}
                    maxLength={1500}
                    aria-invalid={!!errors.goal}
                  />
                </Field>
                <Field
                  name="whyYou"
                  label="Why should Arjun pick you for one of these slots?"
                  error={errors.whyYou}
                >
                  <textarea
                    id="whyYou"
                    value={form.whyYou}
                    onChange={(e) => set("whyYou", e.target.value)}
                    className={textareaClass}
                    maxLength={1500}
                    aria-invalid={!!errors.whyYou}
                  />
                </Field>
              </Section>

              <Section title="Fit">
                <Field
                  name="hoursPerWeek"
                  label="How many hours a week can you put into trading and review?"
                  error={errors.hoursPerWeek}
                  group
                >
                  <ChoiceGroup
                    name="hoursPerWeek"
                    options={HOURS_OPTIONS}
                    value={form.hoursPerWeek}
                    onChange={(v) => set("hoursPerWeek", v)}
                  />
                </Field>
                <Field
                  name="investment"
                  label="This is a paid training program. Will you be interested to invest if you are selected?"
                  error={errors.investment}
                  group
                >
                  <ChoiceGroup
                    name="investment"
                    options={INVESTMENT_OPTIONS}
                    value={form.investment}
                    onChange={(v) => set("investment", v)}
                    single
                  />
                </Field>
                <Field
                  name="availability"
                  label="When are you usually free for a call?"
                  error={errors.availability}
                >
                  <Input
                    id="availability"
                    placeholder="Weekday evenings, IST"
                    value={form.availability}
                    onChange={(e) => set("availability", e.target.value)}
                    className={inputClass}
                    maxLength={300}
                    aria-invalid={!!errors.availability}
                  />
                </Field>
              </Section>

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

              <div data-field="consent">
                <label className="flex cursor-pointer items-start gap-3 text-[14.5px] leading-snug">
                  <input
                    type="checkbox"
                    checked={form.consent}
                    onChange={(e) => set("consent", e.target.checked)}
                    className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
                  />
                  <span>
                    I understand slots are very limited, applying does not guarantee a spot, and
                    Arjun may contact me on WhatsApp or email if I am shortlisted.
                  </span>
                </label>
                {errors.consent && (
                  <p role="alert" className="mt-2 text-sm text-destructive">
                    {errors.consent}
                  </p>
                )}
              </div>

              <div>
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

      <footer className="border-t border-border">
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-6">
      <legend className="mb-6 w-full border-b border-border pb-3 font-display text-lg font-bold tracking-tight">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Field({
  name,
  label,
  error,
  optional,
  group,
  children,
}: {
  name: string;
  label: string;
  error?: string;
  optional?: boolean;
  /** Radio groups are labelled by a div, text inputs by a <label for>. */
  group?: boolean;
  children: ReactNode;
}) {
  return (
    <div data-field={name}>
      {group ? (
        <p className="text-sm font-medium">{label}</p>
      ) : (
        <Label htmlFor={name} className="text-sm font-medium">
          {label}
          {optional && <span className="ml-1.5 font-normal text-muted-foreground">Optional</span>}
        </Label>
      )}
      {children}
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function ChoiceGroup({
  name,
  options,
  value,
  onChange,
  single,
}: {
  name: string;
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  /** One column, for long labels. */
  single?: boolean;
}) {
  return (
    <div role="radiogroup" className={cn("mt-3 grid gap-2", !single && "sm:grid-cols-2")}>
      {options.map((o) => {
        const checked = value === o.value;
        return (
          <label
            key={o.value}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-[14.5px] leading-snug transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
              checked ? "border-primary bg-hover" : "border-border bg-input hover:bg-hover",
            )}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={checked}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            <span
              aria-hidden
              className={cn(
                "grid size-4 shrink-0 place-items-center rounded-full border",
                checked ? "border-primary" : "border-muted-foreground/50",
              )}
            >
              {checked && <span className="size-2 rounded-full bg-primary" />}
            </span>
            {o.label}
          </label>
        );
      })}
    </div>
  );
}

function Message({ title, body, icon }: { title: string; body: string; icon?: boolean }) {
  return (
    <div className="py-8 text-center md:py-14">
      {icon && <CheckCircle className="mx-auto size-12 text-primary" weight="fill" />}
      <h2 className="mt-5 font-display text-2xl font-extrabold tracking-tight">{title}</h2>
      <p className="mx-auto mt-3 max-w-[44ch] leading-relaxed text-muted-foreground">{body}</p>
      <Link to="/" className={`${btnPrimary} mt-8`}>
        Back to Blueprint
      </Link>
    </div>
  );
}
