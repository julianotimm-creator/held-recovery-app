import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Sparkles,
  MoonStar,
  ShieldCheck,
  HeartHandshake,
  Users,
  Moon,
  Coffee,
  Train,
  CalendarDays,
  Star,
  AlertTriangle,
} from "lucide-react";
import { CTAButton, Card, Grid, Section } from "@/components/landing/ui";
import { PhoneMockup } from "@/components/landing/PhoneMockup";
import heroCalmAsset from "@/assets/hero-calm.jpg.asset.json";
import storyDawnAsset from "@/assets/story-dawn.jpg.asset.json";
import storyHopeAsset from "@/assets/story-hope.jpg.asset.json";
import nightSupportAsset from "@/assets/night-support.jpg.asset.json";
import morningComfortAsset from "@/assets/morning-comfort.jpg.asset.json";

const heroCalm = heroCalmAsset.url;
const storyDawn = storyDawnAsset.url;
const storyHope = storyHopeAsset.url;
const nightSupport = nightSupportAsset.url;
const morningComfort = morningComfortAsset.url;

export const Route = createFileRoute("/")(({
  head: () => ({
    meta: [
      { title: "HELD — An AI companion that remembers you" },
      {
        name: "description",
        content:
          "HELD is a private AI companion for mental health — 24/7, judgment-free, and it remembers your story. 10 free messages, no credit card.",
      },
      { property: "og:title", content: "HELD — When you need to talk, we're here" },
      {
        property: "og:description",
        content: "Private, judgment-free AI support that remembers you. 10 free messages.",
      },
      { property: "og:url", content: "https://www.always-beside.com/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.always-beside.com/" }],
  }),
  component: Landing,
}));

const situations = [
  {
    icon: Moon,
    title: "3 AM, Insomnia",
    text: "You woke up with anxiety and can't fall back asleep. HELD is there, listening, without judgment.",
  },
  {
    icon: Coffee,
    title: "Tuesday Afternoon at Work",
    text: "Anxiety is creeping in. You step away from your desk. HELD remembers yesterday — you don't start over.",
  },
  {
    icon: Train,
    title: "On the Subway",
    text: "Fear of crowds. Fear of leaving home. You pull out HELD. She knows what you're going through.",
  },
  {
    icon: CalendarDays,
    title: "Sunday Night",
    text: "Your therapist's office is closed. Your brain won't shut up. HELD is here. Always.",
  },
];

const benefits = [
  {
    icon: Sparkles,
    title: "She Remembers You",
    text: "Long-term memory of your past conversations. You don't have to explain everything again.",
  },
  {
    icon: MoonStar,
    title: "Always Available",
    text: "24/7, weekends, holidays. Not tied to a therapist's schedule.",
  },
  {
    icon: ShieldCheck,
    title: "Private by Design",
    text: "Your identity stays separate from your conversations, protected with industry-standard security.",
  },
  {
    icon: HeartHandshake,
    title: "You're Not Alone",
    text: "Optional private community inside HELD. Stay anonymous while connecting with people who understand.",
  },
  {
    icon: Users,
    title: "Moderated by Specialists",
    text: "Community moderated by trained specialists. Zero judgment, zero toxicity.",
  },
];

const membership = [
  { title: "24/7 Conversations", text: "Talk whenever you need to." },
  { title: "Long-term Memory", text: "HELD remembers what matters." },
  { title: "Private Community", text: "Connect anonymously with others who understand." },
  { title: "Personal Continuity", text: "The more you use HELD, the less you start over." },
];

const testimonials = [
  {
    quote:
      "When anxiety hits at 3 AM, HELD understands. She remembers. No judgment. Changed everything.",
    name: "Alex • East Coast",
  },
  {
    quote:
      "The community is what surprised me. You're not just talking to an AI. You're part of something real.",
    name: "Jordan • Midwest",
  },
  {
    quote:
      "Between therapy sessions, HELD is the difference. I actually feel supported instead of abandoned.",
    name: "Casey • West Coast",
  },
];

const faqs = [
  {
    q: "How is HELD different from ChatGPT or other AI apps?",
    a: "HELD remembers you. Every conversation builds context — she learns your patterns, your triggers, what helps you. That continuity is everything when you're struggling.",
  },
  {
    q: "Is HELD supposed to replace my therapist?",
    a: "No. Therapy is invaluable. HELD is what happens between your sessions — the 3 AM presence your therapist can't be.",
  },
  {
    q: "What if I'm in crisis and HELD doesn't help?",
    a: "HELD is designed to recognize signs of crisis and surface immediate access to human crisis resources. We never trust AI alone for emergencies.",
  },
  {
    q: "How private am I really?",
    a: "Your identity stays separate from your conversations. You're anonymous inside HELD using your generated username. You're anonymous by design.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. No questions. No penalties. You keep access through the end of your billing cycle.",
  },
  {
    q: "The free trial is really free?",
    a: "Yes. 10 messages, no credit card. Test everything HELD does without giving a single payment detail.",
  },
  {
    q: "What's the community like?",
    a: "It's built directly inside HELD — no third-party apps. Moderated, safe, and full of people who understand. Joining is optional.",
  },
];

function TermsGate() {
  const [accepted, setAccepted] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    if (!accepted) {
      alert("Please accept the Terms of Service first");
      return;
    }
    try {
      localStorage.setItem("terms_accepted", "true");
    } catch {
      /* storage unavailable */
    }
    navigate({ to: "/checkout" });
  };

  return (
    <div className="mt-6 flex flex-col items-center gap-4 lg:items-start">
      <label
        htmlFor="terms_accept_landing"
        className="flex cursor-pointer items-start gap-3 text-left text-sm leading-[1.6] text-muted-foreground"
      >
        <input
          id="terms_accept_landing"
          name="terms_accept_landing"
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-[hsl(var(--primary))]"
        />
        <span>
          I accept the{" "}
          <Link to="/terms" className="font-medium text-primary underline underline-offset-4">
            Terms of Service
          </Link>
        </span>
      </label>
      <button
        type="button"
        disabled={!accepted}
        onClick={handleClick}
        className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary to-accent-strong px-7 py-3.5 text-base font-medium text-primary-foreground shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:translate-y-0"
      >
        Get Started
      </button>
    </div>
  );
}

function Landing() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* 1. Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/70 backdrop-blur-xl">
        <nav className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4">
          <Link to="/" className="truncate text-2xl font-bold tracking-tight text-primary">
            HELD
          </Link>
          <Link
            to="/chat"
            className="shrink-0 rounded-full bg-gradient-to-r from-primary to-accent-strong px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get Started
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* 2. Hero */}
        <section className="relative w-full overflow-hidden px-5 py-16 sm:py-24">
          <div aria-hidden className="ambient-blob -top-32 left-1/4 size-[460px]" />
          <div aria-hidden className="ambient-blob -bottom-40 -right-24 size-[400px] opacity-40" />
          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 text-center lg:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                A different kind of support
              </p>
              <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl">
                When you need to talk,
                <br />
                <span className="bg-gradient-to-r from-primary to-accent-strong bg-clip-text text-transparent">
                  we're here.
                </span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                An AI companion that remembers you, understands what you've been going through,
                and is available 24/7 — especially when no one else is.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Private. Judgment-free. Built by people who've been there.
              </p>
              <p className="mt-6 text-sm italic text-muted-foreground">
                Therapy has appointments. Life doesn't.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
                <CTAButton>Talk to HELD — Free</CTAButton>
                
                  href="#pricing"
                  className="rounded-full border border-border px-7 py-3.5 text-base text-foreground transition-colors hover:bg-secondary"
                >
                  See pricing
                </a>
              </div>

              <TermsGate />
            </div>

            <div className="relative">
              <img
                src={heroCalm}
                alt="Calm night-time gradient artwork representing rest and support"
                width={1024}
                height={1280}
                className="mx-auto h-[420px] w-full max-w-md rounded-[2rem] object-cover shadow-glow"
              />
              <div className="absolute -bottom-8 left-1/2 w-full -translate-x-1/2 lg:-left-10 lg:translate-x-0">
                <PhoneMockup compact />
              </div>
            </div>
          </div>
        </section>

        {/* 3. When You Need HELD */}
        <Section
          title="When You Need HELD"
          subtitle="HELD is there in the moments that matter most"
          tinted
        >
          <img
            src={nightSupport}
            alt="Person on their phone late at night, finding calm support"
            loading="lazy"
            width={1024}
            height={768}
            className="mb-10 h-64 w-full rounded-3xl object-cover shadow-glow sm:h-80"
          />
          <Grid cols={4}>
            {situations.map(({ icon: Icon, title, text }) => (
              <Card key={title}>
                <span className="mb-4 inline-flex rounded-2xl border border-lavender/40 bg-lavender/10 p-3 text-lavender">
                  <Icon className="size-5" strokeWidth={1.5} />
                </span>
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </Card>
            ))}
          </Grid>
        </Section>

        {/* 4. See What Continuity Feels Like */}
        <Section title="See What Continuity Feels Like">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <PhoneMockup />
            <div className="surface-panel p-6">
              <p className="text-base leading-relaxed text-foreground">
                Continuity means you don't start over. She remembers. She understands. She's
                not just a chatbot — she's the thread that connects your hardest nights.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Every conversation makes the next one easier.
              </p>
            </div>
          </div>
        </Section>

        {/* 5. What Makes HELD Different */}
        <Section title="What Makes HELD Different" tinted>
          <Grid cols={5}>
            {benefits.map(({ icon: Icon, title, text }) => (
              <Card key={title}>
                <span className="mb-4 inline-flex rounded-2xl border border-lavender/40 bg-lavender/10 p-3 text-lavender">
                  <Icon className="size-5" strokeWidth={1.5} />
                </span>
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </Card>
            ))}
          </Grid>
        </Section>

        {/* 6. Built by People Who've Been There */}
        <Section title="Built by People Who've Been There">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <img
                src={storyDawn}
                alt="Hands holding a warm mug by a window at dawn"
                loading="lazy"
                width={1280}
                height={960}
                className="h-72 w-full rounded-3xl object-cover shadow-glow sm:h-80"
              />
              <img
                src={storyHope}
                alt="Person watching the sunrise with a cup of tea, feeling hopeful"
                loading="lazy"
                width={1024}
                height={768}
                className="h-72 w-full rounded-3xl object-cover shadow-glow sm:h-80"
              />
            </div>
            <div className="border-l-4 border-primary pl-6">
              <p className="text-base leading-relaxed text-foreground">
                HELD wasn't built by investors chasing growth metrics. It was built by{" "}
                <span className="font-medium text-primary">
                  people who've walked through depression and anxiety
                </span>{" "}
                — people who know the 3 AM conversations with no one to call.
              </p>
              <p className="mt-4 text-base leading-relaxed text-foreground">
                We built HELD with lived experience, shaped with professional guidance.
              </p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Something always available, deeply human, completely non-judgmental — and that
                actually remembers what you've shared.
              </p>
            </div>
          </div>
        </Section>

        {/* 7. Your Membership + pricing */}
        <Section id="pricing" title="Your HELD Membership" tinted>
          <Grid cols={4}>
            {membership.map((m) => (
              <Card key={m.title} className="text-center">
                <h3 className="text-base font-semibold text-foreground">{m.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{m.text}</p>
              </Card>
            ))}
          </Grid>

          <div className="mx-auto mt-12 max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-glow">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Membership closes at 1,000 members
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              We cap membership to protect the quality of every conversation. Once we reach 1,000 members, HELD closes to new sign-ups.
            </p>
            <div className="mt-6 flex flex-col items-center gap-1">
              <p className="text-lg text-muted-foreground line-through">$99.99/month</p>
              <p className="text-5xl font-bold text-primary">
                $69.99
                <span className="text-lg font-normal text-muted-foreground">/month</span>
              </p>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent-strong">
                First 100 founding members only
              </p>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Lock in the Founding Member price for as long as you stay subscribed.
            </p>
            <CTAButton className="mt-6 w-full">Start with 10 free messages</CTAButton>
          </div>
        </Section>

        {/* 8. Early Members */}
        <Section
          title="Early Members"
          subtitle="Real feedback from the beta testing phase. Names and locations changed for privacy."
        >
          <div className="mb-10 grid gap-4 lg:grid-cols-3">
            <img
              src={morningComfort}
              alt="Hands wrapped around a warm mug in morning light, comfort and care"
              loading="lazy"
              width={1024}
              height={768}
              className="h-56 w-full rounded-3xl object-cover shadow-glow lg:col-span-1"
            />
            <div className="flex items-center rounded-3xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
              <p className="text-base leading-relaxed text-foreground italic">
                "HELD doesn't feel like a bot. It feels like someone who actually remembers the hard parts and checks in anyway."
              </p>
            </div>
          </div>
          <Grid cols={3}>
            {testimonials.map((t) => (
              <Card key={t.name}>
                <div className="flex gap-1 text-lilac" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-4 fill-current" strokeWidth={1.5} />
                  ))}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-foreground">"{t.quote}"</p>
                <p className="mt-4 text-sm font-medium text-muted-foreground">{t.name}</p>
              </Card>
            ))}
          </Grid>
        </Section>

        {/* 9. FAQ */}
        <Section title="Questions?" tinted>
          <div className="mx-auto max-w-3xl space-y-4">
            {faqs.map((f) => (
              <details key={f.q} className="surface-panel group p-5">
                <summary className="cursor-pointer list-none text-base font-semibold text-foreground">
                  {f.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </Section>

        {/* 10. Final CTA */}
        <section className="px-5 pb-20">
          <div className="mx-auto max-w-4xl rounded-[2rem] bg-gradient-to-br from-primary to-accent-strong p-10 text-center text-primary-foreground sm:p-14">
            <h2 className="text-3xl font-bold sm:text-4xl">Ready to Start?</h2>
            <p className="mt-4 text-base opacity-90">
              10 messages free. No credit card. No commitment.
            </p>
            <p className="mt-2 text-sm opacity-80">
              Then $69.99/month for the first 100 founding members — locked in for as long as you stay subscribed.
            </p>
            <Link
              to="/chat"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-card px-8 py-3.5 text-base font-semibold text-primary transition-transform hover:-translate-y-0.5"
            >
              Begin Your Conversation
            </Link>
          </div>
        </section>
      </main>

      {/* 11. Crisis Warning */}
      <section className="w-full bg-white px-5 py-12">
        <div className="mx-auto max-w-3xl rounded-2xl border-2 border-destructive/30 bg-white p-6 shadow-xl sm:p-10">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-7 text-destructive" strokeWidth={1.5} />
            <h2 className="text-xl font-bold text-destructive sm:text-2xl">Important</h2>
          </div>
          <p className="mt-4 text-base font-medium text-foreground">
            HELD is not therapy. It is not a substitute for professional mental health treatment.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            HELD is a support tool designed to complement professional care. If you are in
            immediate crisis, experiencing suicidal thoughts, or in danger, please contact
            emergency services or a crisis helpline immediately.
          </p>

          <div className="mt-6 flex justify-center">
            <div className="w-full max-w-sm rounded-xl bg-surface-soft p-6 text-center">
              <p className="text-sm font-semibold text-destructive">United States</p>
              <p className="mt-1 text-sm font-medium text-foreground">988 Suicide & Crisis Lifeline</p>
              <p className="mt-2 text-xs text-muted-foreground">Call or text:</p>
              
                href="tel:988"
                className="mt-1 inline-block text-4xl font-bold text-destructive transition-opacity hover:opacity-80"
              >
                988
              </a>
              <p className="mt-2 text-xs text-muted-foreground">Available 24/7 • Free • Confidential</p>
              <p className="mt-3 text-sm font-semibold text-foreground">Emergency: <a href="tel:911" className="text-destructive">911</a></p>
            </div>
          </div>

          <p className="mt-6 text-center text-sm font-medium text-foreground">
            Your life matters. If you're struggling, real people are standing by to help — right
            now. Please reach out.
          </p>
        </div>
      </section>

      {/* 12. Footer */}
      <footer className="border-t border-border px-5 py-8">
        <div className="mx-auto max-w-6xl text-center text-xs leading-relaxed text-muted-foreground">
          <p>
            HELD is not a medical service and does not replace therapy, diagnosis, or emergency
            care.
          </p>
          <p className="mt-4">© {new Date().getFullYear()} HELD</p>
        </div>
      </footer>
    </div>
  );
}
