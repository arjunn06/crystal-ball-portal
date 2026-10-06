import { Link } from "@tanstack/react-router";
import { Check, Lock, Plus } from "@phosphor-icons/react";
import { EnrollButton, Microline } from "./cta";
import { PRICE, QUOTES, RP, buildFaq, futureIst } from "./config";
import { Fn, Rv } from "./shared";

/* ---------------------------------------------------------------- */
/* Join: three steps and the price card                               */
/* ---------------------------------------------------------------- */
const STEPS = [
  { n: "01", t: "Sign in.", b: "Continue with Google, or get a code by email." },
  { n: "02", t: "Pay once.", b: `${PRICE} on Razorpay. One payment, no recurring charge.` },
  {
    n: "03",
    t: "Join Discord.",
    b: "Your Red Pill role opens the premium channels, session links and community.",
  },
];

const LEDGER = [
  ["Week 1", "Full course, 9 modules, live with Q&A"],
  ["Weeks 2 to 4", "Live sessions, we trade the market together"],
  ["Every day", "Execution reviews of Arjun's own live trades"],
  ["Discord", "Trade updates, session links and community"],
];

export function Join() {
  const start = futureIst(RP.cohortStart);
  const close = futureIst(RP.registrationClose);
  const soft = RP.weeksVariant === "soft";
  const ledger = LEDGER.map((r) =>
    soft && r[0] === "Weeks 2 to 4"
      ? [r[0], "Live sessions, we work through the live market together"]
      : r,
  );
  return (
    <section id="join" className="rp-section rp-band">
      <div className="rp-wrap">
        <Rv className="text-center">
          <h2 className="rp-h2">Sign in. Pay once. Join Discord.</h2>
          <p className="rp-lead rp-ink2 mx-auto mt-4 max-w-[34rem]">
            Three steps. No password to set up, no subscription.
          </p>
        </Rv>

        <ol className="mt-[var(--head-gap)] grid gap-3 m:grid-cols-3">
          {STEPS.map((s, i) => (
            <Rv as="li" key={s.n} i={i} className="rp-tile-2 p-8">
              <span className="rp-mono rp-ink2 text-[13px]">{s.n}</span>
              <h3 className="mt-3 text-[28px] font-semibold leading-[1.1] tracking-[-0.02em]">
                {s.t}
              </h3>
              <p className="rp-body rp-ink2 mt-3">{s.b}</p>
            </Rv>
          ))}
        </ol>
        <p className="rp-small rp-ink2 mt-5 text-center">
          Week 1 is the full course, live. Session links are posted in the Discord.
          {RP.firstSession && start && ` First session: ${RP.firstSession}.`}
        </p>

        {/* Price card */}
        <Rv
          id="join-card"
          i={1}
          className="rp-tile-2 relative mx-auto mt-14 max-w-[960px] overflow-hidden p-6 m:p-10"
        >
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: "var(--rp-red)", opacity: 0.6 }}
          />
          <div className="grid grid-cols-1 gap-10 l:grid-cols-2 l:gap-12">
            <div>
              <p className="text-[17px] font-semibold">The Red Pill</p>
              <p className="rp-num mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span
                  className="font-semibold leading-none tracking-[-0.03em]"
                  style={{ fontSize: "clamp(2.5rem, 0.5rem + 14vw, 5rem)" }}
                >
                  <span style={{ fontSize: "0.7em" }}>₹</span>
                  {PRICE.slice(1)}
                </span>
                <span className="rp-body rp-ink2 whitespace-nowrap">one time</span>
              </p>
              {RP.taxLine && <p className="rp-small rp-ink2 mt-2">{RP.taxLine}</p>}
              <dl className="rp-ledger mt-8">
                {ledger.map(([k, v]) => (
                  <div key={k} className="grid gap-1 py-4 m:grid-cols-[110px_1fr] m:gap-4">
                    <dt className="rp-mono rp-ink2 text-[13px]">{k}</dt>
                    <dd className="rp-body">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="flex flex-col">
              <EnrollButton placement="join" full className="!max-w-none !w-full" />
              <Microline>One payment. No recurring charge. Nothing renews.</Microline>

              <p className="rp-small mt-5">
                {start
                  ? `${RP.cohortNumber ? `Cohort ${RP.cohortNumber}` : "The next cohort"} starts ${start} IST.${close ? ` Enrolment closes ${close} IST.` : ""}${RP.seatCap ? ` Each cohort is capped at ${RP.seatCap} so live Q&A works.` : ""}`
                  : "Registrations are open."}
              </p>

              <div className="rp-small rp-ink2 mt-6 space-y-5">
                <p className="flex items-start gap-2">
                  <Lock size={16} weight="regular" aria-hidden className="mt-0.5 shrink-0" />
                  <span>
                    Pay on Razorpay{RP.paymentMethods ? ` with ${RP.paymentMethods}` : ""}.
                    {RP.receiptsOn ? " You get a receipt by email." : ""}
                    <Fn n={5} />
                  </span>
                </p>

                {RP.refundLine ? (
                  <p>Refunds: {RP.refundLine}</p>
                ) : (
                  <p>
                    Try before you pay:{" "}
                    <a
                      href="#walkthrough"
                      className="text-[var(--ink-1)] underline underline-offset-4"
                    >
                      watch the walkthrough
                    </a>
                    ,{" "}
                    <a href="#modules" className="text-[var(--ink-1)] underline underline-offset-4">
                      read the nine modules
                    </a>
                    , and{" "}
                    <a href="#tobi" className="text-[var(--ink-1)] underline underline-offset-4">
                      read what members wrote
                    </a>
                    .
                  </p>
                )}

                {RP.supportContact && (
                  <p>Paid but no access? Write to {RP.supportContact} with your payment ID.</p>
                )}
                <p>
                  Payments for the Red Pill happen only on blueprint.ifvg.in, through Razorpay.
                  {RP.paymentsOnlyOnSiteConfirmed &&
                    " The team never asks for payment by DM, personal UPI or QR. Report anyone who does."}
                </p>

                <p>
                  Education only. No tips, no guaranteed results. Trading involves risk of loss.
                  <Fn n={1} />
                </p>
              </div>
            </div>
          </div>
        </Rv>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* FAQ                                                                */
/* ---------------------------------------------------------------- */
export function Faq() {
  const items = buildFaq(RP);
  return (
    <section id="faq" className="rp-section">
      <div className="rp-wrap grid gap-10 m:grid-cols-12 m:gap-12">
        <Rv className="m:col-span-4">
          <h2 className="rp-h2">Questions, answered.</h2>
        </Rv>
        <div className="rp-faq m:col-span-8">
          {items.map((it) => (
            <details key={it.id} {...{ name: "faq" }}>
              <summary>
                <span>{it.q}</span>
                <Plus size={20} weight="bold" aria-hidden />
              </summary>
              <div className="rp-ans rp-body">
                <p>{it.a}</p>
                {it.links?.map((l) => (
                  <p key={l.href} className="mt-2">
                    <a href={l.href} className="text-[var(--ink-1)] underline underline-offset-4">
                      {l.label}
                    </a>
                  </p>
                ))}
              </div>
            </details>
          ))}
          <p className="rp-small rp-ink2 mt-6">
            Still unsure? Ask in the Discord after you join
            {RP.supportContact ? `, or write to ${RP.supportContact}` : ""}.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Closing                                                            */
/* ---------------------------------------------------------------- */
export function Final() {
  const start = futureIst(RP.cohortStart);
  return (
    <section
      id="final"
      className="relative grid min-h-[min(100svh,720px)] place-items-center overflow-hidden py-24"
      style={{ background: "var(--darkest)" }}
    >
      <Rv className="rp-wrap relative flex flex-col items-center text-center">
        <div
          aria-hidden
          className="rp-glow pointer-events-none absolute inset-x-0 -top-24 h-[420px]"
          style={{
            background: "radial-gradient(60% 50% at 50% 60%, rgba(224,86,76,.18), transparent 70%)",
          }}
        />
        <h2 className="rp-display relative">
          Take the{" "}
          <span
            style={{
              background: "linear-gradient(180deg, #ff7a6e, #e0564c)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Red Pill.
          </span>
        </h2>
        <p className="rp-lead rp-ink2 relative mt-6 max-w-[34rem]">
          You do not need ten strategies. You need one you can repeat.
        </p>
        <div className="relative mt-8 flex w-full flex-col items-center">
          <EnrollButton placement="final" full className="m:!min-w-[260px]" />
          <p className="rp-small rp-ink2 mt-3">{PRICE} once. One payment. No recurring charge.</p>
          <a href="#walkthrough" className="rp-link mt-2">
            Watch the walkthrough
          </a>
          {start && <p className="rp-small mt-2">Next cohort starts {start} IST.</p>}
        </div>
        <p className="relative mt-10 max-w-[44rem] text-base leading-[1.5] rp-ink2">
          The Red Pill is a trading education program. It is general information, not personal
          advice and not a recommendation to buy or sell anything. Markets carry a real risk of
          loss, and past results, including Arjun's and other members', do not guarantee future
          results.
        </p>
        {RP.bluePillLink && (
          <p className="rp-small rp-ink2 relative mt-8">
            Prefer to start smaller?{" "}
            <Link to="/bluepill" className="text-[var(--ink-1)] underline underline-offset-4">
              See the Blue Pill.
            </Link>
          </p>
        )}
      </Rv>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Notes and footer                                                   */
/* ---------------------------------------------------------------- */
export function Notes() {
  const hasGloss = Object.values(QUOTES).some((q) => q.translation);
  const e = RP.entity;
  const entityParts = e
    ? [
        e.name,
        e.address,
        e.email,
        e.hours,
        e.gstin && `GSTIN ${e.gstin}`,
        e.grievance && `Grievance officer: ${e.grievance}`,
      ].filter(Boolean)
    : [];
  const notes = [
    "Trading involves risk and you can lose money. The Red Pill is education. It is not investment advice, and no result is guaranteed. Past results, including Arjun's and other members', do not guarantee future results.",
    "Trade updates in the members Discord are Arjun's own trades, shared for learning. They are not recommendations. The screenshot is a real update shown to explain the format, not a record of results. Individual trades vary and losses happen.",
    "We do not recommend or endorse any broker or prop firm. You are responsible for making sure any market or platform you use is permitted for you under the laws that apply to you.",
    `Messages are excerpts from the members Discord, in the students' own words. Trimmed parts are marked with "...". Experiences are individual and do not predict your results.${hasGloss ? " Translations of Tamil-English messages are labelled." : ""}`,
    `Payments are processed by Razorpay. The Red Pill is a single one-time charge of ${PRICE} with no subscription.`,
  ];
  return (
    <footer id="notes" className="rp-band rp-pad-bar pt-16 m:pt-20">
      <div className="rp-wrap">
        <h2 className="sr-only">Notes</h2>
        <ol className="rp-fine rp-ink2 max-w-[70ch] list-decimal space-y-3 pl-5">
          {notes.map((n, i) => (
            <li key={i} id={`fn-${i + 1}`} className="rp-fn scroll-mt-24 rounded">
              {n}
            </li>
          ))}
        </ol>

        <p className="rp-small rp-ink2 mt-10 max-w-[70ch]">
          The only official site is blueprint.ifvg.in. Payments happen only on the Razorpay checkout
          reached from the enrol page.
        </p>
        <p className="rp-small rp-ink2 mt-5 max-w-[70ch]">
          Blueprint by Arjun IFVG provides trading education only. Nothing on this site, in our live
          sessions or in our Discord is personalised advice, a tip or a recommendation to buy, sell
          or hold any instrument. Trade examples and screenshots explain a method and are not a
          record of results. Trading carries a high risk of loss. You are solely responsible for
          your own decisions and for making sure the markets and platforms you use are permitted for
          you under the laws that apply to you. We do not recommend or endorse any broker, prop firm
          or platform. Past results do not guarantee future results. This is general information and
          not legal advice.
        </p>

        {entityParts.length > 0 && (
          <p className="rp-small rp-ink2 mt-5 max-w-[70ch]">{entityParts.join(", ")}.</p>
        )}

        <nav
          aria-label="Footer"
          className="rp-small mt-10 flex flex-wrap gap-x-6 gap-y-1 border-t border-[var(--hair)] pt-6"
        >
          <a href="#walkthrough" className="rp-link !min-h-11 !text-sm rp-ink2">
            Watch the walkthrough
          </a>
          {RP.bluePillLink && (
            <Link to="/bluepill" className="rp-link !min-h-11 !text-sm rp-ink2">
              The Blue Pill
            </Link>
          )}
          <Link to="/auth" className="rp-link !min-h-11 !text-sm rp-ink2">
            Sign in
          </Link>
          <Link to="/" className="rp-link !min-h-11 !text-sm rp-ink2">
            Blueprint home
          </Link>
        </nav>
        <p className="rp-fine rp-ink2 mt-6">© Blueprint by Arjun IFVG. All rights reserved.</p>
      </div>
    </footer>
  );
}
