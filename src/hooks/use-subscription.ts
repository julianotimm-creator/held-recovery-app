import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getChatState } from "@/lib/chat.functions";
import type { ChatState } from "@/lib/chat-core";

/**
 * Reads the account state (including subscription status) from the backend.
 * When `pollUntilPaid` is true (right after returning from Stripe) it keeps
 * refetching until the webhook has flipped the account to paid.
 */
export function useSubscription(pollUntilPaid = false, enabled = true) {
  const fetchState = useServerFn(getChatState);

  return useQuery<ChatState>({
    queryKey: ["chat-state"],
    queryFn: () => fetchState(),
    enabled,
    refetchOnWindowFocus: true,
    refetchInterval: (query) =>
      pollUntilPaid && query.state.data?.isPaid !== true ? 3000 : false,
  });
}
