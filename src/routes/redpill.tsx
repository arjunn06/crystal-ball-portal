import { createFileRoute } from "@tanstack/react-router";
import { PRICE_TAXES } from "@/components/redpill/config";
import { RpNav } from "@/components/redpill/nav";
import { RpMobileBar } from "@/components/redpill/mobile-bar";
import { Hero, Walkthrough } from "@/components/redpill/hero";
import { DiscordSection, Fit, Modules, Month, Note, TobiSection } from "@/components/redpill/proof";
import { Faq, Final, Join, Notes } from "@/components/redpill/buy";
import { RP_HEAD_SCRIPT, useRpPage } from "@/components/redpill/use-rp-page";

const TITLE = "The Red Pill: a live IFVG mentorship on Zoom | Blueprint by Arjun IFVG";
const DESC = `A one-month live IFVG mentorship on Zoom. Full course in week 1, then we trade the market together. ${PRICE_TAXES}, one time.`;

export const Route = createFileRoute("/redpill")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "product" },
      { property: "og:url", content: "https://blueprint.ifvg.in/redpill" },
      { property: "og:image", content: "https://blueprint.ifvg.in/og-redpill.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
      { name: "twitter:image", content: "https://blueprint.ifvg.in/og-redpill.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://blueprint.ifvg.in/redpill" }],
    scripts: [
      { children: RP_HEAD_SCRIPT },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Course",
          name: "The Red Pill: a live IFVG mentorship on Zoom",
          description:
            "A one-month live Zoom trading education program covering the IFVG model, with premium Discord access.",
          provider: { "@type": "Organization", name: "Blueprint by Arjun IFVG" },
          offers: { "@type": "Offer", price: "2999", priceCurrency: "INR" },
        }),
      },
    ],
  }),
  component: RedPill,
});

function RedPill() {
  useRpPage();
  return (
    <div
      id="top"
      className="rp dark relative min-h-[100dvh] overflow-x-clip bg-background text-foreground"
    >
      <a
        href="#main"
        className="sr-only z-[70] rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <div id="rp-sentinel" aria-hidden className="absolute left-0 top-0 h-px w-px" />
      <RpNav />
      <main id="main">
        <Hero />
        <Walkthrough />
        <Note />
        <TobiSection />
        <Month />
        <Modules />
        <DiscordSection />
        <Fit />
        <Join />
        <Faq />
        <Final />
      </main>
      <Notes />
      <RpMobileBar />
    </div>
  );
}
