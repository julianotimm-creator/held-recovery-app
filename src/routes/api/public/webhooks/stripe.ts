import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute("/api/public/webhooks/stripe")({
  beforeLoad: async ({ context }) => context,
});

export async function POST() {
  return new Response(JSON.stringify({ status: "webhook disabled" }), {
    status: 200,
  });
}
