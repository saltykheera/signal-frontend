"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings } from "@/components/settings/Settings";
import { NavigationRail } from "@/components/navigation/NavigationRail";
import type { SettingsPage, Theme } from "@/types/messenger";
import { TOKEN_KEY } from "@/lib/api";

type StoredSettings = {
  name: string;
  phone: string;
  theme: Theme;
};

function readStoredSettings(): StoredSettings {
  const fallback: StoredSettings = { name: "Vishal Kumar", phone: "+91 96671 67008", theme: "light" };
  if (typeof window === "undefined") return fallback;
  const savedTheme = localStorage.getItem("signal-theme") as Theme | null;
  const savedProfile = localStorage.getItem("signal-profile");
  const profile = savedProfile ? JSON.parse(savedProfile) as { name: string; phone: string } : fallback;
  return { name: profile.name, phone: profile.phone, theme: savedTheme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") };
}

export function SettingsRoute() {
  const router = useRouter();
  const [settings, setSettings] = useState<StoredSettings>(readStoredSettings);
  const [page, setPage] = useState<SettingsPage>("general");
  const [railCollapsed, setRailCollapsed] = useState(false);

  useEffect(() => { document.documentElement.dataset.theme = settings.theme; }, [settings.theme]);

  function setTheme(nextTheme: Theme) {
    setSettings((current) => ({ ...current, theme: nextTheme }));
    localStorage.setItem("signal-theme", nextTheme);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("signal-profile");
    router.replace("/");
  }

  return <main className={`settings-shell ${railCollapsed ? "rail-collapsed" : ""}`}><NavigationRail tab={null} settingsActive setTab={(tab) => router.push(`/?tab=${tab}`)} openSettings={() => undefined} onToggleRail={() => setRailCollapsed((collapsed) => !collapsed)} /><Settings name={settings.name} phone={settings.phone} theme={settings.theme} setTheme={setTheme} page={page} setPage={setPage} onToggleRail={() => setRailCollapsed((collapsed) => !collapsed)} onLogout={logout} /></main>;
}
