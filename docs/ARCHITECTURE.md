# Signal Replica Frontend Architecture

This project uses the Next.js App Router for its entry point and keeps the finished Signal-style UI as the product source of truth.

## Quick map

| Location | Responsibility |
| --- | --- |
| `app/` | Next.js routes, including the standalone `/settings` page, global layout, metadata, and styles. |
| `pages/SignalReplicaApp.tsx` | Page-level application coordinator: owns local UI state and selects the current screen. |
| `components/auth/` | Phone number, OTP, and profile-setup flow. |
| `components/chat/` | Chat header, timeline, sent messages, and composer. |
| `components/conversations/` | Searchable conversation list, New Chat picker, group creation, username lookup, phone-number chat flows, and selected-row rendering. |
| `components/navigation/` | Desktop/mobile navigation rail and rail-collapse behavior. |
| `components/settings/` | Standalone Settings route, plus Profile, General, and Appearance screens. |
| `components/ui/` | Reusable primitives: icon rendering, avatars, and Signal mark. |
| `components/feedback/` | Focused placeholder states such as Calls and Stories. |
| `data/` | Local mock conversations, New Chat contacts, and initial message history. |
| `types/` | Shared domain and UI-state TypeScript types. |
| `public/icons/`, `public/fonts/` | Signal-sourced visual assets served to the app. |

## Where to change common product areas

- Auth copy or behavior: `components/auth/AuthFlow.tsx`
- Navigation tabs and collapsing rail: `components/navigation/NavigationRail.tsx`
- Conversation rows or mock contacts: `components/conversations/ConversationList.tsx`, `components/conversations/NewChatScreen.tsx`, and `data/`
- Chat bubbles/composer behavior: `components/chat/ChatPanel.tsx`
- Profile, General, or Appearance screens: `components/settings/Settings.tsx`
- Cross-screen state and local persistence: `pages/SignalReplicaApp.tsx`
- Visual tokens, responsive behavior, and layout: `app/globals.css`

## UI safety rules

1. Preserve the existing CSS class names when changing visual components. The stylesheet intentionally centralizes Signal-like spacing, surfaces, and responsive behavior.
2. Add shared display primitives to `components/ui/`; keep screen-level state in `pages/SignalReplicaApp.tsx` until a domain-specific hook is justified.
3. Keep mock product data in `data/` and shared types in `types/` instead of embedding new data into UI components.
4. Build after structural edits with `npm run build` to catch client/server boundary or import issues.
