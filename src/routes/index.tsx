import { createFileRoute } from "@tanstack/react-router";
import { Hash } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Feed } from "@/components/Feed";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Feed · #general — RicozConnect" },
      { name: "description", content: "Company-wide feed of posts, announcements and updates in RicozConnect." },
      { property: "og:title", content: "Feed — RicozConnect" },
      { property: "og:description", content: "Company-wide feed of posts, announcements and updates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <AppShell title="general" subtitle="Company-wide announcements and chatter" icon={<Hash className="h-4 w-4" />}>
      <Feed channelId="general" />
    </AppShell>
  );
}
