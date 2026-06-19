import { createFileRoute, Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero-pills.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Blueprint — Premium Trading Community" },
      { name: "description", content: "A private community for IFVG traders. Choose your path: The Red Pill for 1-on-1 mentorship, The Blue Pill for premium recorded education." },
      { property: "og:title", content: "Blueprint — Premium Trading Community" },
      { property: "og:description", content: "Choose your path. Trade with intention." },
      { property: "og:image", content: heroImg },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-semibold tracking-tight">blueprint<span className="text-primary">.</span></span>
          <span className="label-mono text-muted-foreground">ifvg</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
          <Link to="/auth">
            <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90">Get access</Button>
          </Link>
        </nav>
      </header>

      <section className="relative">
        <div className="absolute inset-0 -z-10 bg-cover bg-center opacity-70" style={{ backgroundImage: `url(${heroImg})` }} />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        <div className="absolute inset-0 -z-10 bg-grid opacity-30" />

        <div className="relative mx-auto max-w-5xl px-6 pt-24 pb-32 text-center">
          <p className="label-mono text-muted-foreground mb-6">A private community by IFVG</p>
          <h1 className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            This is your <span className="text-gradient-red">last chance</span>.<br />
            After this, there is <span className="text-gradient-blue">no turning back</span>.
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-balance text-lg text-muted-foreground">
            Two pills. Two paths. Both end up in the Premium Discord — livestreamed NY sessions,
            weekly market reviews, and a room full of serious traders.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-red">Enter Blueprint</Button>
            </Link>
            <a href="#pills" className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2">See the two paths →</a>
          </div>
        </div>
      </section>

      <section id="pills" className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-2">
          <PillCard
            tone="red"
            label="The Red Pill"
            price="₹4,999 one-time"
            tagline="The full mentorship."
            bullets={[
              "1-on-1 private mentorship calls",
              "Premium education, uncut & complete",
              "Direct support from Evaluation → Payout on funded accounts",
              "Premium Discord + Red Pill role",
            ]}
          />
          <PillCard
            tone="blue"
            label="The Blue Pill"
            price="₹499 / month"
            tagline="Premium education on your own time."
            bullets={[
              "Recorded sessions of all Red Pill premium education",
              "One private call with me every month",
              "Premium Discord + Blue Pill role",
              "Weekly market reviews & NY session livestreams",
            ]}
          />
        </div>
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Both pills unlock the Premium Discord where I livestream the NY session and post weekly reviews.
        </p>
      </section>
    </div>
  );
}

function PillCard({ tone, label, price, tagline, bullets }: { tone: "red" | "blue"; label: string; price: string; tagline: string; bullets: string[] }) {
  const isRed = tone === "red";
  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all duration-500 hover:border-transparent ${isRed ? "hover:ring-red" : "hover:ring-blue"}`}>
      <div className={`absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-60 ${isRed ? "bg-red-pill" : "bg-blue-pill"}`} />
      <p className={`label-mono ${isRed ? "text-red-pill" : "text-blue-pill"}`}>{label}</p>
      <h3 className="mt-4 text-3xl font-semibold">{tagline}</h3>
      <p className="mt-2 text-2xl font-mono text-muted-foreground">{price}</p>
      <ul className="mt-8 space-y-3 text-sm text-foreground/90">
        {bullets.map(b => (
          <li key={b} className="flex gap-3">
            <span className={`mt-1.5 inline-block size-1.5 shrink-0 rounded-full ${isRed ? "bg-red-pill" : "bg-blue-pill"}`} />
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}