import {
  ChartLine,
  Check,
  ClipboardText,
  LinkSimple,
  UsersThree,
  VideoCamera,
  X,
} from "@phosphor-icons/react";
import { EnrollButton, EnrollTextLink, Microline, TextLink } from "./cta";
import { QUOTES, RP } from "./config";
import { Fn, QuoteBody, QuoteCard, Rv } from "./shared";

/* ---------------------------------------------------------------- */
/* Pick one model                                                     */
/* ---------------------------------------------------------------- */
export function Note() {
  const first = RP.noteVoice === "first";
  return (
    <section className="rp-section">
      <div className="rp-wrap">
        <div className="mx-auto max-w-[22em]">
          <Rv>
            <h2 className="rp-h2">Pick one model.</h2>
          </Rv>
          <Rv i={1} className="mt-8">
            {first && <p className="rp-small rp-ink2 mb-3">A note from Arjun</p>}
            <p className="text-[24px] font-semibold leading-[1.25] tracking-[-0.022em] m:text-[36px] [text-wrap:pretty]">
              {first
                ? "Yes, IFVG comes from ICT. The ideas are out there for free."
                : "IFVG comes from ICT, and the ideas are free to find."}{" "}
              <span className="rp-ink2">
                What is hard is the order, picking one model, and practising it live. That is what
                this month is.
              </span>
            </p>
            <p className="rp-small rp-ink2 mt-6">
              {first ? "Arjun, Blueprint by Arjun IFVG" : "Blueprint by Arjun IFVG"}
            </p>
            <p className="rp-fine rp-ink2 mt-2">IFVG stands for inversion fair value gap.</p>
            {RP.youtubeChannelUrl && (
              <p className="mt-3">
                <TextLink href={RP.youtubeChannelUrl}>More on YouTube</TextLink>
              </p>
            )}
          </Rv>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Tobi                                                               */
/* ---------------------------------------------------------------- */
export function TobiSection() {
  const q = QUOTES.tobi;
  return (
    <section id="tobi" className="scroll-mt-16 pb-[var(--section-y)]">
      <div className="rp-wrap">
        <Rv>
          <h2 className="rp-h2 text-center">Simple, not easy.</h2>
        </Rv>
        <Rv i={1} className="rp-tile mx-auto mt-[var(--head-gap)] max-w-[760px] p-6 m:p-10">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[17px] font-semibold">{q.handle}</span>
            <span className="rp-fine rp-ink2">From the members Discord</span>
            {q.cohort && <span className="rp-fine rp-ink2">{q.cohort}</span>}
          </div>
          <QuoteBody
            q={q}
            className="mt-4 text-[20px] leading-[1.3] tracking-[-0.01em] m:text-[24px] rp-ink2"
          />
          <p className="rp-small rp-ink2 mt-6">
            Experiences are individual and do not predict your results.
            <Fn n={4} />
          </p>
        </Rv>

        <Rv i={2} className="mx-auto mt-14 max-w-[760px]">
          <p className="rp-fine rp-ink2 font-semibold">What the Red Pill will not do</p>
          <ul className="mt-3 grid divide-y divide-[var(--hair)] m:grid-cols-3 m:divide-x m:divide-y-0">
            {[
              "It will not promise you profit.",
              "It will not make you a finished trader in one month.",
              "It will not remove losing trades.",
            ].map((t) => (
              <li key={t} className="rp-body py-4 m:px-5 m:py-1 m:first:pl-0 m:last:pr-0">
                {t}
              </li>
            ))}
          </ul>
        </Rv>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Your month                                                         */
/* ---------------------------------------------------------------- */
const BEATS = (soft: boolean) => [
  {
    label: "Week 1",
    title: "The full course, live.",
    body: "Nine modules, taught live on Zoom with live Q&A. It starts at candles.",
    icon: VideoCamera,
  },
  {
    label: "Weeks 2 to 4",
    title: "We trade together.",
    body: soft
      ? "Live sessions on Zoom where we work through the live market together and you practise your own decisions, with live Q&A."
      : "Live sessions on Zoom where Arjun and the students trade the market together. Same model, now in the live market.",
    icon: UsersThree,
  },
  {
    label: "Every day",
    title: "A live trade review.",
    body: "Arjun reviews the execution of his own live trades. A process to watch, not a result to copy.",
    icon: ClipboardText,
  },
];

export function Month() {
  const beats = BEATS(RP.weeksVariant === "soft");
  return (
    <section id="month" className="rp-section">
      <div className="rp-wrap">
        <Rv className="text-center">
          <h2 className="rp-h2">Your month.</h2>
          <p className="rp-lead rp-ink2 mx-auto mt-4 max-w-[34rem]">
            A live mentorship on Zoom. Session links go up in the members Discord.
          </p>
        </Rv>

        {/* Proportional strip, tablet and up */}
        <Rv i={1} className="mt-[var(--head-gap)] hidden m:block">
          <div className="rp-mono rp-ink2 grid grid-cols-4 gap-2 text-xs">
            {["Week 1", "Week 2", "Week 3", "Week 4"].map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            <div
              className="rp-bar flex min-h-11 items-center px-4 py-2 text-sm font-semibold"
              style={{
                background: "hsl(220 14% 14%)",
                borderRadius: 12,
                boxShadow: "inset 0 0 0 1px hsl(0 0% 100% / .08)",
              }}
            >
              The full course, live.
            </div>
            <div
              className="rp-bar col-span-3 flex min-h-11 items-center px-4 py-2 text-sm font-semibold"
              style={{
                background: "hsl(220 14% 14%)",
                borderRadius: 12,
                boxShadow: "inset 0 0 0 1px hsl(0 0% 100% / .08)",
              }}
            >
              We trade together.
            </div>
          </div>
          <p className="rp-small rp-ink2 mt-5">Execution review, every day.</p>
          <div
            className="rp-bar rp-bar-2 mt-2 h-2 w-full"
            style={{ background: "hsl(220 14% 22%)", borderRadius: 999 }}
          />
        </Rv>

        {/* Three beats */}
        <ol className="relative mt-[var(--head-gap)] grid gap-14 border-l border-[hsl(0_0%_100%/.12)] pl-8 m:grid-cols-3 m:gap-10 m:border-l-0 m:pl-0">
          {beats.map((b, i) => (
            <Rv as="li" key={b.label} i={i} className="relative">
              <span
                aria-hidden
                className="absolute -left-[37px] top-1.5 size-2.5 rounded-full bg-[hsl(220_14%_30%)] m:hidden"
              />
              <p className="rp-mono flex items-center gap-2 text-[13px] font-semibold rp-ink2 m:font-normal">
                <b.icon size={20} weight="regular" aria-hidden className="hidden m:block" />
                {b.label}
              </p>
              <h3 className="rp-h3 mt-3">{b.title}</h3>
              <p className="rp-body rp-ink2 mt-3">{b.body}</p>
            </Rv>
          ))}
        </ol>

        <Rv className="mx-auto mt-14 max-w-[720px]">
          <QuoteCard id="jeevan" />
        </Rv>

        <Rv className="mt-14 flex flex-col items-center text-center">
          {RP.scheduleLine && <p className="rp-small rp-ink2 mb-5">{RP.scheduleLine}</p>}
          <EnrollButton placement="month" full />
          <Microline />
          <div className="mt-2">
            <TextLink href="#modules">See the nine modules</TextLink>
          </div>
        </Rv>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Curriculum                                                         */
/* ---------------------------------------------------------------- */
const CLUSTERS = [
  {
    name: "Foundations",
    range: "01 to 03",
    rows: ["Intro to trading and candles", "Price action", "ICT concepts"],
  },
  {
    name: "Liquidity and time",
    range: "04 to 06",
    rows: ["Liquidity", "Liquidity sweeps", "Time and price"],
  },
  {
    name: "The model and the rules",
    range: "07 to 09",
    rows: ["The IFVG model, with examples", "SMT divergences", "Futures and forex prop firm rules"],
  },
];

export function Modules() {
  return (
    <section id="modules" className="rp-section rp-band">
      <div className="rp-wrap">
        <Rv className="text-center">
          <h2 className="rp-h2">Nine modules. One model.</h2>
          <p className="rp-lead rp-ink2 mx-auto mt-4 max-w-[34rem]">
            Week 1 teaches all nine, live, in this order. It starts at candles.
          </p>
        </Rv>

        <div className="mt-[var(--head-gap)] grid gap-12 m:grid-cols-[minmax(0,240px)_1fr] m:gap-10 l:grid-cols-[minmax(0,380px)_1fr] l:gap-20">
          <Rv className="mx-auto w-full max-w-[380px] self-start">
            <div
              className="overflow-hidden bg-white"
              style={{ borderRadius: 24, boxShadow: "inset 0 0 0 1px hsl(0 0% 100% / .08)" }}
            >
              <img
                src="/img/course-curriculum.png"
                width={402}
                height={618}
                loading="lazy"
                decoding="async"
                alt="The member portal curriculum view, showing sections such as Introduction, PD Arrays, OTE and Fib Concepts, The IFVG Model and Prop Firm Rules, with lessons under each."
                className="block h-auto w-full"
              />
            </div>
            <p className="rp-small rp-ink2 mt-3">A look inside the member portal.</p>
          </Rv>

          <div className="space-y-12">
            {CLUSTERS.map((c, ci) => (
              <Rv key={c.name} i={ci}>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="rp-h3">{c.name}</h3>
                  <span className="rp-mono rp-ink2 whitespace-nowrap text-xs">{c.range}</span>
                </div>
                <ol className="mt-4 border-t border-[var(--hair)]">
                  {c.rows.map((r, ri) => {
                    const n = ci * 3 + ri + 1;
                    const hot = n === 7;
                    return (
                      <li
                        key={r}
                        className="relative flex min-h-14 items-center gap-4 border-b border-[var(--hair)] py-3 pl-1"
                      >
                        {hot && (
                          <span
                            aria-hidden
                            className="rp-vbar absolute inset-y-2 left-0 w-0.5"
                            style={{ background: "var(--rp-red)" }}
                          />
                        )}
                        <span
                          className="rp-mono w-7 shrink-0 text-[13px]"
                          style={{
                            color: hot ? "var(--rp-red)" : "var(--ink-2)",
                            paddingLeft: hot ? 8 : 0,
                          }}
                        >
                          {String(n).padStart(2, "0")}
                        </span>
                        <span className="text-[17px] font-semibold tracking-[-0.01em]">
                          {r}
                          {n === 9 && <Fn n={3} />}
                        </span>
                        {hot && (
                          <span className="rp-small rp-ink2 ml-auto hidden items-center gap-2 l:flex">
                            <span
                              aria-hidden
                              className="size-1.5 rounded-full"
                              style={{ background: "var(--rp-red)" }}
                            />
                            The Red Pill moment
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </Rv>
            ))}
          </div>
        </div>

        <Rv className="mt-24 text-center">
          <p className="rp-lead mx-auto max-w-[34rem]">
            Never placed a trade?{" "}
            <span className="rp-ink2">Week 1 starts at candles. Ask your questions live.</span>
          </p>
        </Rv>

        <Rv i={1} className="mt-10">
          <p className="rp-fine rp-ink2 mb-3 font-semibold">Clear, in their words</p>
          <div
            className="rp-rail"
            role="region"
            aria-roledescription="carousel"
            aria-label="Student messages"
            tabIndex={0}
          >
            <QuoteCard id="cython" />
            <QuoteCard id="sanu" />
            <QuoteCard id="veera" />
          </div>
          <p className="rp-small rp-ink2 mt-4">
            Experiences are individual and do not predict your results.
            <Fn n={4} />
          </p>
        </Rv>

        <Rv className="mt-10 text-center">
          <EnrollTextLink />
        </Rv>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Discord                                                            */
/* ---------------------------------------------------------------- */
export function DiscordSection() {
  return (
    <section id="discord" className="rp-section">
      <div className="rp-wrap">
        <Rv className="text-center">
          <h2 className="rp-h2">Updates. Sessions. Community.</h2>
          <p className="rp-lead rp-ink2 mx-auto mt-4 max-w-[36rem]">
            Your Red Pill role opens the members Discord. Arjun shares his own trade updates so you
            can see the model applied. They are for learning, not recommendations.
          </p>
        </Rv>

        <Rv
          i={1}
          className="rp-tile rp-lift mx-auto mt-[var(--head-gap)] max-w-[1000px] overflow-hidden"
        >
          <picture>
            <source
              media="(max-width: 734px)"
              srcSet="/img/discord-update-phone.png"
              width={452}
              height={565}
            />
            <img
              src="/img/discord-update-wide.png"
              width={935}
              height={565}
              loading="lazy"
              decoding="async"
              alt="A real update in the members-only Discord channel: a chart screenshot and a note about moving a stop to breakeven, ending with the message Thats 1R."
              className="block h-auto w-full"
            />
          </picture>
          <div className="px-5 pb-5 pt-4 m:px-8 m:pb-7">
            <p className="rp-small font-semibold">
              Example of a trade update. Not a result you should expect.
            </p>
            <p className="rp-small rp-ink2 mt-1">
              A real update from the members-only channel, shown to explain the format. 1R is the
              amount risked on a trade, not a profit promise. This is not a record of results.
              Losses happen.
              <Fn n={2} />
            </p>
          </div>
        </Rv>

        <ul className="mx-auto mt-10 grid max-w-[1000px] gap-8 m:grid-cols-3">
          {[
            { icon: ChartLine, t: "Trade updates", b: "Arjun's own trades, shared for learning." },
            {
              icon: LinkSimple,
              t: "Session links",
              b: "For the live classes, posted in the Discord.",
            },
            { icon: UsersThree, t: "Community", b: "The other members, in one place." },
          ].map((x, i) => (
            <Rv as="li" key={x.t} i={i}>
              <x.icon size={24} weight="regular" aria-hidden />
              <p className="mt-3 text-[17px] font-semibold">{x.t}</p>
              <p className="rp-body rp-ink2 mt-1">{x.b}</p>
            </Rv>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Is it right for you                                                */
/* ---------------------------------------------------------------- */
const NOT_FOR = [
  "You want trades to copy without learning the model.",
  "You want a promise of profit. Nobody can give you one.",
  "You will not practise. The model takes repetition.",
  "You want a new strategy every week. The Red Pill teaches one.",
];
const FOR = [
  "You have jumped between strategies and want to commit to one model.",
  "You want to see the model traded live, not only explained.",
  "You want to watch execution reviewed every day, not just theory.",
  "You are starting from candles. Week 1 begins at the beginning.",
];

export function Fit() {
  return (
    <section id="fit" className="rp-section">
      <div className="rp-wrap">
        <Rv className="text-center">
          <h2 className="rp-h2">Is it right for you?</h2>
          <p className="rp-lead rp-ink2 mx-auto mt-4 max-w-[34rem]">
            Read both lists. We would rather you decide now than later.
          </p>
        </Rv>

        <Rv i={1} className="mt-[var(--head-gap)] grid gap-3 m:grid-cols-2">
          {[
            { title: "Not for you if", rows: NOT_FOR, icon: X, label: "Not for you" },
            { title: "For you if", rows: FOR, icon: Check, label: "For you" },
          ].map((col) => (
            <div key={col.title} className="rp-tile p-8 m:p-10">
              <h3 className="rp-h3">{col.title}</h3>
              <ul className="mt-6">
                {col.rows.map((r) => (
                  <li
                    key={r}
                    className="flex min-h-14 items-start gap-3 border-t border-[var(--hair)] py-4"
                  >
                    <col.icon
                      size={20}
                      weight="bold"
                      aria-hidden
                      className={col.icon === Check ? "mt-0.5 shrink-0" : "rp-ink2 mt-0.5 shrink-0"}
                    />
                    <span className="sr-only">{col.label}: </span>
                    <span className="rp-body">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Rv>

        <Rv className="mt-14 text-center">
          <p className="rp-lead mx-auto max-w-[34rem]">
            One month teaches you the model and gives you live practice.{" "}
            <span className="rp-ink2">
              Getting consistent takes longer, and that part is on you.
            </span>
          </p>
          <div className="mt-6">
            <EnrollTextLink />
          </div>
        </Rv>
      </div>
    </section>
  );
}
