import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, MoonStar, ShieldCheck, HeartHandshake, Users, Moon, Coffee, Train, CalendarDays, Star, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/")(
  {
    head: () => ({
      meta: [
        { title: "HELD — An AI companion that remembers you" },
        { name: "description", content: "HELD is a private AI companion for mental health — 24/7, judgment-free, and it remembers your story. 10 free messages, no credit card." },
        { property: "og:title", content: "HELD — When you need to talk, we're here" },
        { property: "og:description", content: "Private, judgment-free AI support that remembers you. 10 free messages." },
        { property: "og:url", content: "https://www.always-beside.com/" },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: "https://www.always-beside.com/" }],
    }),
    component: Landing,
  }
);

const situations = [
  { icon: Moon, title: "3 AM, Insomnia", text: "You woke up with anxiety and can't fall back asleep. HELD is there, listening, without judgment." },
  { icon: Coffee, title: "Tuesday Afternoon at Work", text: "Anxiety is creeping in. You step away from your desk. HELD remembers yesterday — you don't start over." },
  { icon: Train, title: "On the Subway", text: "Fear of crowds. Fear of leaving home. You pull out HELD. She knows what you're going through." },
  { icon: CalendarDays, title: "Sunday Night", text: "Your therapist's office is closed. Your brain won't shut up. HELD is here. Always." },
];

const benefits = [
  { icon: Sparkles, title: "She Remembers You", text: "Long-term memory of your past conversations. You don't have to explain everything again." },
  { icon: MoonStar, title: "Always Available", text: "24/7, weekends, holidays. Not tied to a therapist's schedule." },
  { icon: ShieldCheck, title: "Private by Design", text: "Your identity stays separate from your conversations, protected with industry-standard security." },
  { icon: HeartHandshake, title: "You're Not Alone", text: "Optional private community inside HELD. Stay anonymous while connecting with people who understand." },
  { icon: Users, title: "Moderated by Specialists", text: "Community moderated by trained specialists. Zero judgment, zero toxicity." },
];

const membership = [
  { title: "24/7 Conversations", text: "Talk whenever you need to." },
  { title: "Long-term Memory", text: "HELD remembers what matters." },
  { title: "Private Community", text: "Connect anonymously with others who understand." },
  { title: "Personal Continuity", text: "The more you use HELD, the less you start over." },
];

const testimonials = [
  { quote: "When anxiety hits at 3 AM, HELD understands. She remembers. No judgment. Changed everything.", name: "Alex • East Coast" },
  { quote: "The community is what surprised me. You're not just talking to an AI. You're part of something real.", name: "Jordan • Midwest" },
  { quote: "Between therapy sessions, HELD is the difference. I actually feel supported instead of abandoned.", name: "Casey • West Coast" },
];

const faqs = [
  { q: "How is HELD different from ChatGPT or other AI apps?", a: "HELD remembers you. Every conversation builds context — she learns your patterns, your triggers, what helps you. That continuity is everything when you're struggling." },
  { q: "Is HELD supposed to replace my therapist?", a: "No. Therapy is invaluable. HELD is what happens between your sessions — the 3 AM presence your therapist can't be." },
  { q: "What if I'm in crisis and HELD doesn't help?", a: "HELD is designed to recognize signs of crisis and surface immediate access to human crisis resources. We never trust AI alone for emergencies." },
  { q: "How private am I really?", a: "Your identity stays separate from your conversations. You're anonymous inside HELD using your generated username. You're anonymous by design." },
  { q: "Can I cancel anytime?", a: "Yes. No questions. No penalties. You keep access through the end of your billing cycle." },
  { q: "The free trial is really free?", a: "Yes. 10 messages, no credit card. Test everything HELD does without giving a single payment detail." },
  { q: "What's the community like?", a: "It's built directly inside HELD — no third-party apps. Moderated, safe, and full of people who understand. Joining is optional." },
];

function TermsGate() {
  const [accepted, setAccepted] = useState(false);
  const navigate = useNavigate();
  const handleClick = () => {
    if (!accepted) { alert("Please accept the Terms of Service first"); return; }
    try { localStorage.setItem("terms_accepted", "true"); } catch { }
    navigate({ to: "/checkout" });
  };
  return (
    <div className="mt-6 flex flex-col items-center gap-4 lg:items-start">
      <label htmlFor="terms_accept_landing" className="flex cursor-pointer items-start gap-3 text-left text-sm leading-[1.6] text-muted-foreground">
        <input id="terms_accept_landing" name="terms_accept_landing" type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[hsl(var(--primary))]" />
        <span>I accept the <Link to="/terms" className="font-medium text-primary underline underline-offset-4">Terms of Service</Link> and understand that <Link to="/privacy" className="font-medium text-primary underline underline-offset-4">Privacy Policy</Link></span>
      </label>
      <button onClick={handleClick} className="w-full rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto">Start with 10 free messages</button>
    </div>
  );
}

function Landing() {
  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-background via-background to-background">
      <main className="flex-1">
        <section className="border-b border-border px-5 py-10 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-foreground">HELD</h1>
              <Link to="/chat" className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">Start free</Link>
            </div>
            <div className="mt-12 grid items-center gap-10 lg:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">A DIFFERENT KIND OF SUPPORT</p>
                <h2 className="mt-4 text-5xl font-bold leading-tight text-foreground sm:text-6xl">When you need to talk, we're here.</h2>
                <p className="mt-6 text-lg leading-relaxed text-muted-foreground">An AI companion that remembers you, understands what you've been going through, and is available 24/7 — especially when no one else is.</p>
                <p className="mt-2 text-sm italic text-muted-foreground">Private. Judgment-free. Built by people who've been there.</p>
                <div className="mt-10"><TermsGate /></div>
              </div>
              <div className="rounded-3xl bg-gradient-to-br from-blue-900 to-purple-900 p-8">
                <div className="text-center text-white">
                  <p className="text-sm font-medium">A real conversation</p>
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-end">
                      <div className="max-w-xs rounded-2xl bg-pink-500 px-4 py-2">
                        <p className="text-sm">Last Sunday was hard. I told you work was usually what started the spiral, but tonight I'm just... stuck.</p>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="max-w-xs rounded-2xl bg-gray-800 px-4 py-2">
                        <p className="text-sm">I remember. And I'm noticing this is different — you're not catastrophizing like usual. That's growth.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-16 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">For the moments therapy can't cover</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {situations.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-border bg-card p-6">
                  <Icon className="size-6 text-primary" />
                  <h3 className="mt-3 font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-muted/30 px-5 py-16 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">Why HELD is different</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {benefits.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-border bg-card p-6 text-center">
                  <Icon className="mx-auto size-6 text-primary" />
                  <h3 className="mt-3 font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="px-5 py-16 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">Your HELD Membership</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {membership.map((m) => (
                <div key={m.title} className="rounded-2xl border border-border bg-card p-6 text-center">
                  <h3 className="font-semibold text-foreground">{m.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{m.text}</p>
                </div>
              ))}
            </div>
            <div className="mx-auto mt-12 max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Membership closes at 1,000 members</p>
              <p className="mt-3 text-sm text-muted-foreground">We cap membership to protect the quality of every conversation.</p>
              <div className="mt-6">
                <p className="text-lg text-muted-foreground line-through">$99.99/month</p>
                <p className="mt-1 text-5xl font-bold text-primary">$69.99<span className="text-lg font-normal text-muted-foreground">/month</span></p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-accent">First 100 founding members only</p>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">Lock in the Founding Member price for as long as you stay subscribed.</p>
              <Link to="/chat" className="mt-6 block w-full rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90">Start with 10 free messages</Link>
            </div>
          </div>
        </section>

        <section className="bg-muted/30 px-5 py-16 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">Early Members</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {testimonials.map((t) => (
                <div key={t.name} className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex gap-1 text-yellow-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-4 fill-current" strokeWidth={1.5} />
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-foreground">"{t.quote}"</p>
                  <p className="mt-4 text-sm font-medium text-muted-foreground">{t.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-16 sm:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">Questions?</h2>
            <div className="mt-10 space-y-4">
              {faqs.map((f) => (
                <details key={f.q} className="group border border-border rounded-lg p-5 bg-card">
                  <summary className="cursor-pointer font-semibold text-foreground list-none">{f.q}</summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-primary to-accent p-10 text-center text-primary-foreground sm:p-14">
            <h2 className="text-3xl font-bold sm:text-4xl">Ready to Start?</h2>
            <p className="mt-4 text-base opacity-90">10 messages free. No credit card. No commitment.</p>
            <p className="mt-2 text-sm opacity-80">Then $69.99/month for the first 100 founding members — locked in for as long as you stay subscribed.</p>
            <Link to="/chat" className="mt-8 inline-flex items-center justify-center rounded-full bg-card px-8 py-3.5 text-base font-semibold text-primary transition-transform hover:-translate-y-0.5">Begin Your Conversation</Link>
          </div>
        </section>
      </main>

      <section className="w-full bg-white px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border-2 border-red-200 bg-white p-6 shadow-lg sm:p-10">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-7 text-red-600" strokeWidth={1.5} />
            <h2 className="text-xl font-bold text-red-600 sm:text-2xl">Important</h2>
          </div>
          <p className="mt-4 text-base font-medium text-foreground">HELD is not therapy. It is not a substitute for professional mental health treatment.</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">HELD is a support tool designed to complement professional care. If you are in immediate crisis, experiencing suicidal thoughts, or in danger, please contact emergency services or a crisis helpline immediately.</p>
          <div className="mt-6 flex justify-center">
            <div className="w-full max-w-sm rounded-lg bg-gray-100 p-6 text-center">
              <p className="text-sm font-semibold text-red-600">United States</p>
              <p className="mt-1 text-sm font-medium text-foreground">988 Suicide & Crisis Lifeline</p>
              <p className="mt-2 text-xs text-muted-foreground">Call or text:</p>
              <a href="tel:988" className="mt-1 inline-block text-4xl font-bold text-red-600 transition-opacity hover:opacity-80">988</a>
              <p className="mt-2 text-xs text-muted-foreground">Available 24/7 • Free • Confidential</p>
            </div>
          </div>
          <p className="mt-6 text-center text-sm font-medium text-foreground">Your life matters. If you're struggling, real people are standing by to help — right now. Please reach out.</p>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl text-center text-xs leading-relaxed text-muted-foreground">
          <p>HELD is not a medical service and does not replace therapy, diagnosis, or emergency care.</p>
          <p className="mt-4">© {new Date().getFullYear()} HELD</p>
        </div>
      </footer>
    </div>
  );
}
