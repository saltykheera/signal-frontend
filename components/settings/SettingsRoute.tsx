"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { Settings } from "@/components/settings/Settings";
import { NavigationRail } from "@/components/navigation/NavigationRail";
import { useMessengerStore } from "@/components/providers/MessengerStoreProvider";
import type { SettingsPage, Theme } from "@/types/messenger";

export function SettingsRoute() {
  const router = useRouter();
  const [theme, setThemeState] = useState<Theme>("light");
  const [page, setPage] = useState<SettingsPage>("general");
  const [railCollapsed, setRailCollapsed] = useState(false);
  const { booting, currentUser, initialize, logout } = useMessengerStore(useShallow((state) => ({
    booting: state.booting,
    currentUser: state.currentUser,
    initialize: state.initialize,
    logout: state.logout,
  })));

  useEffect(() => {
    const timer = setTimeout(() => {
      const savedTheme = localStorage.getItem("signal-theme") as Theme | null;
      setThemeState(savedTheme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
      void initialize();
    }, 0);
    return () => clearTimeout(timer);
  }, [initialize]);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => {
    if (booting || currentUser) return;
    const timer = setTimeout(() => router.replace("/"), 0);
    return () => clearTimeout(timer);
  }, [booting, currentUser, router]);

  function setTheme(nextTheme: Theme) {
    setThemeState(nextTheme);
    localStorage.setItem("signal-theme", nextTheme);
  }

  function handleLogout() {
    logout();
    router.replace("/");
  }

  if (booting || !currentUser) return <main className="app-loading"><span className="loading-spinner" /><strong>Opening settings…</strong></main>;
  return <main className={`settings-shell ${railCollapsed ? "rail-collapsed" : ""}`}><NavigationRail tab={null} settingsActive setTab={(nextTab) => router.push(`/?tab=${nextTab}`)} openSettings={() => undefined} onToggleRail={() => setRailCollapsed((collapsed) => !collapsed)} /><Settings name={currentUser.display_name} phone={currentUser.phone || ""} theme={theme} setTheme={setTheme} page={page} setPage={setPage} onToggleRail={() => setRailCollapsed((collapsed) => !collapsed)} onLogout={handleLogout} /></main>;
}
