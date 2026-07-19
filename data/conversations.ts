import type { Conversation, ConversationId, Message } from "@/types/messenger";

export const conversations: Conversation[] = [
  { id: "self", name: "Note to Self", initials: "✎", preview: "Remember to book the tickets", time: "2m", color: "#d5f1d9", subtitle: "Private notes" },
  { id: "maya", name: "Maya Chen", initials: "MC", preview: "That sounds perfect — see you then!", time: "10:42", color: "#f8c9e7", unread: 2, online: true, subtitle: "Online" },
  { id: "weekend", name: "Weekend Plans", initials: "WP", preview: "Alex: I’ll bring the snacks", time: "9:18", color: "#c9d9ff", group: true, muted: true, subtitle: "5 members" },
  { id: "sam", name: "Sam Rivera", initials: "SR", preview: "Photo", time: "Yesterday", color: "#f7d59c", subtitle: "Last seen recently" },
  { id: "aisha", name: "Aisha Khan", initials: "AK", preview: "Thanks! 🙌", time: "Friday", color: "#cef0e9", subtitle: "Last seen Friday" },
];

export const initialMessages: Record<ConversationId, Message[]> = {
  self: [
    { id: 1, body: "Pick up the parcel after work", outgoing: true, time: "10:18", status: "read" },
    { id: 2, body: "Remember to book the tickets", outgoing: true, time: "10:31", status: "read" },
  ],
  maya: [
    { id: 1, body: "Hey! Are we still on for coffee today?", outgoing: false, time: "10:36" },
    { id: 2, body: "Absolutely. How does 4:30 sound?", outgoing: true, time: "10:38", status: "read" },
    { id: 3, body: "That sounds perfect — see you then!", outgoing: false, time: "10:42" },
  ],
  weekend: [
    { id: 1, body: "Should we meet at the station around nine?", outgoing: false, time: "9:02" },
    { id: 2, body: "Works for me. I’ll bring the coffee.", outgoing: true, time: "9:07", status: "read" },
    { id: 3, body: "I’ll bring the snacks 🍿", outgoing: false, time: "9:18" },
  ],
  sam: [
    { id: 1, body: "Here’s the photo from yesterday.", outgoing: false, time: "18:22" },
    { id: 2, body: "Love it — thanks for sending!", outgoing: true, time: "18:24", status: "read" },
  ],
  aisha: [
    { id: 1, body: "I’ve shared the notes with you.", outgoing: true, time: "16:08", status: "read" },
    { id: 2, body: "Thanks! 🙌", outgoing: false, time: "16:10" },
  ],
};
