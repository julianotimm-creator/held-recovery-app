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

export const Route = createFileRoute("/")(({
  head: () => ({
    meta: [
      { title: "HELD — When you need to talk, we're here" },
      {
        name: "description",
        content:
          "HELD is a private AI companion for mental health — 24/7, judgment-free, and it remembers your story. 10 free messages, no credit card.",
      },
    ],
  }),
  component: Landing,
}));

function Landing() {
  const [accepted, setAccepted] = useState(false);
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (!accepted) {
      alert("Please accept the Terms of Service first");
      return;
    }
    navigate({ to: "/chat" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <h1 className="text-2xl font-bold text-purple-400">HELD</h1>
          <Link
            to="/chat"
            className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
          >
            Get Started
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-5 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="text-center lg:text-left">
              <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">
                A different kind of support
              </p>
              <h2 className="mt-6 text-4xl font-bold leading-tight sm:text-6xl">
                When you need to talk,
                <br />
                <span className="text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
                  we're here.
                </span>
              </h2>
              <p className="mt-6 text-lg text-slate-400">
                An AI companion that remembers you, understands what you've been going through,
                and is available 24/7 — especially when no one else is.
              </p>
              <p className="mt-3 text-sm text-slate-500">
                Private. Judgment-free. Built by people who've been there.
              </p>
              <p className="mt-6 text-sm italic text-slate-500">
                Therapy has appointments. Life doesn't.
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
                <button
                  onClick={handleGetStarted}
                  disabled={!accepted}
                  className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-7 py-3.5 font-medium transition-all disabled:opacity-50"
                >
                  Talk to HELD — Free
                </button>
                
                  href="#pricing"
                  className="rounded-full border border-slate-700 px-7 py-3.5 transition-colors hover:bg-slate-800"
                >
                  See pricing
                </a>
              </div>

              <div className="mt-6 flex flex-col items-center gap-4 lg:items-start">
                <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-400">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="mt-0.5 size-5 rounded"
                  />
                  <span>
                    I accept the{" "}
                    <Link to="/terms" className="text-purple-400 underline">
                      Terms of Service
                    </Link>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* When You Need HELD */}
        <section className="px-5 py-16 bg-slate-900/50">
          <div className="mx-auto max-w-6xl">
            <h3 className="text-center text-3xl font-bold">When You Need HELD</h3>
            <p className="mt-2 text-center text-slate-400">
              HELD is there in the moments that matter most
            </p>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
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
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-slate-800 bg-slate-800/50 p-6">
                  <Icon className="size-6 text-purple-400" />
                  <h4 className="mt-4 font-semibold">{title}</h4>
                  <p className="mt-2 text-sm text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What Makes HELD Different */}
        <section className="px-5 py-16">
          <div className="mx-auto max-w-6xl">
            <h3 className="text-center text-3xl font-bold">What Makes HELD Different</h3>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
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
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-slate-800 bg-slate-800/50 p-6">
                  <Icon className="size-6 text-purple-400" />
                  <h4 className="mt-4 font-semibold">{title}</h4>
                  <p className="mt-2 text-sm text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="px-5 py-16 bg-slate-900/50">
          <div className="mx-auto max-w-4xl">
            <h3 className="text-center text-3xl font-bold">Your HELD Membership</h3>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "24/7 Conversations", text: "Talk whenever you need to." },
                { title: "Long-term Memory", text: "HELD remembers what matters." },
                {
                  title: "Private Community",
                  text: "Connect anonymously with others who understand.",
                },
                {
                  title: "Personal Continuity",
                  text: "The more you use HELD, the less you start over.",
                },
              ].map(({ title, text }) => (
                <div key={title} className="rounded-2xl border border-slate-800 bg-slate-800/50 p-6 text-center">
                  <h4 className="font-semibold">{title}</h4>
                  <p className="mt-2 text-sm text-slate-400">{text}</p>
                </div>
              ))}
            </div>

            <div className="mx-auto mt-12 max-w-md rounded-3xl border border-slate-800 bg-slate-800/80 p-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                Membership closes at 1,000 members
              </p>
              <p className="mt-4 text-sm text-slate-400">
                We cap membership to protect the quality of every conversation. Once we reach 1,000 members, HELD closes to new sign-ups.
              </p>

              <div className="mt-6">
                <p className="text-lg text-slate-500 line-through">$99.99/month</p>
                <p className="text-5xl font-bold text-purple-400">
                  $69.99
                  <span className="text-lg font-normal text-slate-400">/month</span>
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-pink-400">
                  First 100 founding members only
                </p>
              </div>

              <p className="mt-4 text-sm text-slate-400">
                Lock in the Founding Member price for as long as you stay subscribed.
              </p>

              <button
                onClick={handleGetStarted}
                disabled={!accepted}
                className="mt-6 w-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 py-3 font-medium transition-all disabled:opacity-50"
              >
                Start with 10 free messages
              </button>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="px-5 py-16">
          <div className="mx-auto max-w-6xl">
            <h3 className="text-center text-3xl font-bold">Early Members</h3>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
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
              ].map(({ quote, name }) => (
                <div key={name} className="rounded-2xl border border-slate-800 bg-slate-800/50 p-6">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm italic text-slate-300">"{quote}"</p>
                  <p className="mt-4 text-sm font-medium text-slate-500">{name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-5 py-16 bg-slate-900/50">
          <div className="mx-auto max-w-3xl">
            <h3 className="text-center text-3xl font-bold">Questions?</h3>

            <div className="mt-8 space-y-4">
              {[
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
              ].map(({ q, a }) => (
                <details key={q} className="rounded-xl border border-slate-800 bg-slate-800/50 p-5">
                  <summary className="cursor-pointer font-semibold">{q}</summary>
                  <p className="mt-4 text-sm text-slate-400">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-5 py-16">
          <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 p-12 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Ready to Start?</h2>
            <p className="mt-4 text-base opacity-90">
              10 messages free. No credit card. No commitment.
            </p>
            <p className="mt-2 text-sm opacity-80">
              Then $69.99/month for the first 100 founding members — locked in for as long as you stay subscribed.
            </p>
            <Link
              to="/chat"
              className="mt-8 inline-flex rounded-full bg-slate-900 px-8 py-3.5 font-semibold transition-transform hover:-translate-y-0.5"
            >
              Begin Your Conversation
            </Link>
          </div>
        </section>
      </main>

      {/* Crisis Warning */}
      <section className="px-5 py-12 bg-white">
        <div className="mx-auto max-w-3xl rounded-2xl border-2 border-red-200 bg-white p-8 text-slate-900">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-7 text-red-500" />
            <h2 className="text-xl font-bold text-red-600">Important</h2>
          </div>
          <p className="mt-4 font-medium">
            HELD is not therapy. It is not a substitute for professional mental health treatment.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            HELD is a support tool designed to complement professional care. If you are in
            immediate crisis, experiencing suicidal thoughts, or in danger, please contact
            emergency services or a crisis helpline immediately.
          </p>

          <div className="mt-6 flex justify-center">
            <div className="w-full max-w-sm rounded-xl bg-slate-900 p-6 text-center text-white">
              <p className="text-sm font-semibold text-red-400">United States</p>
              <p className="mt-1 text-sm font-medium">988 Suicide & Crisis Lifeline</p>
              <p className="mt-2 text-xs text-slate-400">Call or text:</p>
              
                href="tel:988"
                className="mt-1 inline-block text-4xl font-bold text-red-400 transition-opacity hover:opacity-80"
              >
                988
              </a>
              <p className="mt-2 text-xs text-slate-400">Available 24/7 • Free • Confidential</p>
              <p className="mt-3 text-sm font-semibold">
                Emergency: <a href="tel:911" className="text-red-400">911</a>
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-sm font-medium">
            Your life matters. If you're struggling, real people are standing by to help — right
            now. Please reach out.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-5 py-8 text-center text-xs text-slate-500">
        <p>
          HELD is not a medical service and does not replace therapy, diagnosis, or emergency
          care.
        </p>
        <p className="mt-4">© {new Date().getFullYear()} HELD</p>
      </footer>
    </div>
  );
}
