"use client";

import { useState } from "react";
import type { SettingsPage, Theme } from "@/types/messenger";
import { Icon } from "@/components/ui/Icon";

type SettingsProps = {
  name: string;
  phone: string;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  page: SettingsPage;
  setPage: (page: SettingsPage) => void;
  onToggleRail: () => void;
  onLogout: () => void;
};

export function Settings({ name, phone, theme, setTheme, page, setPage, onToggleRail, onLogout }: SettingsProps) {
  const initials = name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "S";
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <>
      <aside className="settings-sidebar">
        <header><button className="icon-button sidebar-rail-toggle" onClick={onToggleRail} aria-label="Show navigation"><Icon name="menu" /></button><h1>Settings</h1></header>
        <button className={`profile-summary ${page === "profile" ? "selected" : ""}`} onClick={() => { setPage("profile"); setDetailOpen(true); }}><span className="settings-avatar">{initials}</span><span><strong>{name}</strong><small>{phone}</small></span><Icon name="chevron" /></button>
        <div className="settings-nav" aria-label="Settings sections"><button className={page === "general" ? "selected" : ""} onClick={() => { setPage("general"); setDetailOpen(true); }}><Icon name="settings" /><span>General</span><Icon name="chevron" className="row-chevron" /></button><button className={page === "appearance" ? "selected" : ""} onClick={() => { setPage("appearance"); setDetailOpen(true); }}><Icon name="appearance" /><span>Appearance</span><Icon name="chevron" className="row-chevron" /></button></div>
      </aside>
      <section className={`settings-content ${detailOpen ? "detail-open" : ""}`}>
        <header className="settings-content-header"><button className="icon-button settings-content-back" onClick={() => setDetailOpen(false)} aria-label="Back to settings"><Icon name="back" /></button><h2>{page === "profile" ? "Profile" : page === "general" ? "General" : "Appearance"}</h2></header>
        {page === "profile" ? <ProfilePane initials={initials} name={name} /> : page === "general" ? <GeneralPane phone={phone} onLogout={onLogout} /> : <AppearancePane theme={theme} setTheme={setTheme} />}
      </section>
    </>
  );
}

function ProfilePane({ initials, name }: { initials: string; name: string }) {
  return <div className="profile-pane"><div className="profile-pane-avatar">{initials}</div><button className="mini-pill">Edit photo</button><div className="profile-details"><button className="profile-detail-row"><Icon name="person" /><span>{name}</span></button><button className="profile-detail-row"><Icon name="edit" /><span>About</span></button><p>Your profile and changes to it will be visible to people you message, contacts and groups.</p><div className="settings-divider" /><button className="profile-detail-row"><Icon name="at" /><span>Username</span></button><p>People can now message you using your optional username so you don’t have to give out your phone number.</p></div></div>;
}

function GeneralPane({ phone, onLogout }: { phone: string; onLogout: () => void }) {
  return <div className="settings-simple-pane general-pane"><div className="setting-key-value"><span>Phone Number</span><strong>{phone}</strong></div><div className="setting-key-value"><span>Device Name</span><strong>Web browser</strong></div><p className="setting-help">Your session is stored securely in this browser until you log out or the development token expires.</p><div className="settings-divider" /><section><h3>System</h3><label className="checkbox-row"><input type="checkbox" /><span>Open at computer login</span></label></section><div className="settings-divider" /><section><h3>Permissions</h3><label className="checkbox-row"><input type="checkbox" /><span>Allow access to the microphone</span></label><label className="checkbox-row"><input type="checkbox" /><span>Allow access to the camera</span></label></section><div className="settings-divider" /><section><h3>Session</h3><button type="button" className="danger-settings-button" onClick={onLogout}>Log out of Signal</button></section></div>;
}

function AppearancePane({ theme, setTheme }: { theme: Theme; setTheme: (theme: Theme) => void }) {
  return <div className="settings-simple-pane appearance-pane"><div className="setting-key-value appearance-language"><span><Icon name="globe" />Language</span><strong>System Language</strong></div><div className="setting-key-value"><span>Theme</span><label className="select-control"><select value={theme} onChange={(event) => setTheme(event.target.value as Theme)} aria-label="Theme"><option value="light">Light</option><option value="dark">Dark</option></select></label></div><div className="setting-key-value"><span>Chat color</span><span className="color-swatch" aria-label="Signal blue" /></div><div className="setting-key-value"><span>Zoom level</span><label className="select-control"><select defaultValue="100%" aria-label="Zoom level"><option>100%</option></select></label></div></div>;
}
