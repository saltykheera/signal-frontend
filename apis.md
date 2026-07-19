# Backend directory
/Users/vishalkumar/signal-clone

# Signal Clone Backend API Guide

This is the master integration reference for the frontend. It describes the
available HTTP APIs, their request/response contracts, authentication rules,
data relationships, and important current limitations.

## Quick start

From `signal-backend`:

```bash
python -m app.init_db
uvicorn app.main:app --reload
```

The development API is normally available at `http://127.0.0.1:8000`.
Interactive Swagger documentation is at `/docs`; the OpenAPI document is at
`/openapi.json`.

Before starting a separate frontend origin, configure CORS in the backend. No
CORS middleware is currently registered.

## Conventions

- Send JSON requests with `Content-Type: application/json`.
- All timestamps are ISO-8601 strings, for example
  `"2026-07-18T12:00:00"`.
- IDs are integers.
- Most JSON fields use `snake_case`. The one current exception is the contact
  creation request, which uses `contactUserId`.
- `204 No Content` responses have no response body.
- Known domain errors use `{ "detail": "..." }`. Request-validation errors use
  FastAPI's standard `{ "detail": [ ... ] }` format.

## Authentication

Only `/health`, `/auth/register`, and `/auth/verify` are public. Every other
endpoint requires this header:

```http
Authorization: Bearer <access_token>
```

Store the `access_token` returned by verification in the frontend. For this
development project, `localStorage` is the expected simple integration choice.
On a `401`, clear the stored token and return the user to the authentication
flow.

### Phone OTP flow

1. Request the mocked OTP.

   ```http
   POST /auth/register
   Content-Type: application/json

   { "phone": "+15551234567" }
   ```

   ```json
   { "message": "OTP sent successfully.", "otp": "123456" }
   ```

2. Verify it and retain the JWT.

   ```http
   POST /auth/verify
   Content-Type: application/json

   { "phone": "+15551234567", "otp": "123456" }
   ```

   ```json
   {
     "user": {
       "id": 1,
       "username": null,
       "phone": "+15551234567",
       "display_name": "+15551234567",
       "avatar_url": null,
       "is_online": false,
       "last_seen": null,
       "created_at": "2026-07-18T12:00:00",
       "updated_at": "2026-07-18T12:00:00"
     },
     "access_token": "<jwt>",
     "token_type": "bearer"
   }
   ```

The OTP is always `123456`. Verification finds or creates the phone-based
account. JWTs use HS256, expire after seven days by default, and contain the
user ID in `sub`.

### Check the current user

```http
GET /auth/me
Authorization: Bearer <access_token>
```

The response is the same user object shown above.

## Health

```http
GET /health
```

```json
{ "status": "healthy" }
```

## Users and contacts

### Search users

```http
GET /users/search?q=rahul
Authorization: Bearer <access_token>
```

Searches `username`, `phone`, and `display_name`, excludes the current user,
and returns at most 20 users. The response is an array of public user objects.

### List contacts

```http
GET /contacts
Authorization: Bearer <access_token>
```

Returns an array of the same public user objects.

### Add a contact

```http
POST /contacts
Authorization: Bearer <access_token>
Content-Type: application/json

{ "contactUserId": 2 }
```

Returns `201 Created` and the added user's public object. Adding yourself or
adding an existing contact returns `409`; an unknown user returns `404`.

### Remove a contact

```http
DELETE /contacts/2
Authorization: Bearer <access_token>
```

Returns `204 No Content`. Contact relationships are directed: adding a user to
your contacts does not add you to theirs.

## Conversations

### List conversations for the left sidebar

```http
GET /conversations
Authorization: Bearer <access_token>
```

Each summary has this shape:

```json
{
  "id": 15,
  "type": "direct",
  "name": "Rahul",
  "avatar_url": null,
  "last_message": "See you soon",
  "last_message_timestamp": "2026-07-18T12:00:00",
  "unread_count": 0
}
```

For a direct chat, `name` and `avatar_url` come from the other member. For a
group, they come from the conversation record. Conversations with recent
messages appear first. `unread_count` is calculated from unread incoming
message receipts. Summaries also include `peer_user_id`, `is_online`,
`last_seen`, and `member_count`.

### Start or reuse a direct chat

```http
POST /conversations
Authorization: Bearer <access_token>
Content-Type: application/json

{ "type": "direct", "member_ids": [2] }
```

The current user is taken only from the JWT. The member list must contain
exactly one different, existing user. If a two-member direct conversation
already exists, the API returns it with `200 OK`; otherwise it creates one and
returns `201 Created`.

```json
{ "conversation_id": 15 }
```

### Create a group

```http
POST /conversations
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "type": "group",
  "name": "NSUT Friends",
  "member_ids": [2, 3, 4]
}
```

The creator is added as `admin`; listed users are added as `member`. Duplicate
IDs are collapsed. The creator may be present in `member_ids` but is not added
twice. An unknown member returns `404`. A group needs a name and at least one
other member.

## Messages

### List messages

```http
GET /conversations/15/messages
Authorization: Bearer <access_token>
```

Returns messages oldest first. Only conversation members may use this endpoint.

```json
[
  {
    "id": 42,
    "conversation_id": 15,
    "sender_id": 1,
    "content": "Hello Rahul",
    "message_type": "text",
    "reply_to_message_id": null,
    "created_at": "2026-07-18T12:00:00",
    "updated_at": "2026-07-18T12:00:00"
  }
]
```

### Create a text message

```http
POST /conversations/15/messages
Authorization: Bearer <access_token>
Content-Type: application/json

{ "message_type": "text", "content": "Hello Rahul" }
```

The server takes `sender_id` from the JWT. For `text`, trimmed content must be
at least two characters. Maximum content length is 4,000 characters.

### Create an image, file, or video message

```http
POST /conversations/15/messages
Authorization: Bearer <access_token>
Content-Type: application/json

{ "message_type": "image", "content": "Optional caption" }
```

Allowed non-text types are `image`, `file`, and `video`. Their `content` field
is an optional caption and can be `""`. The message-create response uses the
same shape as a listed message.

Then upload the attachment using the returned message ID, as described below.

The backend allows an attachment-type message to be
created before its file is uploaded, and does not currently reject one that
never receives an attachment. The frontend should upload immediately after
creating an `image`, `file`, or `video` message and treat failure as an
incomplete send. Message-list responses include attachments, reactions,
receipts, sender display data, and a canonical delivery status.

### Mark a message read

```http
POST /messages/42/read
Authorization: Bearer <access_token>
```

Returns:

```json
{
  "message_id": 42,
  "user_id": 2,
  "read_at": "2026-07-18T12:00:00"
}
```

This is idempotent: repeated calls preserve the initial read time.

## Reactions

### Add a reaction

```http
POST /messages/42/reactions
Authorization: Bearer <access_token>
Content-Type: application/json

{ "emoji": "👍" }
```

Returns `201 Created` for a new reaction or `200 OK` if that user already has
the same emoji on that message. One user can use multiple different emoji, but
cannot create a duplicate of the same emoji.

```json
{
  "id": 8,
  "message_id": 42,
  "user_id": 2,
  "emoji": "👍",
  "created_at": "2026-07-18T12:00:00"
}
```

### Remove a reaction

```http
DELETE /messages/42/reactions
Authorization: Bearer <access_token>
Content-Type: application/json

{ "emoji": "👍" }
```

Returns `204 No Content`. It removes only the reaction belonging to the
authenticated user. The emoji is sent in the JSON body even though the method
is `DELETE`.

## Attachments

### Upload an attachment

```http
POST /messages/42/attachments
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

file: <binary file>
```

Use `FormData` in a browser; do **not** set the multipart `Content-Type`
manually because the browser supplies its boundary.

```js
const formData = new FormData();
formData.append("file", selectedFile);

await fetch(`${API_BASE}/messages/${messageId}/attachments`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});
```

The endpoint accepts one file up to 10 MB. It stores the original filename,
client-supplied MIME type, and byte size. The response is:

```json
{
  "id": 7,
  "message_id": 42,
  "file_name": "photo.png",
  "file_url": "/uploads/uuid_photo.png",
  "mime_type": "image/png",
  "file_size": 18420,
  "width": null,
  "height": null,
  "created_at": "2026-07-18T12:00:00"
}
```

To display or download the file, prefix `file_url` with the API base URL, for
example `http://127.0.0.1:8000/uploads/uuid_photo.png`. The server does not
verify that the uploaded MIME type matches the message type.

## Error handling and access rules

| Status | Meaning for the frontend |
| --- | --- |
| `200` | Successful fetch or idempotent reuse (direct conversation/reaction). |
| `201` | A contact, conversation, message, reaction, or attachment was created. |
| `204` | Delete completed; do not parse a response body. |
| `401` | Missing, invalid, or expired JWT. Clear local authentication state. |
| `404` | Resource does not exist or the user is not authorized to access it. Conversation/message access intentionally uses `404` to avoid leaking private resources. |
| `409` | Duplicate contact, or an attempt to add yourself as a contact. |
| `413` | Attachment exceeds 10 MB. |
| `422` | Invalid endpoint payload or parameter; inspect `detail` for field errors. |

Contacts, conversations, messages, reads, reactions, and attachments all
enforce JWT authentication. Conversation-related endpoints additionally enforce
membership.

## Data model reference

The backend uses SQLite with raw SQL. These are the primary tables and links:

```text
users
  ├─ contacts (user_id -> contact_user_id)
  ├─ conversation_members (user_id -> conversation_id)
  ├─ messages (sender_id -> conversation_id)
  ├─ message_receipts (user_id -> message_id)
  └─ message_reactions (user_id -> message_id)

conversations
  ├─ conversation_members
  └─ messages
       └─ attachments
```

Important database facts:

- `contacts(user_id, contact_user_id)` is unique and directed.
- `conversation_members(conversation_id, user_id)` is unique; roles are
  `member` or `admin`.
- `message_reactions(message_id, user_id, emoji)` is unique.
- `message_receipts(message_id, user_id)` is unique.
- `attachments` can have multiple rows for one message.
- The canonical schema is `signal-backend/sql/schema.sql`; the default SQLite
  file is `signal-backend/signal.db`.

## Frontend implementation checklist

1. Complete the OTP flow and persist the JWT.
2. Add the Bearer header to every authenticated request.
3. Load `/conversations` to populate the left sidebar.
4. Use `/users/search` and `/contacts` to find people, then create or reuse a
   direct conversation with `POST /conversations`.
5. Load `/conversations/{id}/messages` when opening a chat.
6. Send a message, optimistically if desired; use the server response as the
   canonical message record.
7. For image/file/video messages, create the message then immediately upload
   its file with `FormData`.
8. Mark viewed incoming messages with `/messages/{messageId}/read`.
9. Handle `401` globally, and handle `404` as either an unavailable resource or
   revoked access.

## Implemented extensions

- `PATCH /users/me` updates a display name or username.
- `POST /users/me/avatar` uploads the current user's profile image.
- `GET /conversations/{id}` returns metadata and members.
- `PATCH /conversations/{id}` renames a group (admin only).
- `POST /conversations/{id}/members` and
  `DELETE /conversations/{id}/members/{userId}` provide group admin controls.
- `DELETE /messages/{id}` deletes a caller-owned message.
- `WS /ws?token=<jwt>` publishes message, reaction, receipt, typing, and
  presence events. Clients send `typing` and `ping` events.

## Current scope limits

- OTP delivery is mocked; the only OTP is `123456`.
- No refresh-token or logout endpoint exists; JWTs expire after their configured
  lifetime.
- No pagination exists for conversations, searches, or messages.
- Attachment MIME type is supplied by the client and is not verified server-side.
- Attachment-type messages are not yet atomically coupled to their uploads.
