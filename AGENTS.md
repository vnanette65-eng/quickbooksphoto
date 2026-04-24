# AGENTS.md — CaptureAfrica Project Architecture

This document is for AI agents and developers working on the CaptureAfrica codebase.

## Project Overview

CaptureAfrica is an AI-powered photography marketplace built on TanStack Start, deployed on Netlify. It has three user roles (client, photographer, admin) and integrates Netlify Identity for auth, Netlify Blobs for data persistence, and Anthropic Claude for AI assistants.

## Architecture

### Authentication
- Uses `@netlify/identity` (not deprecated `netlify-identity-widget`)
- Roles stored in `app_metadata.roles[0]`: `'client'`, `'photographer'`, or `'admin'`
- `identity-signup.mts` assigns roles based on `user_metadata.role` set during registration
- Admin role can be auto-assigned via `ADMIN_EMAILS` env var
- Auth state accessed client-side via `getUser()`, never SSR

### Data Storage (Netlify Blobs)
All data persists in Netlify Blobs. Stores:
- `photographers` — key = `{userId}`, value = Photographer JSON
- `bookings` — key = `{bookingId}` (timestamp-random), value = Booking JSON
- `uploads` — key = `{category}/{id}.{ext}`, value = binary file data

### API Layer (Netlify Functions)
Located in `netlify/functions/`. Each uses `export const config = { path: '/api/{endpoint}' }`.

| Function | Path | Purpose |
|----------|------|---------|
| `photographers.mts` | `/api/photographers` | GET list/single, POST create/update/status |
| `bookings.mts` | `/api/bookings` | GET by client/photographer/id, POST create/update |
| `chat.mts` | `/api/chat` | Streaming AI chat (Anthropic claude-haiku-4-5) |
| `upload.mts` | `/api/upload` | Accept base64 file, store in Blobs |
| `uploads.mts` | `/api/uploads?key=...` | Serve stored files |
| `identity-signup.mts` | (Identity webhook) | Assign role on signup |

### AI Chat
- Uses `claude-haiku-4-5` (cost-efficient, fast)
- Streaming response via `ReadableStream`
- Global mode (no context) and photographer-specific mode (system prompt with real profile data)
- Frontend: `src/components/AIChat.tsx`

## Directory Structure

```
src/
├── lib/types.ts            # All shared TypeScript types
├── components/
│   ├── Header.tsx          # Fixed top nav, auth-aware
│   ├── AIChat.tsx          # Floating chat widget
│   └── PhotographerCard.tsx
├── routes/
│   ├── __root.tsx          # Root layout (Header + AIChat + Outlet)
│   ├── index.tsx           # Landing page
│   ├── faq.tsx
│   ├── auth/login.tsx
│   ├── auth/register.tsx   # Role selector on signup
│   ├── auth/callback.tsx
│   ├── photographers/index.tsx    # Browse with filters
│   ├── photographers/$id.tsx      # Profile + portfolio tabs
│   ├── dashboard/index.tsx        # Role-based redirect
│   ├── dashboard/client.tsx
│   ├── dashboard/photographer.tsx # Full studio management
│   ├── dashboard/admin.tsx
│   ├── book/$photographerId.tsx   # 5-step booking flow
│   └── bookings/$id.tsx           # Booking detail + receipt

netlify/functions/
├── identity-signup.mts
├── chat.mts
├── photographers.mts
├── bookings.mts
├── upload.mts
└── uploads.mts
```

## Key Conventions

### Styling
- Tailwind CSS 4, dark theme on `#0c0a08` background
- Amber accent (`amber-500`) for primary CTAs
- Status badge CSS classes in `styles.css`: `.status-pending`, `.status-confirmed`, `.status-rejected`, `.status-completed`, `.status-payment-submitted`, `.status-cancelled`
- Card hover: `.card-hover` class adds lift effect

### Auth Pattern
```typescript
const user = await getUser()
const role = (user?.app_metadata as any)?.roles?.[0] || 'client'
```

### API Call Pattern
```typescript
// Client-side fetch to Netlify Functions
fetch('/api/photographers?id=xxx').then(r => r.json())

// Action-based mutations
fetch('/api/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'update-status', id, status }),
})
```

## Non-Obvious Decisions

1. **Favorites in localStorage** — avoids requiring auth to favorite; loaded in dashboard by cross-referencing with API
2. **Per-photographer AI = context injection** — system prompt includes real profile data, not fine-tuning
3. **File uploads via base64** — avoids multipart complexity; capped at 10MB
4. **Booking IDs are timestamp-based** — chronologically sortable, no UUID dep
5. **Admin via env var** — `ADMIN_EMAILS` comma-separated; manual Netlify UI setup also works
6. **`consistency: 'strong'`** on all Blobs reads — required after writes in approval flows
7. **Receipt ID** — `RCP-{timestamp}`, generated server-side on booking confirmation
