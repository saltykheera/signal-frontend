import SignalReplicaApp from "@/pages/SignalReplicaApp";
import type { AppTab } from "@/types/messenger";

export default async function Home({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const initialTab: AppTab = tab === "calls" || tab === "stories" ? tab : "chats";
  return <SignalReplicaApp initialTab={initialTab} />;
}
