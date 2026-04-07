# CLAUDE.md — STC Logistics WMS V2

## Product Objective

Build a **production-quality Warehouse Management System (WMS)** for **STC Logistics**, a third-party logistics (3PL) provider. The system manages the full warehouse lifecycle: receiving inbound freight, tracking inventory by lot/SKU/location, processing customer orders through pick/pack workflows, generating BOLs and shipment documents, and providing real-time visibility to both internal staff and client-facing dashboards.

---

## Assumptions Made During Build

1. **Multi-tenant by Client** — A single warehouse installation serves multiple clients (brands/companies). Data is scoped by `clientId` on nearly every entity.
2. **Single Warehouse** — The initial build targets one physical warehouse location. The schema is warehouse-aware so multi-warehouse expansion is non-breaking.
3. **Supabase as the database** — PostgreSQL hosted on Supabase. Prisma ORM handles schema, migrations, and typed queries. Two connection strings are required: a Transaction Pooler URL for runtime (Vercel serverless) and a Direct URL for migrations.
4. **NextAuth v4 with Credentials provider** — Email/password auth backed by bcrypt. OAuth providers can be added later without schema changes.
5. **Role-based access** — Roles: `ADMIN`, `MANAGER`, `ASSOCIATE`, `CLIENT`. UI and API routes enforce role guards.
6. **Airport code routing** — Destination zip codes are mapped to the nearest major airport hub code (e.g., LAX, ORD) for carrier routing logic.
7. **Dimensional weight** — Carrier billing weight is computed as `max(actualWeight, (L × W × H) / dimFactor)`. DIM factors are configurable per carrier in `SystemSetting`.
8. **Parcel tracking** — FedEx and UPS tracking is polled via their REST APIs and stored in `Package`. Tracking webhooks are not assumed; polling is initiated on shipment creation.
9. **PDF generation** — BOL and packing slip PDFs are rendered server-side using `@react-pdf/renderer` and streamed as a download or email attachment.
10. **CSV import** — SKU catalog and ASN lines can be bulk-imported via CSV upload using PapaParse.
11. **No real-time WebSocket layer** — The MVP uses polling / server actions / page refreshes. A WebSocket layer (e.g., Supabase Realtime) can be layered in later.
12. **Seed data** — `prisma/seed.ts` creates a default Admin user, one Warehouse record, and demo Client/SKU data so the app is immediately usable after `prisma migrate dev`.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 14 App Router                │
│  ┌────────────────────┐   ┌────────────────────────┐   │
│  │   Server Components │   │   Client Components     │   │
│  │   (data fetching)  │   │   (forms, modals, UI)  │   │
│  └────────────────────┘   └────────────────────────┘   │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Route Handlers (API)                  │ │
│  │  /api/auth/[...nextauth]  /api/asn  /api/orders   │ │
│  │  /api/inventory  /api/shipments  /api/tracking    │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
           │                         │
    ┌──────▼──────┐          ┌───────▼───────┐
    │  Prisma ORM │          │  NextAuth v4  │
    │  (type-safe │          │  (Sessions,   │
    │   queries)  │          │   JWT, Roles) │
    └──────┬──────┘          └───────────────┘
           │
    ┌──────▼──────┐
    │  Supabase   │
    │  PostgreSQL │
    │  (pooler)   │
    └─────────────┘
```

**Framework:** Next.js 14 with the App Router. All pages and layouts live under `app/`. API logic lives in `app/api/` as Route Handlers. Server Components fetch data directly; Client Components handle interactive UI.

**Styling:** Tailwind CSS + shadcn/ui component library. Brand colors (STC Navy `#1a2744` and STC Orange `#f4811f`) are extended in `tailwind.config.ts` and exposed as CSS custom properties.

**State:** React state + React Hook Form for form management. Server Actions are used for mutations where appropriate. No global state library in the MVP.

**Auth:** NextAuth v4 with the Prisma adapter. Sessions are JWT-based. The `session.user.role` field controls access throughout the app.

**Database:** Prisma 5 + PostgreSQL (Supabase). Migrations managed via `prisma migrate dev` (local) and `prisma migrate deploy` (CI/CD).

**PDF:** `@react-pdf/renderer` renders BOL and packing slip documents server-side in API Route Handlers.

**Email:** Nodemailer with SMTP (configurable). Used for order confirmations, ASN notifications, and alert rules.

**Carrier APIs:** FedEx and UPS REST APIs for parcel tracking. API keys stored in environment variables.

---

## Data Model Overview

All timestamps use `createdAt` / `updatedAt` (Prisma `@updatedAt`). Soft deletes use an `isActive` boolean where applicable.

### Core Entities

| Entity | Description |
|---|---|
| `Warehouse` | Physical warehouse location. All inventory is scoped to a warehouse. |
| `Client` | A brand or company whose inventory is stored at the warehouse (3PL customer). |
| `Project` | A sub-grouping within a Client (e.g., a seasonal campaign or product line). |
| `Store` | A retail store or destination location belonging to a Client. Holds address and airport code routing info. |
| `User` | System users. Roles: ADMIN, MANAGER, ASSOCIATE, CLIENT. Linked to NextAuth sessions via email. |

### Catalog & Inventory

| Entity | Description |
|---|---|
| `SKU` | A product definition: barcode, description, dimensions (L/W/H), weight, pack qty. Belongs to a Client. |
| `Inventory` | Current on-hand quantity for a SKU at a warehouse location (bin/slot). Aggregated view. |
| `InventoryLot` | A specific lot/batch of inventory with a receive date, expiry date, and PO reference. Enables FIFO/FEFO picking. |

### Inbound / ASN

| Entity | Description |
|---|---|
| `ASN` | Advance Ship Notice from a client. Header: expected arrival date, carrier, PRO/BOL number. |
| `ASNLine` | A line on an ASN: expected SKU and quantity. |
| `InboundReceipt` | Created when freight physically arrives. Links back to an ASN (or standalone if no ASN). |
| `ReceiptLine` | Actual received quantity per SKU. Discrepancies are flagged against ASN expected qty. |

### Orders & Fulfillment

| Entity | Description |
|---|---|
| `Order` | A fulfillment order: ship-to address, service level, ship date. Status flows through PENDING → RELEASED → PICKING → PACKING → SHIPPED → CANCELLED. |
| `OrderLine` | A line on an order: SKU, ordered qty, picked qty. |
| `Pallet` | A pallet built during the packing process. Holds dimensions, weight, and pallet label info. |
| `PalletItem` | Links an OrderLine to a Pallet with the quantity packed. |

### Shipping & Documents

| Entity | Description |
|---|---|
| `Shipment` | The outbound shipment event. Carrier, service, PRO number, BOL number. One order can have one shipment. |
| `Package` | Individual parcels within a shipment. Holds tracking number, dimensions, weight, and last tracking status. |
| `BOLTemplate` | Reusable Bill of Lading templates per Client (shipper address, payment terms, commodity defaults). |

### Quality & Alerts

| Entity | Description |
|---|---|
| `Discrepancy` | Records any mismatch found during receiving or picking (short, over, damaged). |
| `AlertRule` | Configurable threshold-based alerts (e.g., inventory below X units → email Y recipients). |
| `SystemSetting` | Key/value store for warehouse-wide configuration (DIM factors, default carrier, etc.). |

---

## Core Workflows

### 1. Inbound / ASN Processing
1. Client or manager creates an **ASN** with expected SKUs and quantities.
2. Warehouse receives the **InboundReceipt** when freight arrives — scans or manually enters actual quantities per SKU.
3. System compares receipt lines to ASN lines and creates **Discrepancy** records for any shorts or overs.
4. Inventory is updated: new **InventoryLot** records are created; **Inventory** quantities are incremented.
5. Notification email is sent to the client with receipt summary.

### 2. Inventory Management
- Inventory is tracked at the SKU + location (bin) level.
- **InventoryLot** enables lot traceability and FIFO/FEFO picking strategies.
- CSV import allows bulk SKU catalog updates.
- Inventory adjustments (cycle counts, damage write-offs) are recorded with reason codes.

### 3. Order Creation
- Orders can be created manually via the UI or imported via CSV.
- Each order references a **Client**, **Store** (ship-to), and one or more **OrderLine** items.
- Orders validate that sufficient inventory exists at order creation time (soft reservation).

### 4. Pick / Pack
- Manager releases orders to a PICKING status, generating a pick list.
- Associates scan or confirm each pick; picked quantities are recorded on `OrderLine.pickedQty`.
- Associates build **Pallets** and assign **PalletItems** linking picked lines to pallets.
- Packing slip PDF is generated per pallet.

### 5. Order Completion & Shipment
- Once all lines are packed, a **Shipment** record is created with carrier and service.
- **Packages** are added (one per carton/pallet) with tracking numbers and dimensions.
- Dimensional weight is computed: `max(actualWeight, (L × W × H) / dimFactor)`.
- BOL PDF is generated using the Client's **BOLTemplate** and streamed for download or emailed.
- Inventory quantities are decremented. Order status moves to SHIPPED.

### 6. Full Pallet Orders
- Orders flagged as "full pallet" bypass individual pick lines.
- Entire **InventoryLot** pallets are assigned directly to the order.
- BOL includes pallet count, commodity, and NMFC class fields.

### 7. Parcel Tracking
- On shipment creation, each **Package** tracking number is registered for tracking.
- A polling job (or on-demand refresh) calls FedEx/UPS APIs and updates `Package.trackingStatus` and `Package.lastEvent`.
- Clients can view tracking status from their dashboard.

### 8. Dimensional Weight Calculation
- Formula: `billableWeight = max(actualWeight, ceil((length × width × height) / dimFactor))`
- `dimFactor` defaults are: FedEx/UPS = 139 (domestic), 166 (international). Stored in `SystemSetting`.
- Displayed on shipment summary and included on invoicing exports.

### 9. Airport Code Routing
- Each **Store** has an `airportCode` field (e.g., LAX, ORD, JFK).
- On order creation, if no airport code is set, the system looks up the destination zip code against a zip-to-airport mapping table.
- Airport code is printed on pallet labels and BOLs for carrier hub routing.

### 10. Alert Rules
- Configurable **AlertRule** records define thresholds (e.g., inventory < 50 units for SKU X).
- A background check (triggered on inventory change or via cron) evaluates rules and sends email alerts to configured recipients.

---

## Tech Stack Justification

| Technology | Reason |
|---|---|
| **Next.js 14 App Router** | Unified full-stack framework. Server Components reduce client JS bundle. Route Handlers replace a separate Express API. RSC streaming improves perceived performance. |
| **TypeScript** | Type safety across the full stack. Prisma generates types from the schema, eliminating runtime type mismatches. |
| **Tailwind CSS** | Utility-first CSS with consistent design tokens. No context switching between CSS files and components. |
| **shadcn/ui** | Radix UI primitives + Tailwind. Accessible, unstyled components we own in our codebase (not a black-box dependency). |
| **Prisma ORM** | Type-safe database client generated from the schema. First-class migration tooling. Works seamlessly with Supabase PostgreSQL. |
| **PostgreSQL / Supabase** | Relational integrity is essential for WMS (foreign keys, transactions). Supabase provides hosted Postgres with connection pooling, auth helpers, and a web UI — no infra to manage. |
| **NextAuth v4** | Battle-tested auth for Next.js. Prisma adapter stores sessions in the DB. Supports Credentials + OAuth providers. |
| **@react-pdf/renderer** | Server-side PDF generation without headless Chrome. Produces BOLs and packing slips as byte streams. |
| **Nodemailer** | Simple SMTP email. Swap for SendGrid/Resend in production by swapping the transport config. |
| **Zod + React Hook Form** | End-to-end validated forms. Zod schemas serve as both form validators and API request validators. |

---

## Setup & Run Instructions

### Prerequisites
- Node.js 18+
- A Supabase project (free tier works for development)
- Git

### Local Development

```bash
# 1. Clone the repository
git clone <repo-url>
cd stc-wms

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.local.example .env.local
# Edit .env.local — fill in Supabase connection strings, NEXTAUTH_SECRET, etc.

# 4. Run database migrations
npx prisma migrate dev

# 5. Seed initial data
npx prisma db seed

# 6. Start the dev server
npm run dev
# App available at http://localhost:3000
```

### Useful Database Commands

```bash
npm run db:migrate    # Run pending migrations (dev)
npm run db:seed       # Seed/re-seed the database
npm run db:push       # Push schema without migration file (prototyping only)
npm run db:studio     # Open Prisma Studio (visual DB browser)
```

---

## Known Limitations

1. **No real-time updates** — The UI does not push live updates. Users must refresh to see changes made by others. A future Supabase Realtime subscription layer would address this.
2. **No barcode scanner integration** — Pick/pack flows currently use manual quantity entry or keyboard input. Hardware scanner integration (USB HID or WebHID API) is not included in the MVP.
3. **Single warehouse** — While the schema supports multiple warehouses, the UI and navigation are built around a single warehouse context. Multi-warehouse switching is a future enhancement.
4. **Polling-based tracking** — Carrier tracking is polled on demand, not via webhooks. High-volume shipment tracking may hit API rate limits.
5. **No automated DIM weight billing export** — Dimensional weight is calculated and displayed but not exported to a billing/invoicing system.
6. **Credentials auth only** — OAuth (Google, Microsoft) is not configured by default. The Prisma adapter supports it; provider config just needs to be added to the NextAuth options.
7. **Email reliability** — Nodemailer with SMTP is suitable for low-to-medium volume. For production scale, swap the transport for a transactional email service (Resend, SendGrid, Postmark).
8. **CSV import validation** — CSV import performs basic Zod validation but does not yet support partial success (all-or-nothing import).

---

## Future Enhancements

- **Barcode / QR scanner support** via WebHID or mobile camera scanning (using a library like `zxing-wasm`)
- **Multi-warehouse UI** with warehouse selector and inter-warehouse transfer workflows
- **Supabase Realtime** for live pick list updates and order status push notifications
- **Webhook-based carrier tracking** (FedEx webhooks, UPS Quantum View) to replace polling
- **Client portal** — a restricted view for clients to create orders, view inventory, and track shipments without accessing internal warehouse operations
- **EDI integration** — 940/945 transaction sets for retailer compliance (Target, Walmart, etc.)
- **Billing module** — Storage billing (per pallet/per unit), handling fees, and outbound shipping charge reconciliation
- **Mobile PWA** — Offline-capable picking app optimized for warehouse floor tablets/handhelds
- **Cycle count module** — Scheduled and ad-hoc inventory counts with variance reporting
- **Returns processing (RMA)** — Inbound returns workflow with condition grading and restock/dispose decisions
- **API key authentication** — Allow clients to integrate directly via REST API with scoped API keys
