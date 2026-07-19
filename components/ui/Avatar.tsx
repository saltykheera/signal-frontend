"use client";
/* eslint-disable @next/next/no-img-element -- backend avatar URLs are dynamic */

import type { Conversation } from "@/types/messenger";
import { Icon } from "./Icon";
import { API_BASE } from "@/lib/api";

type AvatarProps = {
  conversation: Conversation;
  size?: number;
  showOnline?: boolean;
};

export function Avatar({ conversation, size = 48, showOnline = true }: AvatarProps) {
  return (
    <span className="avatar-wrap" style={{ width: size, height: size }}>
      <span className={`avatar ${conversation.id === "self" ? "self-avatar" : ""}`} style={{ background: conversation.color, width: size, height: size, fontSize: size * 0.32 }}>
        {conversation.avatarUrl ? <img src={`${API_BASE}${conversation.avatarUrl}`} alt="" /> : conversation.id === "self" ? <Icon name="note" size={Math.round(size * 0.45)} /> : conversation.initials}
      </span>
      {showOnline && conversation.online && <span className="online-dot" />}
    </span>
  );
}
