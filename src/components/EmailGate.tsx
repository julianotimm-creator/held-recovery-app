import { MagicLinkLogin } from "@/components/MagicLinkLogin";

export function EmailGate() {
  return (
    <MagicLinkLogin
      title="Enter HELD"
      subtitle="Email only. No password, no real name — you get an anonymous name automatically."
      redirectPath="/chat"
    />
  );
}
