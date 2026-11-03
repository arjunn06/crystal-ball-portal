import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, CircleNotch } from "@phosphor-icons/react";
import { LogoIcon } from "@/components/logo-icon";
import { SiteShell } from "@/components/site/shell";
import { btnPrimary, container } from "@/components/site/ui";
import {
  ChoiceGroup,
  Field,
  Message,
  Section,
  inputClass,
  textareaClass,
} from "@/components/site/form-kit";
import { Input } from "@/components/ui/input";
import { submitOneOnOneApplication } from "@/lib/applications.functions";
import {
  APPLICATIONS_OPEN,
  EXPERIENCE_OPTIONS,
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
  experience: string;
  stage: string;
  whyYou: string;
  investment: string;
  consent: boolean;
  website: string;
};

const EMPTY: FormState = {
  name: "",
  email: "",
  phone: "",
  experience: "",
  stage: "",
  whyYou: "",
  investment: "",
  consent: false,
  website: "",
};

type Errors = Partial<Record<keyof FormState, string>>;

const STEPS = [
  { n: "01", t: "Apply", b: "Takes about two minutes. Be honest, there are no right answers." },
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
                  name="whyYou"
                  label="Tell us where you are in your trading and why you should get a slot"
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
