# STC Logistics — Warehouse Management System (WMS V2)

A production-quality Warehouse Management System built for STC Logistics, a third-party logistics (3PL) provider. The system manages the full warehouse lifecycle: inbound ASN processing, inventory tracking by SKU/lot/location, order pick/pack fulfillment, BOL and packing slip generation, and real-time carrier tracking.

---

## Prerequisites

Before getting started, make sure you have the following:

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **npm 9+** (bundled with Node)
- **A Supabase project** — Free tier at [supabase.com](https://supabase.com). You will need your project's Transaction Pooler connection string (port 6543) and Direct connection string (port 5432).
- **A Vercel account** — [vercel.com](https://vercel.com) for deployment
- **A GitHub repository** — For Vercel's Git integration and CI/CD

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-org/stc-wms.git
cd stc-wms
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in the following required values:

| Variable | Where to find it |
|---|---|
| `DATABASE_URL` | Supabase Dashboard → Project Settings → Database → Transaction pooler (port **6543**). Append `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Supabase Dashboard → Project Settings → Database → Session pooler or Direct connection (port **5432**) |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` in your terminal |
| `NEXTAUTH_URL` | `http://localhost:3000` for local development |

SMTP and carrier API keys are optional for local development — email and tracking features will be disabled if left blank.

### 4. Run database migrations

```bash
npx prisma migrate dev
```

This creates all tables in your Supabase database based on the Prisma schema. On first run it will ask you to name the migration (e.g., `init`).

### 5. Seed initial data

```bash
npx prisma db seed
```

This creates a default Admin user, one Warehouse record, and sample Client/SKU data so you can log in immediately.

Default admin credentials (change these after first login):
- **Email:** `admin@shipstc.com`
- **Password:** `changeme123`

### 6. Start the development server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Deployment (Vercel)

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Import the repository to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository** and select your GitHub repo
3. Vercel will auto-detect the Next.js framework

### 3. Add environment variables in Vercel

In the Vercel project dashboard, go to **Settings → Environment Variables** and add all variables from your `.env.local`:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Use the **Transaction Pooler** URL (port 6543) with `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Use the **Direct connection** URL (port 5432) — for Prisma migrations only |
| `NEXTAUTH_SECRET` | Use the same secret as local, or generate a new one |
| `NEXTAUTH_URL` | Set to your Vercel deployment URL (e.g., `https://stc-wms.vercel.app`) |
| `SMTP_*` | Your SMTP credentials for outbound email |
| `FEDEX_*` / `UPS_*` | Carrier API keys for parcel tracking |

### 4. Deploy

Vercel automatically deploys on every push to the `main` branch. Your first deployment will trigger automatically after importing the repo.

To run migrations in production before the first deploy:

```bash
DATABASE_URL="<your-direct-url>" npx prisma migrate deploy
```

Or add a build command in Vercel: `prisma migrate deploy && next build`

---

## Migration Workflow

| Command | When to use |
|---|---|
| `npx prisma migrate dev` | Local development — creates a new migration file and applies it |
| `npx prisma migrate deploy` | Production / CI — applies pending migration files without generating new ones |
| `npx prisma db push` | Rapid prototyping only — syncs schema without creating migration files (do not use in production) |
| `npx prisma studio` | Opens a visual browser for your database at `http://localhost:5555` |

**npm script aliases:**

```bash
npm run db:migrate   # prisma migrate dev
npm run db:seed      # ts-node prisma/seed.ts
npm run db:push      # prisma db push
npm run db:studio    # prisma studio
```

---

## Supabase Connection Note

Vercel deploys Next.js as serverless functions. Each function invocation may open a new database connection, which can exhaust PostgreSQL's connection limit rapidly.

**Solution: Use PgBouncer (Transaction Pooler)**

- `DATABASE_URL` → Supabase **Transaction Pooler**, port **6543**, with `?pgbouncer=true&connection_limit=1`
  - Used by the application at runtime for all queries
  - PgBouncer multiplexes connections so serverless functions share a pool
- `DIRECT_URL` → Supabase **Direct connection**, port **5432**
  - Used by the Prisma CLI (`migrate dev`, `migrate deploy`) only
  - Required because PgBouncer does not support the advisory locks that Prisma uses during migrations

Both URLs must be present in your environment. Prisma reads `DIRECT_URL` automatically when it is set alongside `DATABASE_URL`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| UI Components | shadcn/ui (Radix UI primitives) |
| ORM | Prisma 5 |
| Database | PostgreSQL via Supabase |
| Authentication | NextAuth v4 with Prisma adapter |
| Forms | React Hook Form + Zod |
| PDF Generation | @react-pdf/renderer |
| Email | Nodemailer (SMTP) |
| CSV Processing | PapaParse |
| Icons | Lucide React |
| Deployment | Vercel |

---

## Project Structure

```
stc-wms/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth pages (login, register)
│   ├── (dashboard)/        # Protected dashboard pages
│   │   ├── inventory/
│   │   ├── inbound/
│   │   ├── orders/
│   │   ├── shipments/
│   │   └── settings/
│   ├── api/                # Route Handlers
│   │   ├── auth/
│   │   ├── asn/
│   │   ├── inventory/
│   │   ├── orders/
│   │   └── shipments/
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── ...                 # App-specific components
├── lib/
│   ├── prisma.ts           # Prisma client singleton
│   ├── auth.ts             # NextAuth config
│   └── utils.ts            # Shared utilities (cn, formatters)
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Migration history
│   └── seed.ts             # Seed data
├── hooks/                  # Custom React hooks
├── types/                  # Shared TypeScript types
├── public/                 # Static assets
├── CLAUDE.md               # AI build context and architecture notes
├── .env.local.example      # Environment variable template
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## License

Proprietary — STC Logistics. All rights reserved.
