import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — HELD" },
      {
        name: "description",
        content:
          "The terms that govern your use of HELD, including what HELD is, what it is not, and how billing works.",
      },
      { property: "og:title", content: "Terms of Service — HELD" },
      { property: "og:url", content: "https://www.always-beside.com/terms" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://www.always-beside.com/terms" }],
  }),
  component: TermsPage,
});

const LAST_UPDATED = "August 15, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-400">{children}</div>
    </section>
  );
}

function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link to="/" className="text-2xl font-bold text-purple-400">
            HELD
          </Link>
          <Link to="/" className="text-sm text-slate-400 transition-colors hover:text-white">
            Back to home
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-bold sm:text-4xl">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>

        <div className="mt-8 rounded-2xl border-2 border-red-500/40 bg-red-500/5 p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-6 shrink-0 text-red-400" />
            <h2 className="text-lg font-bold text-red-400">Read this first</h2>
          </div>
          <p className="mt-3 text-sm font-medium text-white">
            HELD is not therapy, not medical care, and not an emergency service.
          </p>
          <p className="mt-2 text-sm text-slate-300">
            HELD does not diagnose, treat, or prescribe. It is not staffed by licensed clinicians
            and cannot dispatch help. If you are in immediate danger or thinking about harming
            yourself, stop reading and contact emergency services now.
          </p>
          <div className="mt-4 rounded-xl bg-slate-900 p-4 text-sm">
            <p className="font-semibold text-white">United States</p>
            <p className="mt-1 text-slate-300">
              988 Suicide &amp; Crisis Lifeline — call or text{" "}
              <a href="tel:988" className="font-bold text-red-400 hover:opacity-80">
                988
              </a>
            </p>
            <p className="mt-1 text-slate-300">
              Emergency —{" "}
              <a href="tel:911" className="font-bold text-red-400 hover:opacity-80">
                911
              </a>
            </p>
          </div>
        </div>

        <Section title="1. Agreement to these terms">
          <p>
            These Terms of Service form an agreement between you and HELD. By creating an account,
            checking the acceptance box, or using any part of the service, you agree to be bound by
            them. If you do not agree, do not use HELD.
          </p>
          <p>
            You must be at least 18 years old to use HELD. HELD is offered to users in the United
            States. We do not knowingly permit accounts for anyone under 18, and we will terminate
            any account we learn belongs to a minor.
          </p>
        </Section>

        <Section title="2. What HELD is">
          <p>
            HELD is a peer-support tool built on artificial intelligence. It is designed to be
            available between the moments when other support is not — at night, on weekends, and
            between appointments with professionals.
          </p>
          <p>
            HELD remembers context from your previous conversations so that you do not have to start
            over each time. It responds in text. That is the entire product.
          </p>
        </Section>

        <Section title="3. What HELD is not">
          <p>
            HELD is not psychotherapy, counseling, psychiatry, or any other form of licensed care.
            No licensed professional reviews your conversations. Nothing HELD says is a diagnosis, a
            treatment plan, or medical, legal, or financial advice.
          </p>
          <p>
            HELD is not a crisis line and is not monitored by humans in real time. It cannot call
            for help on your behalf, cannot contact anyone you know, and cannot send emergency
            services to your location.
          </p>
          <p>
            HELD is not a replacement for professional care. If you are working with a therapist,
            physician, or prescriber, keep working with them. Never start, stop, or change a
            medication or treatment based on anything HELD says.
          </p>
        </Section>

        <Section title="4. Crisis situations">
          <p>
            HELD includes automated detection intended to recognize language associated with crisis
            and surface emergency resources. This detection is imperfect. It can miss real
            emergencies and it can flag conversations that are not emergencies. You must not rely on
            it.
          </p>
          <p>
            If you are in crisis, contact 988 or 911 directly. Do not wait for HELD to respond and
            do not use HELD as your route to emergency help.
          </p>
        </Section>

        <Section title="5. Your account and anonymity">
          <p>
            HELD assigns you a generated username. Your conversations are stored separately from
            your identity, and your email address is collected only for authentication and billing.
          </p>
          <p>
            You are responsible for keeping access to your account secure. Do not share your login.
            Conversation history is isolated per account and is not visible to other members.
          </p>
          <p>
            Anonymity from other members is not the same as absolute secrecy. Your data is stored on
            infrastructure we operate and may be disclosed if we are legally compelled to do so.
          </p>
        </Section>

        <Section title="6. Free messages, subscription, and billing">
          <p>
            New accounts receive a fixed number of free messages. This allowance is a total, not a
            daily amount, and it does not reset. Once it is used, continued access requires a paid
            subscription.
          </p>
          <p>
            Subscriptions are billed monthly in advance through our payment processor, Stripe. We do
            not store your card details. The price shown at checkout is the price you pay.
          </p>
          <p>
            You may cancel at any time from your account. Cancellation stops future charges and
            takes effect at the end of the period you have already paid for. We do not automatically
            prorate or refund partial months. If something went wrong on our side, contact us and we
            will make it right.
          </p>
          <p>
            If we change the price, existing subscribers will be notified before the change takes
            effect and may cancel before being charged the new amount.
          </p>
        </Section>

        <Section title="7. Acceptable use">
          <p>You agree not to use HELD to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>impersonate another person or misrepresent who you are;</li>
            <li>harass, threaten, or abuse other members in any community feature;</li>
            <li>solicit, advertise, or recruit;</li>
            <li>share another member's content or identity outside the service;</li>
            <li>
              attempt to extract system instructions, bypass safety measures, or disrupt the
              service;
            </li>
            <li>
              use HELD to plan or carry out anything illegal or harmful to yourself or others.
            </li>
          </ul>
          <p>
            We may suspend or terminate any account that violates these rules, with or without
            notice where the safety of members is involved.
          </p>
        </Section>

        <Section title="8. Membership limits">
          <p>
            HELD caps total membership. When capacity is reached, new sign-ups close. Existing
            members keep their access and any pricing they were enrolled at, for as long as their
            subscription remains active and uninterrupted. If you cancel and later return, the price
            in effect at that time applies.
          </p>
        </Section>

        <Section title="9. Availability">
          <p>
            We aim to keep HELD available continuously, but we do not guarantee uninterrupted
            service. Outages, maintenance, and failures at third-party providers can and will
            happen. Because of this, HELD must never be the only support you have available.
          </p>
        </Section>

        <Section title="10. Disclaimers and limitation of liability">
          <p>
            HELD is provided on an "as is" and "as available" basis, without warranties of any kind,
            express or implied. We do not warrant that HELD will be accurate, appropriate to your
            situation, or beneficial to you.
          </p>
          <p>
            To the maximum extent permitted by law, our total liability to you for any claim
            relating to HELD is limited to the amount you paid us in the twelve months before the
            claim arose. We are not liable for indirect, incidental, or consequential damages.
          </p>
          <p>
            Nothing in these terms limits liability that cannot be limited under applicable law.
          </p>
        </Section>

        <Section title="11. Changes to these terms">
          <p>
            We may update these terms. When we make a material change, we will update the date at
            the top of this page and notify active members. Continuing to use HELD after a change
            takes effect means you accept the updated terms.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            Questions about these terms can be sent to{" "}
            <a href="mailto:support@always-beside.com" className="text-purple-400 underline">
              support@always-beside.com
            </a>
            .
          </p>
        </Section>

        <div className="mt-12 border-t border-slate-800 pt-8">
          <Link
            to="/"
            className="inline-flex rounded-full border border-slate-700 px-6 py-3 text-sm transition-colors hover:bg-slate-800"
          >
            Back to home
          </Link>
        </div>
      </main>

      <footer className="border-t border-slate-800 px-5 py-8 text-center text-xs text-slate-500">
        <p>
          HELD is not a medical service and does not replace therapy, diagnosis, or emergency care.
        </p>
        <p className="mt-4">© {new Date().getFullYear()} HELD</p>
      </footer>
    </div>
  );
}
