import type { ConversationId } from "@/types/messenger";

export type NewChatContact = {
  name: string;
  initials?: string;
  color: string;
  conversationId?: ConversationId;
  isNoteToSelf?: boolean;
};

export const newChatContacts: NewChatContact[] = [
  { name: "Note to Self", color: "#d5f1d9", conversationId: "self", isNoteToSelf: true },
  { name: "rounk nsit", initials: "rn", color: "#dedee0" },
  { name: "Srishti Ahuja tnp coordinator", initials: "Sc", color: "#f9d8f1" },
  { name: "adarsh golu friend", initials: "af", color: "#e2e3ff" },
  { name: "Chandan Bhai", initials: "CB", color: "#c8edf2" },
  { name: "Sherlock Gomez", initials: "SG", color: "#d3ebd5" },
];
