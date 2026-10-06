import { CaretRight } from "@phosphor-icons/react";
import { Fragment } from "react";
import { EnrollButton, Microline } from "./cta";
import { HERO_FRAGMENTS, RP, futureIst } from "./config";
import { VideoFacade } from "./video-facade";
import { Rv } from "./shared";

export function Hero() {
  const [first, ...rest] = HERO_FRAGMENTS[RP.heroVariant];
  const chip = futureIst(RP.cohortStart);
  const soft = RP.weeksVariant === "soft";
  return (
    <section className="pb-10 pt-8 m:pb-14 m:pt-14 l:pb-[72px] l:pt-[88px]">
      <div className="rp-wrap flex flex-col items-center text-center">
        <p className="rp-eyebrow rp-rise flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-1.5 rounded-full"
              style={{ background: "var(--rp-red)" }}
            />
            The Red Pill
          </span>
          <span className="rp-ink2 font-normal">Live mentorship on Zoom, 1 month</span>
        </p>

        <h1 className="rp-display rp-rise mt-4 max-w-[16ch] m:mt-5 l:mt-6 m:max-w-none">
          <span className="block">{first}</span>
          {rest.map((f) => (
            <Fragment key={f}>
              {" "}
              <span className="m:whitespace-nowrap">{f}</span>
            </Fragment>
          ))}
        </h1>

        <p className="rp-lead rp-ink2 rp-rise rp-rise-1 mt-4 max-w-[34rem] m:mt-5 l:mt-6">
          <strong className="whitespace-nowrap font-semibold text-[var(--ink-1)]">Week 1,</strong>{" "}
          Arjun teaches the full IFVG course live.{" "}
          <strong className="whitespace-nowrap font-semibold text-[var(--ink-1)]">
            Weeks 2 to 4,
          </strong>{" "}
          {soft ? "we work through the live market together." : "you trade the market together."}{" "}
          <strong className="whitespace-nowrap font-semibold text-[var(--ink-1)]">
            Every day,
          </strong>{" "}
          he reviews his own live trades.
        </p>

        <div
          id="hero-cta"
          className="rp-rise rp-rise-2 mt-7 flex w-full flex-col items-center m:mt-8 m:flex-row m:flex-wrap m:justify-center m:gap-x-6 l:mt-9"
        >
          <div className="order-1 flex w-full justify-center m:w-auto">
            <EnrollButton placement="hero" full />
          </div>
          <div className="order-2 w-full m:order-3 m:basis-full">
            <Microline />
            {chip && <p className="rp-small mt-2">Next cohort starts {chip} IST.</p>}
          </div>
          <a href="#walkthrough" className="rp-link order-3 mt-2 m:order-2 m:mt-0">
            Watch the walkthrough
            <CaretRight size={14} weight="bold" aria-hidden />
          </a>
        </div>

        <p className="rp-small rp-ink2 rp-rise rp-rise-2 mt-4 max-w-[30rem]">
          Education only. Not investment advice. Trading involves risk of loss, and no result is
          promised.
        </p>
      </div>
    </section>
  );
}

export function Walkthrough() {
  return (
    <section id="walkthrough" className="scroll-mt-16 pb-[var(--section-y)]">
      <div className="rp-wrap relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[8%] hidden h-[80%] m:block"
          style={{
            background: "radial-gradient(60% 55% at 50% 60%, rgba(224,86,76,.18), transparent 70%)",
          }}
        />
        <h2 className="sr-only">Program walkthrough</h2>
        <div className="rp-scale-in relative mx-auto max-w-[1100px]">
          <VideoFacade duration={RP.videoDuration} />
        </div>
        <Rv className="relative mx-auto mt-6 grid max-w-[1100px] gap-4 m:grid-cols-12 m:gap-10">
          <div className="m:col-span-6">
            <h3 className="rp-h3">Take a closer look.</h3>
            <p className="rp-body rp-ink2 mt-2">
              Arjun walks through the program on camera. Watch it first, then decide.
            </p>
          </div>
          <p className="rp-small rp-ink2 m:col-span-6 m:pt-2">
            Loads from YouTube when you tap. This video explains the program. It is not investment
            advice.
          </p>
        </Rv>
      </div>
    </section>
  );
}
