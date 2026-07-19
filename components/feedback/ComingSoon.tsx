"use client";

import type { AppTab } from "@/types/messenger";
import { Icon } from "@/components/ui/Icon";

export function ComingSoon({ tab }: { tab: Exclude<AppTab, "chats"> }) {
  return <section className="coming-soon"><div className="coming-icon"><Icon name={tab === "calls" ? "phone" : "stories"} size={32} /></div><h1>{tab === "calls" ? "Calls" : "Stories"}</h1><p>{tab === "calls" ? "Private voice and video calls are coming soon." : "Share moments with your closest friends. Coming soon."}</p><span>Coming soon</span></section>;
}
