import { createFileRoute, Link } from "@tanstack/react-router";
import { Hash } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Feed } from "@/components/Feed";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/c/$channelId")({
  head: ({ params }) => ({
    meta: [
      { title: `#${params.channelId} — RicozConnect` },
      { name: "description", content: `Posts and integration events in the #${params.channelId} channel.` },
      { property: "og:title", content: `#${params.channelId} — RicozConnect` },
      { property: "og:description", content: `Posts and integration events in #${params.channelId}.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChannelPage,
});

function ChannelPage() {
  const { channelId } = Route.useParams();
  const { channels } = useStore();
  const ch = channels.find((c) => c.id === channelId);
  return (
    <AppShell title={ch?.name ?? channelId} subtitle={ch?.description} icon={<Hash className="h-4 w-4" />}>
      {ch ? (
        <Feed channelId={channelId} />
      ) : (
        <div className="p-10 text-center text-sm text-muted-foreground">
          Channel not found. <Link to="/" className="text-primary underline">Back to feed</Link>
        </div>
      )}
    </AppShell>
  );
}
