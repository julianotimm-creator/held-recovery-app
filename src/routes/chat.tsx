import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { EmailGate } from "@/components/EmailGate";
import { PinGate } from "@/components/PinGate";

import { CommunityForum } from "@/components/community/CommunityForum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getChatState, sendMessage } from "@/lib/chat.functions";
import { FREE_MESSAGE_LIMIT } from "@/lib/chat-core";

export type ChatSearch = { tab?: "private" | "community" };

export const Route = createFileRoute("/chat")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Chat — HELD" },
      {
        name: "description",
        content: "Chat anonymously with HELD, your AI companion for recovery.",
      },
      { property: "og:title", content: "Chat — HELD" },
      { property: "og:description", content: "An anonymous space to talk, any time." },
      { property: "og:url", content: "https://www.always-beside.com/chat" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.always-beside.com/chat" }],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { session, loading } = useSession();
  const search = useSearch({ from: "/chat" }) as ChatSearch;
  const navigate = useNavigate({ from: "/chat" });
  const [activeTab, setActiveTab] = useState<"private" | "community">(search.tab ?? "private");
  const [unlocked, setUnlocked] = useState(false);

  function selectTab(tab: "private" | "community") {
    setActiveTab(tab);
    navigate({ search: { tab } });
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!session) return <EmailGate />;

  if (!unlocked) {
    return (
      <PinGate
        userKey={session.user.id}
        email={session.user.email ?? undefined}
        onUnlocked={() => setUnlocked(true)}
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 py-4">
      <div className="mb-3 grid grid-cols-2 gap-1 rounded-full bg-secondary p-1">
        {(
          [
            { key: "private", label: "👤 Private Chat" },
            { key: "community", label: "👥 Community" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => selectTab(tab.key)}
            className={
              activeTab === tab.key
                ? "rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                : "rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "private" ? <ChatWindow /> : <CommunityForum />}
    </div>
  );
}

function ChatWindow() {
  const fetchState = useServerFn(getChatState);
  const send = useServerFn(sendMessage);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["chat-state"],
    queryFn: () => fetchState(),
  });

  const mutation = useMutation({
    mutationFn: (content: string) => send({ data: { content } }),
    onSuccess: (state) => queryClient.setQueryData(["chat-state"], state),
    onError: (err: Error) => {
      if (err.message.includes("LIMIT_REACHED")) navigate({ to: "/checkout" });
      else setError(err.message);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages.length, mutation.isPending]);

  const remaining = data?.remaining ?? FREE_MESSAGE_LIMIT;
  const limitReached = !!data && !data.isPaid && data.remaining <= 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || mutation.isPending || limitReached) return;
    setError(null);
    setInput("");
    mutation.mutate(content);
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-3 pb-3">
        <Link to="/" className="text-lg font-semibold text-foreground">
          HELD
        </Link>
        <span className="text-xs text-muted-foreground">
          {data?.isPaid
            ? `${data.username} · unlimited messages`
            : `${remaining} remaining messages`}
        </span>
      </header>

      <div className="surface-panel flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {isLoading && <p className="text-sm text-muted-foreground">Loading conversation...</p>}
          {!isLoading && data?.messages.length === 0 && (
            <p className="text-sm text-muted-foreground">
              You're safe here. How are you feeling right now?
            </p>
          )}
          {data?.messages.map((m) => (
            <div
              key={m.id}
              className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={
                  m.role === "user"
                    ? "max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                    : "max-w-[85%] rounded-2xl rounded-bl-sm bg-secondary px-4 py-2.5 text-sm text-secondary-foreground"
                }
              >
                {m.content}
              </div>
            </div>
          ))}
          {mutation.isPending && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-secondary px-4 py-2.5 text-sm text-muted-foreground">
                typing...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {limitReached ? (
          <div className="border-t border-border p-4 text-center">
            <p className="text-sm text-foreground">
              Your {FREE_MESSAGE_LIMIT} free messages have ended.
            </p>
            <Link
              to="/checkout"
              className="mt-3 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Continue the Conversation
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="flex gap-2 border-t border-border p-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Write how you're feeling..."
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-full"
              disabled={mutation.isPending}
            >
              <Send className="size-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        )}
      </div>

      {error && <p className="pt-2 text-center text-xs text-destructive">{error}</p>}
      <p className="pt-3 text-center text-[11px] text-muted-foreground">
        In crisis? Call 988 (USA)
      </p>
    </div>
  );
}
