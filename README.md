# CaptureAfrica

Africa's premier AI-powered photography marketplace where clients discover, chat with, and book professional photographers — and photographers manage their entire business.

## What It Does

**For Clients:**
- Browse verified photographers filtered by location, price, rating, and specialty
- View rich portfolios (photos + videos)
- Favorite/shortlist photographers
- Chat with a global AI assistant or each photographer's personal AI assistant
- Book photographers (per photo or packages)
- Pay photographers directly and upload payment proof
- Track booking status and download receipts

**For Photographers:**
- Register and get a personal AI assistant instantly
- Manage portfolio (images and videos)
- Set pricing (per photo and custom packages)
- Manage availability calendar
- Accept/decline bookings with notes
- Configure bank details for direct payments

**For Admins:**
- Approve or reject photographer registrations
- Monitor all bookings and payments
- Suspend accounts if needed

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start |
| Frontend | React 19, TanStack Router v1 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| Authentication | Netlify Identity (`@netlify/identity`) |
| Data Storage | Netlify Blobs |
| AI | Anthropic Claude (`claude-haiku-4-5`) via Netlify AI Gateway |
| Functions | Netlify Functions |
| Deployment | Netlify |

## Local Development

```bash
npm install

# Start local development server (uses Netlify CLI for Identity + Functions)
netlify dev
```

> **Note:** Netlify Identity requires a deployed Netlify site or `netlify dev` to function. Plain `npm run dev` will not enable authentication.

## Environment Variables

No manual configuration required — Netlify injects all environment variables automatically:
- **Identity**: Handled by Netlify Identity service
- **AI**: `ANTHROPIC_API_KEY` and `ANTHROPIC_BASE_URL` injected by Netlify AI Gateway

Optional:
- `ADMIN_EMAILS` — comma-separated list of emails that auto-receive the `admin` role on signup

## Setting Up the First Admin

1. Deploy to Netlify
2. Go to **Identity** in the Netlify dashboard
3. Click **Invite users** and enter an admin email
4. After accepting the invite, open the user in the Identity list
5. Add the `admin` role in the Roles field

Or set `ADMIN_EMAILS=your@email.com` in Netlify environment variables — any user signing up with that email gets the admin role automatically.

## Project Structure

```
src/
├── routes/
│   ├── __root.tsx          # Root layout with Header + AI Chat
│   ├── index.tsx           # Landing page
│   ├── faq.tsx             # FAQ page
│   ├── auth/               # Login, Register, Callback
│   ├── photographers/      # Browse + Profile pages
│   ├── dashboard/          # Client, Photographer, Admin dashboards
│   ├── book/               # Booking flow
│   └── bookings/           # Booking detail + receipt
├── components/
│   ├── Header.tsx          # Navigation with auth state
│   ├── AIChat.tsx          # Floating AI chat widget
│   └── PhotographerCard.tsx # Card component for listings
└── lib/
    └── types.ts            # Shared TypeScript types

netlify/
└── functions/
    ├── identity-signup.mts # Assigns roles on signup
    ├── chat.mts            # AI chat streaming endpoint
    ├── photographers.mts   # Photographer CRUD API
    ├── bookings.mts        # Booking management API
    ├── upload.mts          # File upload handler
    └── uploads.mts         # File serving endpoint
```
