"use client";

import type { AppTab } from "@/types/messenger";
import type { IconName } from "@/components/ui/Icon";
import { Icon } from "@/components/ui/Icon";

type NavigationRailProps = {
  tab: AppTab | null;
  setTab: (tab: AppTab) => void;
  openSettings: () => void;
  onToggleRail: () => void;
  settingsActive?: boolean;
};

export function NavigationRail({ tab, setTab, openSettings, onToggleRail, settingsActive = false }: NavigationRailProps) {
  const canToggleRail = tab === "chats" || tab === null;
  const items: Array<{ id: AppTab; label: string; icon: IconName; activeIcon?: IconName }> = [
    { id: "chats", label: "Chats", icon: "chat", activeIcon: "chatFill" },
    { id: "calls", label: "Calls", icon: "phone" },
    { id: "stories", label: "Stories", icon: "stories", activeIcon: "storiesFill" },
  ];

  return (
    <nav className="navigation-rail" aria-label="Primary navigation">
      <button className="rail-menu icon-button" onClick={onToggleRail} disabled={!canToggleRail} aria-label="Collapse navigation"><Icon name="menu" /></button>
      <div className="rail-tabs">{items.map((item) => <button key={item.id} className={`rail-item ${tab === item.id ? "active" : ""}`} onClick={() => setTab(item.id)} aria-current={tab === item.id ? "page" : undefined}><Icon name={tab === item.id && item.activeIcon ? item.activeIcon : item.icon} size={22} /><span>{item.label}</span></button>)}</div>
      <button className={`rail-item rail-settings ${settingsActive ? "active" : ""}`} onClick={openSettings} aria-label="Settings" aria-current={settingsActive ? "page" : undefined}><Icon name={settingsActive ? "settingsFill" : "settings"} size={22} /><span>Settings</span></button>
    </nav>
  );
}
