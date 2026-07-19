# Signal Messenger Replica

A full-stack Signal-style messaging application built for the SDE Fullstack
assignment. The Signal-inspired responsive UI is connected to the FastAPI/SQLite
backend in the sibling `signal-clone/signal-backend` directory.

## Features

- Mock phone authentication using OTP `123456`, JWT session persistence, profile
  name/avatar setup, and logout
- Persistent contacts, user search, direct conversations, groups, and messages
- Real-time message delivery, typing, presence, and read-receipt updates over an
  authenticated WebSocket
- Sending/delivered/read states, unread counts, timestamps, reactions, images,
  videos, and file attachments (10 MB maximum)
- Group member view with administrator add/remove controls
- Seeded users/history, light and dark appearance, responsive layouts, and Calls
  and Stories placeholders

End-to-end cryptography is simulated, as permitted by the assignment.

## Tech stack

- Frontend: Next.js 16, React, TypeScript, Zustand, CSS
- Backend: FastAPI, Python, raw SQLite SQL, PyJWT
- Real-time: FastAPI WebSockets with in-process per-user fan-out
- Storage: SQLite and local files under `signal-backend/uploads/`

## Run locally

Backend:

```bash
cd /Users/vishalkumar/signal-clone/signal-backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m app.init_db
.venv/bin/python -m uvicorn app.main:app --reload --port 8000
```

Frontend, in a second terminal:

```bash
cd /Users/vishalkumar/signal-frontend-replica
cp .env.example .env.local
npm install
npm run dev
```

Open `http://127.0.0.1:3000`. Swagger is at `http://127.0.0.1:8000/docs`.

### Demo users

All accounts use OTP `123456`.

| Name | Phone | Username |
| --- | --- | --- |
| Vishal Kumar | `+91 96671 67008` | `vishal.01` |
| Maya Chen | `+91 90000 00001` | `maya.chen` |
| Sam Rivera | `+91 90000 00002` | `sam.rivera` |
| Aisha Khan | `+91 90000 00003` | `aisha.khan` |
| Alex Morgan | `+91 90000 00004` | `alex.morgan` |

Vishal's account has a pre-populated direct chat, group, contacts, and history.
Open a second browser profile as Maya to verify live messaging, presence, typing,
reactions, and read receipts.

## Architecture

The frontend keeps server records canonical. `lib/api.ts` owns the HTTP contract.
`stores/messenger-store.ts` is a typed Zustand vanilla store containing auth,
conversation/contact/message caches, loading and error state, optimistic mutations,
and WebSocket reconciliation. A per-app context provider keeps it safe for Next.js
App Router rendering and preserves it across navigation. `pages/SignalReplicaApp.tsx`
is now a thin layout coordinator. UI stays grouped by product domain.

The backend follows route → service → repository layering. Routes handle
transport and event fan-out, services enforce business rules/authorization, and
repositories contain raw SQL. `sql/schema.sql` is canonical and `sql/seed.sql`
contains idempotent sample data.

WebSocket clients connect to `/ws?token=<jwt>`. Events include
`message.created`, `message.deleted`, `reaction.added`, `reaction.removed`,
`receipt.read`, `typing`, and `presence`.

## Database schema

```text
users
  ├── contacts (user_id, contact_user_id)
  ├── conversation_members (conversation_id, user_id, role)
  ├── messages (conversation_id, sender_id, reply_to_message_id)
  │     ├── attachments
  │     ├── message_reactions
  │     └── message_receipts (delivered_at, read_at)
  └── conversations (direct or group, created_by)
```

Foreign keys, uniqueness constraints, and indexes are declared in the schema.

## API overview

The base contract is in [apis.md](./apis.md). Implemented extensions include:

- `PATCH /users/me` and `POST /users/me/avatar`
- `GET/PATCH /conversations/{id}`
- `POST /conversations/{id}/members`
- `DELETE /conversations/{id}/members/{userId}`
- `DELETE /messages/{id}`
- `WS /ws?token=<jwt>`

Messages also include sender details, attachments, reactions, receipts, and
delivery status. Conversation summaries include real unread counts, presence,
peer ID, and member count.

## Verification

```bash
cd /Users/vishalkumar/signal-frontend-replica
npm run lint
npm run build

cd /Users/vishalkumar/signal-clone/signal-backend
.venv/bin/python -m compileall -q app
```

Assumptions: OTP and encryption are mocked; attachment storage and the WebSocket
registry are local development implementations. Production should use object
storage, shared pub/sub, restricted CORS, HTTPS/WSS, secret rotation, refresh
tokens, rate limiting, and file validation.
