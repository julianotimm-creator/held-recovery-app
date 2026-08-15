import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service and Disclaimer — HELD" },
      {
        name: "description",
        content:
          "HELD Terms of Service and Disclaimer: what HELD offers, its limitations, privacy, informed consent, and crisis resources.",
      },
      { property: "og:title", content: "HELD — Terms of Service and Disclaimer" },
      {
        property: "og:description",
        content: "Read the HELD terms, disclaimer, privacy notes and safety information.",
      },
      { property: "og:url", content: "https://www.always-beside.com/terms" },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.always-beside.com/terms" }],
  }),
  component: TermsPage,
});

type Block =
  | { type: "p"; text: string }
  | { type: "strong"; text: string }
  | { type: "sub"; text: string }
  | { type: "ul"; items: string[] };

type SectionData = { heading: string; blocks: Block[] };

const sections: SectionData[] = [
  {
    heading: "What HELD Offers",
    blocks: [
      { type: "p", text: "HELD is an AI-powered emotional support companion with:" },
      {
        type: "ul",
        items: [
          "24/7 Availability — Always present when you need to talk, no scheduling or waiting required",
          "Privacy and Anonymity — No real name needed. Private conversations in a secure space",
          "Persistent Memory — HELD remembers previous conversations and offers personalized responses based on your history",
          "Recognition of Common Behaviors — AI recognizes behavioral patterns (procrastination, avoidance, isolation) and offers personalized reflection strategies",
          "Judgment-Free — A space where you can be completely honest without fear of criticism",
          "Deep Reflection — Structured conversations that support self-awareness and personal growth",
          "Exclusive Private Community — Access to an anonymous community of members with similar experiences",
          "Complementary Support — Excellent tool to complement professional therapy between sessions",
          "Recovery Focus — Specifically designed to support people recovering from depression, anxiety, panic, and addiction",
        ],
      },
    ],
  },
  {
    heading: "HELD Exclusive Community",
    blocks: [
      {
        type: "p",
        text: "The HELD Community is a private and anonymous space where members can:",
      },
      {
        type: "ul",
        items: [
          "Connect with other members on similar recovery journeys",
          "Share experiences without revealing identity (randomly generated names: User_XXXX)",
          "Receive peer support — genuine support from people who understand",
          "Maintain complete anonymity — nobody knows who you really are",
          "Discuss common topics — depression, anxiety, recovery, relationships, work",
          "Celebrate progress — share small and big victories",
        ],
      },
      { type: "sub", text: "Within the HELD App" },
      {
        type: "ul",
        items: [
          "Anonymous feed with member posts",
          "Threads for themed discussions",
          "Reaction system (upvotes, hearts)",
          "Anonymous direct messages between members (optional)",
          "Resource library and articles",
        ],
      },
      { type: "sub", text: "Community Moderation" },
      { type: "p", text: "The HELD Community is moderated by qualified professionals:" },
      {
        type: "ul",
        items: [
          "Certified Moderators — Professionals with training in mental health and peer support",
          "Active Supervision — Monitoring discussions to ensure safety",
          "Response to Violations — Harmful content and rule violations are addressed",
          "Crisis Resource Direction — If someone shows signs of crisis, moderators direct them to emergency resources like 988",
          "Continuous Training — Moderators receive ongoing updates in mental health best practices",
          "Confidentiality — Moderators respect the anonymity of all members",
        ],
      },
      { type: "sub", text: "Community Rules" },
      {
        type: "ul",
        items: [
          "Respect and Compassion — Everyone is on a personal journey",
          "Anonymity Preserved — Never share other members' identities",
          "No Spam or Promotion — This is a space for support, not business",
          "Confidentiality — What is shared in the community stays in the community",
          "No Medical Advice — Share experiences, not diagnoses",
          "Active Moderation — Violations result in warnings, suspension, or bans",
        ],
      },
    ],
  },
  {
    heading: "Limitations and What HELD Is Not",
    blocks: [
      { type: "sub", text: "What HELD is NOT" },
      {
        type: "ul",
        items: [
          "Not therapy or medical treatment — HELD does not provide diagnosis, treatment, cure, or prevention of any medical or psychological condition",
          "Does not replace professional therapist — Interactions with HELD do not establish a legal therapeutic relationship",
          "Not medical or psychological advice — Any insight from the AI is informational, not professional",
          "Does not provide continuity of care — HELD cannot provide the structured long-term follow-up that professionals offer",
          "Does not replace medication — If you take medication, continue consulting your doctor",
          "Not a substitute for crisis hotline — In an emergency, call 988 (USA) immediately",
          "Not legally confidential — Unlike a therapist, HELD does not offer professional privilege",
        ],
      },
      { type: "sub", text: "Technical Limitations of AI" },
      {
        type: "ul",
        items: [
          "AI may misinterpret context or provide inadequate suggestions",
          "AI does not truly understand human emotions — it processes language patterns, not feelings",
          "HELD does not detect all crisis signals — automated detection is not perfect, especially for acute suicidal ideation",
          "Responses may be generic or not applicable to your specific situation",
          "HELD may not recognize subtle signs of suicidal ideation or self-harm",
          "Conversations may contain errors, inconsistencies, or technical failures",
        ],
      },
      { type: "sub", text: "Clinical Limitations" },
      {
        type: "ul",
        items: [
          "No prescription of medications or medical recommendations",
          "No professional diagnostic assessment",
          "No real clinical experience with your life context",
          "No structured treatment plan (like in therapy)",
          "No guarantee of improvement or specific results",
        ],
      },
      { type: "sub", text: "Your Responsibility" },
      {
        type: "ul",
        items: [
          "You are responsible for your mental health decisions",
          "You are responsible for seeking professional care when necessary",
          "You are responsible for not relying exclusively on HELD for crises",
          "You are responsible for informing your therapist if you are using HELD",
        ],
      },
    ],
  },
  {
    heading: "1. Eligibility and Age Requirements",
    blocks: [
      {
        type: "ul",
        items: [
          "Minimum Age: HELD is exclusively for those 18 years or older",
          "By using HELD, you confirm you are 18 years or older",
          "Parents/guardians are responsible for minors who access the platform",
          "HELD cannot be used by anyone under 18 years old under any circumstances",
          "You agree to use HELD in accordance with all applicable U.S. and local laws",
        ],
      },
    ],
  },
  {
    heading: "2. When to Seek Help Immediately",
    blocks: [
      {
        type: "strong",
        text: "If you are in crisis now, DO NOT USE HELD. Seek help immediately:",
      },
      { type: "sub", text: "USA" },
      {
        type: "ul",
        items: [
          "National Suicide Prevention Lifeline: 988 (call and SMS, 24 hours)",
          'Crisis Text Line: Text "HOME" to 741741',
          "SAMHSA National Helpline: 1-800-662-4357 (substance and mental health)",
          "Emergency: 911",
        ],
      },
      { type: "sub", text: "Seek professional help immediately if you" },
      {
        type: "ul",
        items: [
          "Are having suicidal or death thoughts",
          "Are experiencing urges to self-harm",
          "Are in severe emotional or psychological crisis",
          "Are in immediate danger (yourself or others)",
          "Have severe symptoms that interfere with daily activities",
          "Are getting worse after using HELD",
          "Are abusing alcohol or drugs",
          "Are experiencing hallucinations, delusions, or loss of touch with reality",
          "Cannot take care of yourself or other responsibilities",
        ],
      },
    ],
  },
  {
    heading: "3. Privacy and Confidentiality",
    blocks: [
      { type: "sub", text: "What HELD collects" },
      {
        type: "ul",
        items: [
          "Email and authentication data",
          "Conversation history",
          "Detected behavioral patterns",
          "Platform usage information",
        ],
      },
      { type: "sub", text: "What HELD does NOT do" },
      {
        type: "ul",
        items: [
          "Does not require real name",
          "Does not sell data to third parties",
          "Does not share history with third parties (except by law)",
          "Does not offer professional privilege like a therapist",
        ],
      },
      { type: "sub", text: "Important — Legal Confidentiality" },
      {
        type: "strong",
        text: "Your conversations with HELD are NOT protected by professional confidentiality.",
      },
      {
        type: "ul",
        items: [
          "Data can be subpoenaed (cited legally)",
          "If you share risk of harm, HELD may be required to inform authorities",
          "Conversations may be reviewed for safety improvements",
          "You have no legal right to privacy as you would with a licensed therapist",
        ],
      },
      { type: "sub", text: "How Data is Used" },
      {
        type: "ul",
        items: [
          "One-on-one conversations with the AI may be automatically reviewed for safety",
          "Community posts are public and can be read by any member",
          "No data is sold to third parties for research, marketing, or any other purpose",
          "User data is stored only for continuity of care and security",
        ],
      },
      { type: "sub", text: "Legal Compliance" },
      {
        type: "ul",
        items: [
          "HELD complies with GDPR (General Data Protection Regulation)",
          "HELD complies with CCPA (California Consumer Privacy Act)",
          "HELD complies with U.S. federal privacy laws",
          "Your privacy is important, but not legally guaranteed",
        ],
      },
    ],
  },
  {
    heading: "4. Informed Consent",
    blocks: [
      { type: "p", text: "By using HELD, you confirm that you understand and accept:" },
      {
        type: "ul",
        items: [
          "HELD does not replace therapy or professional medical care",
          "HELD has technical and clinical limitations you must understand",
          "You are responsible for your mental health decisions",
          "You will seek professional help when necessary",
          "You will not rely exclusively on HELD for crises",
          "You are 18 years or older",
          "You agree with our Complete Privacy Policy",
          "HELD is a wellness complement, not treatment",
        ],
      },
    ],
  },
  {
    heading: "5. Limitation of Liability",
    blocks: [
      { type: "strong", text: 'HELD is provided "as is" without guarantees.' },
      { type: "sub", text: "HELD is not responsible for" },
      {
        type: "ul",
        items: [
          "Emotional, psychological, physical, or financial harm resulting from use",
          "Decisions you make based on conversations",
          "Failures in crisis detection",
          "AI errors or inaccuracies",
          "Data loss or service interruptions",
          "Misuse by third parties or hackers",
          "Consequences of not seeking professional help",
        ],
      },
      { type: "sub", text: "You acknowledge that" },
      {
        type: "ul",
        items: [
          "There is no guarantee of safety, effectiveness, or results",
          "You assume all risks when using HELD",
          "You will not hold HELD responsible for harm",
        ],
      },
    ],
  },
  {
    heading: "6. Rights and Responsibilities",
    blocks: [
      { type: "sub", text: "Your Rights" },
      {
        type: "ul",
        items: [
          "Right to request data deletion (under GDPR/CCPA)",
          "Right to access your history",
          "Right to cancel anytime",
          "Right to request a copy of your data",
          "Right to not receive marketing",
          "Right to file complaints",
        ],
      },
      { type: "sub", text: "Your Responsibilities" },
      {
        type: "ul",
        items: [
          "DO NOT use HELD as a substitute for medical care",
          "DO NOT ignore emergency signs",
          "DO SEEK professional help for serious issues",
          "DO NOT share third-party information",
          "DO NOT use HELD for illegal purposes",
          "DO NOT attempt to bypass security or age verification",
          "DO NOT use if under 18 years old",
        ],
      },
    ],
  },
  {
    heading: "7. Acceptable and Prohibited Use",
    blocks: [
      { type: "sub", text: "Acceptable Use" },
      {
        type: "ul",
        items: [
          "Process feelings in a safe space",
          "Explore thoughts and emotions",
          "Practice self-awareness",
          "Complement professional therapy",
          "Find community and peer support",
        ],
      },
      { type: "sub", text: "Prohibited Use" },
      {
        type: "ul",
        items: [
          "As a substitute for medical treatment",
          "To seek diagnosis or prescription",
          "Share false or harmful information",
          "Abuse the platform",
          "Attempt to hack",
          "Use if under 18",
          "Share login credentials",
        ],
      },
    ],
  },
  {
    heading: "8. Modifications to Terms",
    blocks: [
      { type: "p", text: "HELD may modify these terms at any time." },
      {
        type: "ul",
        items: [
          "Significant changes will be notified",
          "Continued use means you accept new conditions",
          "You can cancel if you disagree",
        ],
      },
    ],
  },
  {
    heading: "9. Termination",
    blocks: [
      { type: "sub", text: "You can cancel anytime" },
      { type: "ul", items: ["No penalty or fees", "Data deleted per privacy policy"] },
      { type: "sub", text: "HELD can terminate if" },
      {
        type: "ul",
        items: [
          "You violate these terms",
          "Illegal or harmful use",
          "Hacking attempts",
          "For business reasons (with notice)",
        ],
      },
    ],
  },
  {
    heading: "10. Complaints and Disputes",
    blocks: [
      { type: "p", text: "If you have a complaint about HELD:" },
      {
        type: "ul",
        items: [
          'Email: support@always-beside.com with subject "GRIEVANCE"',
          'Or: heldalwaysbeside@gmail.com with subject "GRIEVANCE"',
          "Response time: Up to 2 business days",
          "Include: Description of the problem, date/time, and any relevant details",
        ],
      },
      {
        type: "p",
        text: "We will do our best to resolve your concern. If you are not satisfied with the response, you can request an escalation.",
      },
    ],
  },
  {
    heading: "11. Safety Warning",
    blocks: [
      { type: "strong", text: "CRITICAL — If you are in crisis NOW, DO NOT WAIT:" },
      {
        type: "ul",
        items: ["Call 988 (USA)", "Go to the emergency room", "Call 911"],
      },
    ],
  },
  {
    heading: "12. Contact",
    blocks: [
      {
        type: "ul",
        items: [
          "Email: support@always-beside.com",
          "Email: heldalwaysbeside@gmail.com",
          "Website: always-beside.com",
        ],
      },
    ],
  },
  {
    heading: "13. Effective Date",
    blocks: [
      {
        type: "ul",
        items: ["Last updated: August 1, 2026", "Jurisdiction: United States Laws"],
      },
    ],
  },
  {
    heading: "Executive Summary",
    blocks: [
      { type: "strong", text: "HELD is an AI emotional support companion, NOT therapy." },
      { type: "p", text: "Seek professional help immediately if you are in crisis." },
      { type: "strong", text: "In crisis in the USA? Call 988" },
      {
        type: "strong",
        text: "THIS DOCUMENT IS BINDING. BY USING HELD, YOU AGREE TO ALL TERMS ABOVE.",
      },
    ],
  },
];

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === "ul") {
          return (
            <ul key={i} className="mt-3 space-y-2 pl-5">
              {block.items.map((item) => (
                <li
                  key={item}
                  className="list-disc text-[15px] leading-[1.6] text-muted-foreground marker:text-lavender"
                >
                  {item}
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "sub") {
          return (
            <h3 key={i} className="mt-6 text-lg font-semibold text-foreground">
              {block.text}
            </h3>
          );
        }
        if (block.type === "strong") {
          return (
            <p key={i} className="mt-4 text-[15px] font-semibold leading-[1.6] text-foreground">
              {block.text}
            </p>
          );
        }
        return (
          <p key={i} className="mt-4 text-[15px] leading-[1.6] text-muted-foreground">
            {block.text}
          </p>
        );
      })}
    </>
  );
}

function TermsPage() {
  const [accepted, setAccepted] = useState(false);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!accepted) return;
    try {
      localStorage.setItem("terms_accepted", "true");
    } catch {
      /* storage unavailable */
    }
    navigate({ to: "/checkout" });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-br from-primary via-accent-strong to-primary px-5 py-14 text-center">
        <div aria-hidden className="ambient-blob -top-24 left-1/3 size-[360px] opacity-40" />
        <div className="relative mx-auto max-w-3xl">
          <Link
            to="/"
            className="text-xl font-bold tracking-tight text-primary-foreground/90 hover:text-primary-foreground"
          >
            HELD
          </Link>
          <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-primary-foreground sm:text-5xl">
            Terms of Service and Disclaimer
          </h1>
          <p className="mt-4 text-sm text-primary-foreground/80">Last updated: August 1, 2026</p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-5 py-12">
        <article className="mx-auto w-full max-w-3xl">
          <div className="surface-panel lavender-edge rounded-3xl p-6 sm:p-10">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              HELD — Terms of Service and Disclaimer
            </h2>
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-lavender/40 bg-lavender/10 p-4">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-lavender" strokeWidth={1.5} />
              <p className="text-sm leading-[1.6] text-foreground">
                If you are in crisis right now, call <strong>988</strong> (USA) or{" "}
                <strong>911</strong>. HELD is not an emergency service.
              </p>
            </div>

            {sections.map((section) => (
              <section key={section.heading} className="mt-10 border-t border-border pt-8">
                <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {section.heading}
                </h2>
                <Blocks blocks={section.blocks} />
              </section>
            ))}
          </div>
        </article>
      </main>

      {/* Footer actions */}
      <footer className="border-t border-border bg-surface-soft px-5 py-8">
        <div className="mx-auto w-full max-w-3xl">
          <label
            htmlFor="terms_accept_page"
            className="flex cursor-pointer items-start gap-3 text-sm leading-[1.6] text-foreground"
          >
            <input
              id="terms_accept_page"
              name="terms_accept_page"
              type="checkbox"
              required
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 size-5 shrink-0 accent-[hsl(var(--primary))]"
            />
            <span>I have read and accept all terms above</span>
          </label>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex flex-1 items-center justify-center rounded-full border border-border bg-card px-7 py-3.5 text-base font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Back to HELD
            </Link>
            <button
              type="button"
              disabled={!accepted}
              onClick={handleContinue}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-primary to-accent-strong px-7 py-3.5 text-base font-medium text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
              I Understand &amp; Continue
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
