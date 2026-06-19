import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Blueprint — Premium Trading Community" },
      { name: "description", content: "A private community for IFVG traders. Choose your path: The Red Pill for 1-on-1 mentorship, The Blue Pill for premium recorded education." },
      { property: "og:title", content: "Blueprint — Premium Trading Community" },
      { property: "og:description", content: "Choose your path. Trade with intention." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Fixed top navigation — restrained, editorial */}
      <header className="fixed inset-x-0 top-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-baseline gap-3">
            <span className="font-display text-xl font-semibold tracking-tight">
              blueprint<span className="text-primary">.</span>
            </span>
            <span className="label-mono text-muted-foreground hidden sm:inline">by Arjun · IFVG</span>
          </Link>
          <nav className="flex items-center gap-6">
            <a href="#paths" className="hidden md:inline label-mono text-muted-foreground hover:text-foreground transition-colors">The Paths</a>
            <a href="#inside" className="hidden md:inline label-mono text-muted-foreground hover:text-foreground transition-colors">Inside</a>
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
            <Link to="/auth">
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-5">
                Enter
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO — gradient aurora, no imagery */}
      <section className="relative min-h-screen flex items-end overflow-hidden bg-aurora grain">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="relative mx-auto w-full max-w-7xl px-6 pb-24 pt-40 z-10">
          <div className="max-w-3xl">
            <p className="label-mono text-platinum mb-6 flex items-center gap-3">
              <span className="inline-block h-px w-10 bg-platinum/60" />
              A private community, by invitation
            </p>
            <h1 className="text-balance text-5xl md:text-7xl lg:text-[5.5rem] font-display font-semibold leading-[1.02] tracking-tight">
              Two pills.
              <br />
              One <span className="text-gradient-platinum italic font-light">blueprint</span>.
            </h1>
            <p className="mt-8 max-w-xl text-lg md:text-xl text-muted-foreground leading-relaxed">
              A members-only sanctuary for traders who refuse mediocrity.
              Mentorship, livestreamed NY sessions, and the architecture
              of consistent profitability.
            </p>
            <div className="mt-12 flex flex-wrap items-center gap-5">
              <Link to="/auth">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 h-12 glow-red">
                  Request access
                </Button>
              </Link>
              <a href="#paths" className="group inline-flex items-center gap-2 text-sm text-foreground/80 hover:text-foreground transition-colors">
                <span className="label-mono">Choose your path</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </a>
            </div>
          </div>
        </div>
        {/* Bottom marquee of cred markers */}
        <div className="absolute bottom-0 inset-x-0 border-t border-border/40 bg-background/40 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              ["Live", "NY session, every day"],
              ["1:1", "Direct mentorship"],
              ["Funded", "Evaluation → Payout"],
              ["Private", "Discord sanctuary"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline gap-3">
                <span className="font-display text-2xl text-platinum">{k}</span>
                <span className="label-mono text-muted-foreground">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MANIFESTO — quiet editorial breath */}
      <section className="relative mx-auto max-w-5xl px-6 py-32 md:py-44 text-center">
        <p className="label-mono text-platinum mb-8">Manifesto · 001</p>
        <p className="text-balance text-3xl md:text-5xl font-display font-light leading-[1.2] tracking-tight">
          The market does not reward effort.
          <br className="hidden md:block" />
          It rewards <span className="text-gradient-platinum italic">precision</span>,
          patience, and the company you keep.
        </p>
        <div className="hairline mx-auto mt-16 w-40" />
      </section>


      {/* PATHS — the two pills, presented as luxury offerings */}
      <section id="paths" className="relative mx-auto max-w-7xl px-6 py-32">
        <div className="text-center mb-20">
          <p className="label-mono text-platinum mb-4">The two paths</p>
          <h2 className="text-balance text-4xl md:text-6xl font-display font-semibold tracking-tight">
            Choose the depth of your involvement.
          </h2>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          <PillCard
            tone="red"
            label="The Red Pill"
            price="₹4,999"
            unit="one-time"
            tagline="Full mentorship. Hand-guided from first trade to first payout."
            bullets={[
              "Private 1-on-1 mentorship calls",
              "Complete premium education, uncut",
              "Direct support: Evaluation → Funded → Payout",
              "Premium Discord with Red Pill insignia",
            ]}
          />
          <PillCard
            tone="blue"
            label="The Blue Pill"
            price="₹499"
            unit="per month"
            tagline="Premium education on your own rhythm. One private call each month."
            bullets={[
              "Recorded library of every Red Pill session",
              "One private call with me, every month",
              "Premium Discord with Blue Pill insignia",
              "Weekly market reviews · live NY sessions",
            ]}
          />
        </div>
      </section>

      {/* GRADIENT BAND — crimson glow editorial */}
      <section className="relative min-h-[60vh] bg-aurora-crimson overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6 h-full flex items-center">
          <div className="max-w-lg py-24">
            <p className="label-mono text-platinum mb-5">Inside the room</p>
            <h3 className="text-balance text-3xl md:text-5xl font-display font-semibold leading-tight">
              A room of serious traders.
              <br />
              Nothing less.
            </h3>
            <p className="mt-6 text-muted-foreground text-lg leading-relaxed">
              No noise. No tipsters. No screenshots of gains.
              Just disciplined practice, every single session.
            </p>
          </div>
        </div>
      </section>

      {/* INSIDE — what's in the sanctuary */}
      <section id="inside" className="relative mx-auto max-w-7xl px-6 py-32">
        <div className="grid md:grid-cols-12 gap-12 items-end mb-16">
          <div className="md:col-span-7">
            <p className="label-mono text-platinum mb-4">What lives inside</p>
            <h2 className="text-balance text-4xl md:text-5xl font-display font-semibold tracking-tight">
              An architecture for serious capital.
            </h2>
          </div>
          <p className="md:col-span-5 text-muted-foreground text-lg leading-relaxed">
            Every pillar of the community is built to compound: knowledge,
            execution, and the quiet network of traders around you.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-px bg-border/60 rounded-2xl overflow-hidden border border-border/60">
          {[
            { n: "01", t: "Live NY Sessions", d: "Trade alongside me in real time. Read flow, set bias, and execute with conviction." },
            { n: "02", t: "Weekly Market Reviews", d: "Sunday reviews dissecting last week's setups and the architecture of next week's." },
            { n: "03", t: "Funded Account Support", d: "End-to-end guidance from prop firm evaluation to your first withdrawal." },
            { n: "04", t: "Premium Education", d: "The complete IFVG framework — algorithmic delivery, draw on liquidity, time-based bias." },
            { n: "05", t: "Private Discord", d: "A sanctuary of disciplined traders. Pill-coded roles. Zero noise." },
            { n: "06", t: "Private Calls", d: "Direct access for surgical feedback on your charts, journal, and execution." },
          ].map(({ n, t, d }) => (
            <div key={n} className="bg-background p-8 md:p-10 hover:bg-card transition-colors">
              <span className="label-mono text-platinum">{n}</span>
              <h3 className="mt-6 font-display text-xl font-semibold">{t}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA — final invitation */}
      <section className="relative overflow-hidden bg-aurora-steel">
        <div className="absolute inset-0 bg-grid opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        <div className="relative mx-auto max-w-3xl px-6 py-40 text-center">
          <p className="label-mono text-platinum mb-6">The invitation</p>
          <h2 className="text-balance text-4xl md:text-6xl font-display font-semibold leading-[1.05] tracking-tight">
            Step inside the <span className="text-gradient-platinum italic font-light">Blueprint</span>.
          </h2>
          <p className="mt-8 text-muted-foreground text-lg">
            Choose your pill. The door closes behind you.
          </p>
          <div className="mt-12">
            <Link to="/auth">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-10 h-14 text-base glow-red">
                Request access
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-lg font-semibold">blueprint<span className="text-primary">.</span></span>
            <span className="label-mono text-muted-foreground">by Arjun · IFVG · est. 2026</span>
          </div>
          <p className="label-mono text-muted-foreground">Members only. By invitation.</p>
        </div>
      </footer>
    </div>
  );
}

function PillCard({ tone, label, price, unit, tagline, bullets }: { tone: "red" | "blue"; label: string; price: string; unit: string; tagline: string; bullets: string[] }) {
  const isRed = tone === "red";
  return (
    <div className={`group relative overflow-hidden rounded-3xl border border-border/70 bg-card/60 backdrop-blur-sm p-10 md:p-12 transition-all duration-700 hover:border-transparent ${isRed ? "hover:ring-red" : "hover:ring-blue"}`}>
      <div className={`pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full blur-3xl opacity-20 transition-opacity duration-700 group-hover:opacity-70 ${isRed ? "bg-red-pill" : "bg-blue-pill"}`} />
      <div className="flex items-center justify-between">
        <p className={`label-mono ${isRed ? "text-red-pill" : "text-blue-pill"}`}>{label}</p>
        <span className="label-mono text-muted-foreground">{isRed ? "I" : "II"}</span>
      </div>
      <div className="hairline mt-6" />
      <div className="mt-8 flex items-baseline gap-2">
        <span className="font-display text-5xl md:text-6xl font-semibold tracking-tight">{price}</span>
        <span className="label-mono text-muted-foreground">{unit}</span>
      </div>
      <h3 className="mt-8 text-xl md:text-2xl font-display font-medium leading-snug text-balance">{tagline}</h3>
      <ul className="mt-10 space-y-4 text-sm md:text-base text-foreground/90">
        {bullets.map(b => (
          <li key={b} className="flex gap-4 items-start">
            <span className={`mt-2 inline-block h-px w-6 shrink-0 ${isRed ? "bg-red-pill" : "bg-blue-pill"}`} />
            <span className="leading-relaxed">{b}</span>
          </li>
        ))}
      </ul>
      <div className="mt-12">
        <Link to="/auth">
          <Button
            variant="outline"
            className={`w-full rounded-full h-12 border-border/70 bg-transparent hover:bg-foreground hover:text-background transition-colors`}
          >
            Take the {isRed ? "Red" : "Blue"} Pill
          </Button>
        </Link>
      </div>
    </div>
  );
}