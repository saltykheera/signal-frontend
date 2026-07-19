"use client";

import Image from "next/image";

const iconPaths = {
  menu: "/icons/menu/menu.svg",
  chat: "/icons/chat/chat.svg",
  chatFill: "/icons/chat/chat-fill.svg",
  phone: "/icons/phone/phone.svg",
  stories: "/icons/stories/stories.svg",
  storiesFill: "/icons/stories/stories-fill.svg",
  settings: "/icons/settings/settings.svg",
  settingsFill: "/icons/settings/settings-fill.svg",
  compose: "/icons/compose/compose.svg",
  search: "/icons/search/search.svg",
  more: "/icons/more/more.svg",
  filter: "/icons/filter/filter.svg",
  note: "/icons/note/note.svg",
  back: "/icons/arrow/arrow-left.svg",
  plus: "/icons/plus/plus.svg",
  mic: "/icons/mic/mic.svg",
  emoji: "/icons/emoji/emoji.svg",
  check: "/icons/message_status/messagestatus-read.svg",
  person: "/icons/person/person.svg",
  edit: "/icons/edit/edit.svg",
  at: "/icons/at/at.svg",
  globe: "/icons/globe/globe.svg",
  appearance: "/icons/appearance/appearance.svg",
  chevronDown: "/icons/chevron/chevron-down-compact.svg",
  group: "/icons/group/group.svg",
  number: "/icons/number/number-light.svg",
  photo: "/icons/photo/photo-square.svg",
  file: "/icons/file/file.svg",
  info: "/icons/info/info.svg",
  trash: "/icons/trash/trash.svg",
  chevron: "/icons/chevron/chevron-right.svg",
  x: "/icons/x/x.svg",
} as const;

export type IconName = keyof typeof iconPaths;

type IconProps = {
  name: IconName;
  size?: number;
  className?: string;
};

export function Icon({ name, size = 20, className = "" }: IconProps) {
  const height = name === "check" ? Math.round(size * (2 / 3)) : size;

  return <Image className={`icon ${name === "check" ? "status-icon" : ""} ${className}`} src={iconPaths[name]} width={size} height={height} alt="" aria-hidden="true" unoptimized />;
}
