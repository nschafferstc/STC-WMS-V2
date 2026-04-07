You are an expert full-stack product engineer. Build a complete, production-quality Warehouse Management System (WMS) for STC Logistics.

## ABSOLUTE RULES
1. Do not ask questions. Do not confirm. Do not plan without building.
2. Make all reasonable assumptions and proceed immediately.
3. Build every file, every screen, every workflow completely.
4. The first file you create is CLAUDE.md. Then build the application without stopping.

---

## TECH STACK
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Prisma ORM + PostgreSQL (Supabase)
- React Hook Form + Zod validation
- PDF generation: @react-pdf/renderer or pdf-lib
- Email: Nodemailer (SMTP placeholder)
- Deployment: Vercel
- Database: Supabase (managed Postgres)
- Version control: GitHub

Do not use SQLite anywhere. The database is Postgres in all environments.

---

## CLAUDE.md CONTENTS
Include: product objective, all assumptions made, system architecture, data model overview, core workflows, tech stack justification, setup/run instructions, known limitations, future enhancements.

---

## ENVIRONMENT VARIABLES
Create `.env.local.example` with all keys and inline comments. Developers copy this to `.env.local` and fill in their values.

```
# Supabase / Prisma — dual connection required for Vercel serverless
# DATABASE_URL: Supabase Transaction pooler (port 6543) — used for all runtime queries
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# DIRECT_URL: Supabase direct connection (port 5432) — used for Prisma migrations only
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# App auth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Email — Nodemailer (fill in for outbound notifications)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""

# Carrier APIs (placeholders — fill in for live parcel tracking)
FEDEX_API_KEY=""
UPS_API_KEY=""
```

---

## PRISMA CONFIGURATION
In `prisma/schema.prisma`, configure the datasource exactly as follows:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

All Prisma field types must be Postgres-compatible:
- Long strings → `@db.Text`
- Weights and dimensions → `Decimal`
- Flags → `Boolean`
- Timestamps → `DateTime @default(now())`

---

## BRANDING & UI DIRECTION
Reference shipstc.com for color and style. STC uses navy, white, and orange accents.

Design principles:
- Industrial-utilitarian — this is a warehouse operations tool, not a consumer app
- High information density with strong visual hierarchy
- Status-driven — every record shows its status at all times
- Mobile-responsive for warehouse floor use (large tap targets, readable at arm's length)
- Left sidebar navigation + top header on all authenticated pages

Status color system (apply consistently everywhere):
- Green = Complete / Ready / No issues
- Yellow = In Progress / Pending / Warning
- Red = Blocked / Discrepancy / Urgent
- Blue = Active / Informational
- Gray = Draft / Inactive

Required UI components:
- Dashboard stat cards with trend indicators
- Filterable, searchable, sortable data tables
- Structured forms with inline validation
- Status badges on every record
- Slide-over detail drawers for quick-view
- Full detail pages for editing
- Empty states with actionable CTAs
- Toast notifications for all system events
- Confirmation modals for destructive actions

---

## DATA MODEL

### Entities
```
Warehouse         — physical 3PL location managed by STC
Client            — brand or retailer STC serves
Project           — engagement scoped to a client, spans 1+ warehouses
Store             — individual retail location, child of Project (rollout projects)
User              — STC staff, warehouse ops, or client contact
SKU               — component/product unit with dims and weight
Inventory         — on_hand + allocated per SKU per warehouse per project
InventoryLot      — individual receiving lot with date (drives aging logic)
ASN               — advance shipment notice with expected SKUs and quantities
ASNLine           — line item on an ASN
InboundReceipt    — actual receiving record against an ASN
ReceiptLine       — line item: expected vs. received, discrepancy type
Order             — outbound fulfillment request
OrderLine         — SKU + quantity on an order
Pallet            — discrete pallet unit with dims, weight, shrink status
PalletItem        — SKU + quantity assigned to a pallet
Shipment          — outbound shipment record, post-order
Package           — inbound parcel (expected or unexpected)
Discrepancy       — receiving or inventory exception record
BOLTemplate       — configurable Bill of Lading template
AlertRule         — threshold-based notification configuration
SystemSetting     — key/value store for all persisted admin settings
```

### Key Field Rules
- `Inventory.available` = `on_hand - allocated` — computed at query time, not stored
- `Store.airport_code` — stored field, derived from zip via Air Cargo Index at seed/import time; zero-pad numeric zips to 5 digits before lookup
- `Store.origin_wh_tag` — normalized Air Cargo Index airport code: `MEM`, `CMH`, or `LAX`
- `Store.assigned_warehouse_id` — FK to Warehouse, drives order routing
- `Order.warehouse_id` — auto-populated from store's `assigned_warehouse_id` when store is selected
- `Order.load_type` — enum: `Palletized | Floor-Loaded | Mixed`
- `Package.status` — enum: `Expected | Received | Quarantined | Approved | Rejected`
- `Discrepancy.status` — enum: `Open | Under Review | Resolved`

---

## SEED DATA

### Warehouses
| id | code | company_name (STC admin only) | stc_reference_name | address | city | state | zip |
|---|---|---|---|---|---|---|---|
| 1 | WH-EWR-01 | Decaro Trucking | STC Newark DC | 22 McClellan Street | Newark | NJ | 07114 |
| 2 | WH-CMH-01 | Newark Parcel | STC Columbus DC | P134 Co Rd 12 | Napoleon | OH | 43545 |
| 3 | WH-DFW-01 | Pentonix | STC Dallas DC | 100 Successful Drive | Fort Worth | TX | 76134 |
| 4 | WH-LAX-01 | Leon's Freight | STC Los Angeles DC | 13009 South Main Street | Los Angeles | CA | 90061 |
| 5 | WH-MEM-01 | Synergy/Bluewater | STC Memphis DC | 3850 Air Park Street | Memphis | TN | 38118 |

> Warehouse users and clients see `stc_reference_name` only. `company_name` is visible to STC admins only.

### Origin Warehouse Tag Mapping (Air Cargo Index airport codes)
| tag | warehouse_id | notes |
|---|---|---|
| MEM | 5 | Memphis TN |
| CMH | 2 | Napoleon OH — Columbus airport code |
| OH | 2 | Legacy tag in source data — normalize to CMH on import |
| LAX | 4 | Los Angeles CA |

### Clients
| id | code | name |
|---|---|---|
| 1 | CL-CVS | CVS Health |
| 2 | CL-BAR | Barrows Connected Store |
| 3 | CL-KOH | Kohler |
| 4 | CL-GME | GameStop |

### Projects
| id | code | client_id | name |
|---|---|---|---|
| 1 | PRJ-CVS-EB | 1 | Elevated Beauty Rollout |
| 2 | PRJ-BAR-KROG | 2 | Kroger Display Install |
| 3 | PRJ-KOH-SAUNA | 3 | Sauna Launch |

### Users
| id | name | role | warehouse_id |
|---|---|---|---|
| 1 | Nick Schaffer | STC Executive | null |
| 2 | Natalie Santos | STC Ops Manager | null |
| 3 | Jason Kuka | STC Coordinator | null |
| 4 | Frank Ferlito | STC Project Coordinator | null |
| 5 | Warehouse Lead | Warehouse Ops | 2 |

### SKUs — General Projects
| id | code | client_id | description | units_per_pallet |
|---|---|---|---|---|
| 1 | SKU-CVS-EB-001 | 1 | Elevated Beauty Fixture | 8 |
| 2 | SKU-CVS-EH-002 | 1 | Elevated Health Fixture | 8 |
| 4 | SKU-KOH-SAUNA-IN | 3 | Indoor Sauna | 1 |
| 5 | SKU-KOH-SAUNA-OUT | 3 | Outdoor Sauna | 1 |

### SKUs — PRJ-BAR-KROG (client_id: 2)
| id | code | name | description | dims_l | dims_w | dims_h | weight_lbs |
|---|---|---|---|---|---|---|---|
| 10 | SKU-BAR-KROG-001 | Entrance Screen 1s | Entrance Single Screen Fixture | null | null | null | null |
| 11 | SKU-BAR-KROG-002 | Entrance Screen 1s Vac Form | Entrance Single Screen Vac Form | null | null | null | null |
| 12 | SKU-BAR-KROG-003 | Entrance Screen 3s | Entrance Three Screen Fixture | 53 | 29 | 20 | null |
| 13 | SKU-BAR-KROG-004 | Entrance Screen 3s Vac Form | Entrance Three Screen Vac Form | 51 | 36 | 10 | null |
| 14 | SKU-BAR-KROG-005 | Entrance Screen 5s | Entrance Five Screen Fixture | 53 | 29 | 27 | null |
| 15 | SKU-BAR-KROG-006 | Entrance Screen 5s Vac Form | Entrance Five Screen Vac Form | 51 | 36 | 13 | null |
| 16 | SKU-BAR-KROG-007 | Flush Wall Mount System | — | null | null | null | null |
| 17 | SKU-BAR-KROG-008 | Ceiling Mount System | — | null | null | null | null |
| 18 | SKU-BAR-KROG-009 | Wall Mount Pole Drop System | — | null | null | null | null |
| 19 | SKU-BAR-KROG-010 | Meat and Seafood Bunker | MS Fixture | 76 | 21 | 8 | null |
| 20 | SKU-BAR-KROG-011 | End Cap | EC Fixture | 54 | 38 | 9 | null |
| 21 | SKU-BAR-KROG-012 | End Cap HBC | EC Fixture | null | null | null | null |
| 22 | SKU-BAR-KROG-013 | Frozen Side Cap | FSC Fixture | 85 | 36 | 9 | null |
| 23 | SKU-BAR-KROG-014 | Pharmacy Standee | Pharma Fixture | 67 | 26 | 21 | null |
| 24 | SKU-BAR-KROG-015 | VM55B-U | Entry 55" TV Screen | 55 | 34 | 10 | 61 |
| 25 | SKU-BAR-KROG-016 | SH37B | 37" TV Screen | 44 | 15 | 5 | 20 |
| 26 | SKU-BAR-KROG-017 | QM55C | 55" TV Screen | 56 | 34 | 7 | 53 |
| 27 | SKU-BAR-KROG-018 | QM65C | 65" TV Screen | 64 | 38 | 7 | 63 |
| 28 | SKU-BAR-KROG-019 | QM43C | 43" TV Screen | 43 | 27 | 5 | 25 |
| 29 | SKU-BAR-KROG-020 | QM32C | 32" TV Screen | null | null | null | null |
| 30 | SKU-BAR-KROG-021 | P1000 Unistrut 10ft | 10 ft Unistrut Channel | 120 | 2 | 2 | 18 |
| 31 | SKU-BAR-KROG-022 | Custom Telescopic Pole | Custom South Africa Pole | null | null | null | null |

### PRJ-BAR-KROG Store List (230 stores — seed all)
Store counts by origin warehouse: WH-CMH-01 (id 2) = 91 stores | WH-MEM-01 (id 5) = 83 stores | WH-LAX-01 (id 4) = 56 stores

Columns: freight_stc_num, wh_stc_num, region, region_code, store_num, subcode, address, city, state, zip, airport_code, assigned_warehouse_id

| freight_stc | wh_stc | region | reg_code | store# | subcode | address | city | state | zip | airport | wh_id |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 675909 | 675909W | Cincinnati | 14 | 913 | 16838 | 2100 W Michigan St | Sidney | OH | 45365 | DAY | 2 |
| 675791 | 675791W | Atlanta | 11 | 459 | 14868 | 2875 N Decatur Rd | Decatur | GA | 30033 | ATL | 5 |
| 675908 | 675908W | Cincinnati | 14 | 910 | 16827 | 475 Fortman Dr | Saint Marys | OH | 45885 | DAY | 2 |
| 675795 | 675795W | Atlanta | 11 | 679 | 15865 | 4753 Atlanta Hwy | Loganville | GA | 30052 | ATL | 5 |
| 675797 | 675797W | Atlanta | 11 | 633 | 5653 | E Lake Road & SR-155 | McDonough | GA | 30252 | ATL | 5 |
| 675782 | 675782W | Atlanta | 11 | 672 | 15837 | 800 Glenwood Ave SE | Atlanta | GA | 30316 | ATL | 5 |
| 675929 | 675929W | Michigan | 18 | 684 | 15884 | 21555 21 Mile Rd | Macomb | MI | 48044 | DTW | 2 |
| 675931 | 675931W | Michigan | 18 | 724 | 16064 | 35000 23 Mile Rd | New Baltimore | MI | 48047 | DTW | 2 |
| 675935 | 675935W | Michigan | 18 | 706 | 15979 | 66900 Gratiot Ave | Richmond | MI | 48062 | DTW | 2 |
| 675783 | 675783W | Atlanta | 11 | 685 | 15892 | 3559 Chamblee Tucker Rd | Atlanta | GA | 30341 | ATL | 5 |
| 675926 | 675926W | Michigan | 18 | 465 | 14914 | 1821 S Cedar St | Imlay City | MI | 48444 | MBS | 2 |
| 675912 | 675912W | Cincinnati | 14 | 984 | 5751 | 731 W Market Street | Troy | OH | 45373 | DAY | 2 |
| 675742 | 675742W | Frys | 660 | 622 | 5639 | 1935 N Stapley Dr | Mesa | AZ | 85203 | PHX | 4 |
| 675911 | 675911W | Cincinnati | 14 | 741 | 16132 | 2989 Derr Rd | Springfield | OH | 45503 | DAY | 2 |
| 675884 | 675884W | Cincinnati | 14 | 938 | 5745 | 885 Union Rd | Englewood | OH | 45322 | DAY | 2 |
| 675732 | 675732W | Frys | 660 | 624 | 5643 | 1845 E Baseline Rd | Gilbert | AZ | 85233 | PHX | 4 |
| 675731 | 675731W | Frys | 660 | 615 | 5634 | 1455 N Higley Rd | Gilbert | AZ | 85234 | PHX | 4 |
| 675914 | 675914W | Cincinnati | 14 | 747 | 16157 | 780 Northwoods Blvd | Vandalia | OH | 45377 | DAY | 2 |
| 675882 | 675882W | Cincinnati | 14 | 754 | 16182 | 4506 Brandt Pike | Dayton | OH | 45424 | DAY | 2 |
| 675892 | 675892W | Cincinnati | 14 | 758 | 16195 | 7747 Troy Pike | Huber Heights | OH | 45424 | DAY | 2 |
| 675919 | 675919W | Michigan | 18 | 638 | 15721 | 9968 East Grand River | Brighton Township | MI | 48116 | DTW | 2 |
| 675933 | 675933W | Michigan | 18 | 721 | 16052 | 9700 Chilson Commons | Pinckney | MI | 48169 | DTW | 2 |
| 675930 | 675930W | Michigan | 18 | 526 | 15223 | 670 Highland Ave | Milford | MI | 48381 | DTW | 2 |
| 675949 | 675949W | Michigan | 18 | 759 | 5711 | 10951 Highland Rd | White Lake | MI | 48386 | DTW | 2 |
| 675856 | 675856W | Louisville | 24 | 389 | 14353 | 5929 Timber Ridge Dr | Prospect | KY | 40059 | SDF | 5 |
| 675826 | 675826W | Louisville | 24 | 794 | 5724 | 2835 S Hwy 393 | Buckner | KY | 40010 | SDF | 5 |
| 675825 | 675825W | Louisville | 24 | 903 | 16795 | 568 Bypass Rd | Brandenburg | KY | 40108 | SDF | 5 |
| 675855 | 675855W | Louisville | 24 | 770 | 16232 | 2630 Frederica St | Owensboro | KY | 42301 | EVV | 5 |
| 675828 | 675828W | Louisville | 24 | 362 | 14158 | 111 Towne Dr | Elizabethtown | KY | 42701 | SDF | 5 |
| 675829 | 675829W | Louisville | 24 | 717 | 16039 | 3040 Dolphin Dr | Elizabethtown | KY | 42701 | SDF | 5 |
| 675842 | 675842W | Louisville | 24 | 339 | 14005 | 2440 Bardstown Rd | Louisville | KY | 40205 | SDF | 5 |
| 675858 | 675858W | Louisville | 24 | 387 | 14338 | 291 N Hubbards Ln Ste 130 | Saint Matthews | KY | 40207 | SDF | 5 |
| 675827 | 675827W | Louisville | 24 | 762 | 16209 | 305 E Lewis And Clark Pkwy | Clarksville | IN | 47129 | SDF | 5 |
| 675833 | 675833W | Louisville | 24 | 776 | 5717 | 1027 Jeffersonville Commons Drive | Jeffersonville | IN | 47130 | SDF | 5 |
| 675853 | 675853W | Louisville | 24 | 396 | 5539 | 200 New Albany Plz | New Albany | IN | 47150 | SDF | 5 |
| 675843 | 675843W | Louisville | 24 | 346 | 14050 | 3039 Breckenridge Ln | Louisville | KY | 40220 | SDF | 5 |
| 675851 | 675851W | Louisville | 24 | 356 | 14123 | 12501 Shelbyville Rd | Middletown | KY | 40243 | SDF | 5 |
| 675841 | 675841W | Louisville | 24 | 186 | 13314 | 2219 Holiday Manor Court | Louisville | KY | 40222 | SDF | 5 |
| 675839 | 675839W | Louisville | 24 | 379 | 5538 | 9080 Taylorsville Rd | Louisville | KY | 40299 | SDF | 5 |
| 675847 | 675847W | Louisville | 24 | 743 | 16141 | 12611 Taylorsville Rd Ste 102 | Louisville | KY | 40299 | SDF | 5 |
| 675854 | 675854W | Louisville | 24 | 766 | 16220 | 200 E Brannon Rd | Nicholasville | KY | 40356 | SDF | 5 |
| 675955 | 675955W | Louisville | 24 | 774 | 5714 | 212 Kroger Way | Versailles | KY | 40383 | SDF | 2 |
| 675953 | 675953W | Louisville | 24 | 733 | 16102 | 200 Skywatch Dr | Danville | KY | 40422 | CVG | 2 |
| 675857 | 675857W | Louisville | 24 | 705 | 5701 | 890 Richmond Plaza | Richmond | KY | 40475 | SDF | 5 |
| 675860 | 675860W | Louisville | 24 | 745 | 5707 | 50 Stonegate Center | Somerset | KY | 42501 | TYS | 5 |
| 675954 | 675954W | Louisville | 24 | 712 | 16011 | 810 Indian Mound Dr | Mt Sterling | KY | 40353 | CVG | 2 |
| 675859 | 675859W | Louisville | 24 | 777 | 5718 | 311 Boone Station Rd | Shelbyville | KY | 40065 | SDF | 5 |
| 675848 | 675848W | Louisville | 24 | 752 | 16175 | 3165 S 2nd St | Louisville | KY | 40208 | SDF | 5 |
| 675861 | 675861W | Louisville | 24 | 402 | 14446 | 1661 Bypass Rd Hwy 1958 | Winchester | KY | 40391 | SDF | 5 |
| 675844 | 675844W | Louisville | 24 | 350 | 14079 | 5533 New Cut Rd | Louisville | KY | 40214 | SDF | 5 |
| 675840 | 675840W | Louisville | 24 | 785 | 5722 | 4915A Dixie Highway | Louisville | KY | 40216 | SDF | 5 |
| 675838 | 675838W | Louisville | 24 | 784 | 16270 | 704 Euclid Ave | Lexington | KY | 40502 | SDF | 5 |
| 675834 | 675834W | Louisville | 24 | 407 | 5541 | 3101 Richmond Rd | Lexington | KY | 40509 | SDF | 5 |
| 675837 | 675837W | Louisville | 24 | 768 | 16228 | 1600 Leestown Rd | Lexington | KY | 40511 | SDF | 5 |
| 675835 | 675835W | Louisville | 24 | 767 | 5713 | 3175 Beaumont Centre Cir | Lexington | KY | 40513 | SDF | 5 |
| 675836 | 675836W | Louisville | 24 | 347 | 14059 | 4101 Tates Creek Centre Drive | Lexington | KY | 40517 | SDF | 5 |
| 675830 | 675830W | Louisville | 24 | 368 | 14202 | 1309 US 127 S Suite H | Frankfort | KY | 40601 | SDF | 5 |
| 675849 | 675849W | Louisville | 24 | 753 | 16180 | 1265 Goss Ave | Louisville | KY | 40217 | SDF | 5 |
| 675885 | 675885W | Cincinnati | 14 | 838 | 5732 | 1161 E Dayton Yellow Springs Rd | Fairborn | OH | 45324 | DAY | 2 |
| 675894 | 675894W | Cincinnati | 14 | 825 | 16425 | 2115 E Dorothy Ln | Kettering | OH | 45420 | DAY | 2 |
| 675864 | 675864W | Cincinnati | 14 | 811 | 5727 | 3165 Dayton Xenia Rd | Beavercreek | OH | 45434 | DAY | 2 |
| 675868 | 675868W | Cincinnati | 14 | 960 | 17030 | 5400 Cornerstone North Blvd | Centerville | OH | 45440 | DAY | 2 |
| 675936 | 675936W | Michigan | 18 | 492 | 15044 | 65 S Livernois Rd | Rochester Hills | MI | 48307 | DTW | 2 |
| 675941 | 675941W | Michigan | 18 | 737 | 5703 | 14945 23 Mile Rd | Shelby Township | MI | 48315 | DTW | 2 |
| 675942 | 675942W | Michigan | 18 | 754 | 5709 | 7644 26 Mile Road | Shelby Township | MI | 48316 | DTW | 2 |
| 675921 | 675921W | Michigan | 18 | 651 | 15772 | 5990 Sashabaw Rd | Clarkston | MI | 48346 | DTW | 2 |
| 675904 | 675904W | Cincinnati | 14 | 770 | 91055 | 255 N Heincke Rd | Miamisburg | OH | 45342 | DAY | 2 |
| 675895 | 675895W | Cincinnati | 14 | 826 | 6519 | 530 E Stroop Rd | Kettering | OH | 45429 | DAY | 2 |
| 675850 | 675850W | Louisville | 24 | 780 | 16256 | 10645 Dixie Hwy | Louisville | KY | 40272 | SDF | 5 |
| 675832 | 675832W | Louisville | 24 | 779 | 5720 | 106 Marketplace Circle | Georgetown | KY | 40324 | SDF | 5 |
| 675831 | 675831W | Louisville | 24 | 397 | 14407 | 300 Brighton Park Blvd | Frankfort | KY | 40601 | SDF | 5 |
| 675824 | 675824W | Louisville | 24 | 408 | 14497 | 102 W John Rowan Blvd | Bardstown | KY | 40004 | SDF | 5 |
| 675867 | 675867W | Cincinnati | 14 | 923 | 5744 | 1095 S Main St | Centerville | OH | 45458 | DAY | 2 |
| 675883 | 675883W | Cincinnati | 14 | 951 | 16986 | 2921 W Alex Bell Rd | Dayton | OH | 45459 | DAY | 2 |
| 675922 | 675922W | Michigan | 18 | 528 | 15238 | 41941 Garfield Rd | Clinton Township | MI | 48038 | DTW | 2 |
| 675947 | 675947W | Michigan | 18 | 776 | 16249 | 31200 Schoenherr Rd | Warren | MI | 48092 | DTW | 2 |
| 675945 | 675945W | Michigan | 18 | 449 | 14807 | 43893 Schoenherr Rd | Sterling Heights | MI | 48313 | DTW | 2 |
| 675944 | 675944W | Michigan | 18 | 757 | 5710 | 2051 18 Mile Road | Sterling Heights | MI | 48314 | DTW | 2 |
| 675878 | 675878W | Cincinnati | 14 | 948 | 16973 | 6165 Glenway Ave | Cincinnati | OH | 45211 | CVG | 2 |
| 675877 | 675877W | Cincinnati | 14 | 944 | 16958 | 5080 Delhi Pike | Cincinnati | OH | 45238 | CVG | 2 |
| 675873 | 675873W | Cincinnati | 14 | 444 | 5549 | 5910 Harrison Avenue | Cincinnati | OH | 45248 | CVG | 2 |
| 675786 | 675786W | Atlanta | 11 | 629 | 5651 | 125 E Main Street Market Place | Cartersville | GA | 30121 | ATL | 5 |
| 675800 | 675800W | Atlanta | 11 | 667 | 15817 | 1476 Turner McCall Blvd SW | Rome | GA | 30161 | ATL | 5 |
| 675905 | 675905W | Cincinnati | 14 | 441 | 5548 | 3420 Towne Blvd | Middletown | OH | 45005 | DAY | 2 |
| 675897 | 675897W | Cincinnati | 14 | 447 | 5550 | 1425 Columbus Ave | Lebanon | OH | 45036 | CVG | 2 |
| 675910 | 675910W | Cincinnati | 14 | 925 | 90753 | 625 W Central Ave | Springboro | OH | 45066 | DAY | 2 |
| 675917 | 675917W | Cincinnati | 14 | 817 | 16382 | 1230 Rombach Ave | Wilmington | OH | 45177 | DAY | 2 |
| 675903 | 675903W | Cincinnati | 14 | 722 | 16060 | 10101 Landing Way | Miamisburg | OH | 45342 | DAY | 2 |
| 675937 | 675937W | Michigan | 18 | 774 | 16242 | 20891 E 13 Mile Rd | Roseville | MI | 48066 | DTW | 2 |
| 675938 | 675938W | Michigan | 18 | 743 | 5704 | 2200 E 12 Mile Road | Royal Oak | MI | 48067 | DTW | 2 |
| 675939 | 675939W | Michigan | 18 | 495 | 15062 | 23191 Marter Rd | Saint Clair Shores | MI | 48080 | DTW | 2 |
| 675940 | 675940W | Michigan | 18 | 749 | 16166 | 22801 Harper Ave | Saint Clair Shores | MI | 48080 | DTW | 2 |
| 675792 | 675792W | Atlanta | 11 | 682 | 5682 | 1931 Jesse Jewell Parkway | Gainesville | GA | 30501 | ATL | 5 |
| 675790 | 675790W | Atlanta | 11 | 670 | 5670 | 378 Marketplace Parkway | Dawsonville | GA | 30534 | ATL | 5 |
| 675899 | 675899W | Cincinnati | 14 | 439 | 5546 | 5250 Newtown Drive | Liberty Township | OH | 45011 | CVG | 2 |
| 675889 | 675889W | Cincinnati | 14 | 909 | 16822 | 1474 Main St Hamilton Richmond Rd | Hamilton | OH | 45013 | CVG | 2 |
| 675886 | 675886W | Cincinnati | 14 | 939 | 16938 | 560 Wessel Dr | Fairfield | OH | 45014 | CVG | 2 |
| 675907 | 675907W | Cincinnati | 14 | 412 | 14527 | 300 S Locust St | Oxford | OH | 45056 | DAY | 2 |
| 675932 | 675932W | Michigan | 18 | 751 | 16174 | 26200 Greenfield Rd | Oak Park | MI | 48237 | DTW | 2 |
| 675924 | 675924W | Michigan | 18 | 729 | 16086 | 2905 Union Lake Rd | Commerce Twp | MI | 48382 | DTW | 2 |
| 675923 | 675923W | Michigan | 18 | 634 | 15701 | 47060 W Pontiac Trl | Commerce Township | MI | 48390 | DTW | 2 |
| 675901 | 675901W | Cincinnati | 14 | 492 | 15047 | 5705 South SR 48 | Maineville | OH | 45039 | CVG | 2 |
| 675898 | 675898W | Cincinnati | 14 | 383 | 14312 | 7300 Yankee Rd | Liberty Township | OH | 45044 | CVG | 2 |
| 675916 | 675916W | Cincinnati | 14 | 959 | 5746 | 8000 Princeton-Glendale Rd | West Chester | OH | 45069 | CVG | 2 |
| 675871 | 675871W | Cincinnati | 14 | 384 | 14318 | 8421 Winton Rd | Cincinnati | OH | 45231 | CVG | 2 |
| 675879 | 675879W | Cincinnati | 14 | 968 | 5747 | 3636 Springdale Road | Cincinnati | OH | 45251 | CVG | 2 |
| 675927 | 675927W | Michigan | 18 | 615 | 15617 | 33523 8 Mile Rd | Livonia | MI | 48152 | DTW | 2 |
| 675928 | 675928W | Michigan | 18 | 618 | 15630 | 30935 5 Mile Rd | Livonia | MI | 48154 | DTW | 2 |
| 675934 | 675934W | Michigan | 18 | 670 | 15825 | 44525 Ann Arbor Rd W | Plymouth | MI | 48170 | DTW | 2 |
| 675920 | 675920W | Michigan | 18 | 671 | 15828 | 1905 N Canton Center Rd | Canton | MI | 48187 | DTW | 2 |
| 675725 | 675725W | Frys | 660 | 669 | 5667 | 2858 N Pinal Ave | Casa Grande | AZ | 85122 | PHX | 4 |
| 675726 | 675726W | Frys | 660 | 48 | 12716 | 1385 E Florence Blvd | Casa Grande | AZ | 85122 | PHX | 4 |
| 675741 | 675741W | Frys | 660 | 672 | 5671 | 20797 N John Wayne Pkwy | Maricopa | AZ | 85139 | PHX | 4 |
| 675880 | 675880W | Cincinnati | 14 | 445 | 14770 | 4001 State Route 128 Hamilton Cleves Rd | Cleves | OH | 45002 | CVG | 2 |
| 675890 | 675890W | Cincinnati | 14 | 907 | 5739 | 10477 Harrison Ave | Harrison | OH | 45030 | CVG | 2 |
| 675863 | 675863W | Cincinnati | 14 | 406 | 14474 | 1034 State Road 229 North | Batesville | IN | 47006 | CVG | 2 |
| 675803 | 675803W | Central | 21 | 814 | 16363 | 1845 N Scatterfield Rd | Anderson | IN | 46012 | IND | 5 |
| 675809 | 675809W | Central | 21 | 959 | 17028 | 1217 S Range Line Rd | Carmel | IN | 46032 | IND | 5 |
| 675812 | 675812W | Central | 21 | 869 | 5736 | 11700 Olio Road | Fishers | IN | 46037 | IND | 5 |
| 675813 | 675813W | Central | 21 | 895 | 16762 | 9799 E 116th St | Fishers | IN | 46037 | IND | 5 |
| 675811 | 675811W | Central | 21 | 744 | 5706 | Allisonville Rd & 116th St | Fishers | IN | 46038 | IND | 5 |
| 675823 | 675823W | Central | 21 | 970 | 17072 | 150 W 161st St | Westfield | IN | 46074 | IND | 5 |
| 675808 | 675808W | Central | 21 | 215 | 90638 | 975 North Green Street | Brownsburg | IN | 46112 | IND | 5 |
| 675804 | 675804W | Central | 21 | 985 | 17127 | 108 N State Road 267 | Avon | IN | 46123 | IND | 5 |
| 675814 | 675814W | Central | 21 | 979 | 5750 | 970 N Morton St | Franklin | IN | 46131 | IND | 5 |
| 675815 | 675815W | Central | 21 | 735 | 16113 | 5961 N State Road 135 | Greenwood | IN | 46143 | IND | 5 |
| 675820 | 675820W | Central | 21 | 993 | 17156 | 1330 W Southport Rd | Indianapolis | IN | 46217 | IND | 5 |
| 675817 | 675817W | Central | 21 | 500 | 15080 | 5718 Crawfordsville Rd | Indianapolis | IN | 46224 | IND | 5 |
| 675818 | 675818W | Central | 21 | 894 | 5738 | 8745 S Emerson Avenue | Indianapolis | IN | 46237 | IND | 5 |
| 675821 | 675821W | Central | 21 | 995 | 5754 | 5350 E Thompson Rd | Indianapolis | IN | 46237 | IND | 5 |
| 675819 | 675819W | Central | 21 | 989 | 17143 | 8130 East Southport Rd | Indianapolis | IN | 46259 | IND | 5 |
| 675822 | 675822W | Central | 21 | 109 | 13019 | 605 N Dixon Rd | Kokomo | IN | 46901 | IND | 5 |
| 675896 | 675896W | Cincinnati | 14 | 361 | 14155 | 880 W Eads Pkwy | Lawrenceburg | IN | 47025 | CVG | 2 |
| 675925 | 675925W | Michigan | 18 | 697 | 15943 | 23303 Michigan Ave | Dearborn | MI | 48124 | DTW | 2 |
| 675852 | 675852W | Louisville | 24 | 758 | 16196 | 234 Eastbrooke Pkwy | Mount Washington | KY | 40047 | SDF | 5 |
| 675846 | 675846W | Louisville | 24 | 366 | 14189 | 5001 Mud Ln | Louisville | KY | 40229 | SDF | 5 |
| 675845 | 675845W | Louisville | 24 | 360 | 14143 | 6900 Bardstown Rd | Louisville | KY | 40291 | SDF | 5 |
| 675810 | 675810W | Central | 21 | 710 | 5702 | 3060 N National Rd | Columbus | IN | 47201 | IND | 5 |
| 675805 | 675805W | Central | 21 | 900 | 16779 | 4025 S Old State Road 37 | Bloomington | IN | 47401 | IND | 5 |
| 675806 | 675806W | Central | 21 | 928 | 16894 | 1175 S College Mall Rd | Bloomington | IN | 47401 | IND | 5 |
| 675807 | 675807W | Central | 21 | 960 | 17031 | 500 S Liberty Dr | Bloomington | IN | 47403 | IND | 5 |
| 675946 | 675946W | Michigan | 18 | 686 | 15893 | 7000 Monroe Blvd | Taylor | MI | 48180 | DTW | 2 |
| 675948 | 675948W | Michigan | 18 | 691 | 15920 | 36430 Ford Rd | Westland | MI | 48185 | DTW | 2 |
| 675943 | 675943W | Michigan | 18 | 775 | 5716 | 16705 Fort Street | Southgate | MI | 48195 | DTW | 2 |
| 675950 | 675950W | Michigan | 18 | 707 | 15985 | 2010 Whittaker Rd | Ypsilanti | MI | 48197 | DTW | 2 |
| 675723 | 675723W | Frys | 660 | 654 | 92531 | 4625 S Miller Rd | Buckeye | AZ | 85326 | PHX | 4 |
| 675722 | 675722W | Frys | 660 | 675 | 5672 | 1300 S Watson Rd | Buckeye | AZ | 85326 | PHX | 4 |
| 675794 | 675794W | Atlanta | 11 | 638 | 15718 | 1685 Old Pendergrass Rd | Jefferson | GA | 30549 | ATL | 5 |
| 675777 | 675777W | Atlanta | 11 | 618 | 5637 | 700 US Hwy 29 N | Athens | GA | 30601 | ATL | 5 |
| 675780 | 675780W | Atlanta | 11 | 428 | 14657 | 191 Alps Rd | Athens | GA | 30606 | ATL | 5 |
| 675781 | 675781W | Atlanta | 11 | 435 | 14709 | 1720 Epps Bridge Pkwy | Athens | GA | 30606 | ATL | 5 |
| 675893 | 675893W | Cincinnati | 14 | 475 | 5557 | 1700 Declaration Drive | Independence | KY | 41051 | CVG | 2 |
| 675902 | 675902W | Cincinnati | 14 | 420 | 14598 | 381 Market Square Dr | Maysville | KY | 41056 | CVG | 2 |
| 675881 | 675881W | Cincinnati | 14 | 410 | 14513 | 375 Crossroads Blvd | Cold Spring | KY | 41076 | CVG | 2 |
| 675915 | 675915W | Cincinnati | 14 | 367 | 5535 | 635 Chestnut Dr | Walton | KY | 41094 | CVG | 2 |
| 675900 | 675900W | Cincinnati | 14 | 435 | 14710 | 6388 Branch Hill Guinea Pike | Loveland | OH | 45140 | CVG | 2 |
| 675865 | 675865W | Cincinnati | 14 | 942 | 16950 | 4100 Hunt Rd | Blue Ash | OH | 45236 | CVG | 2 |
| 675869 | 675869W | Cincinnati | 14 | 353 | 14099 | 11390 Montgomery Rd | Cincinnati | OH | 45249 | CVG | 2 |
| 675788 | 675788W | Atlanta | 11 | 635 | 15706 | 505 Dacula Rd | Dacula | GA | 30019 | ATL | 5 |
| 675787 | 675787W | Atlanta | 11 | 627 | 5648 | 5550 Bethelview Road | Cumming | GA | 30040 | ATL | 5 |
| 675784 | 675784W | Atlanta | 11 | 680 | 15873 | 6766 Hickory Flat Hwy | Canton | GA | 30115 | ATL | 5 |
| 675802 | 675802W | Atlanta | 11 | 687 | 15900 | 6001 Cumming Hwy | Sugar Hill | GA | 30518 | ATL | 5 |
| 675888 | 675888W | Cincinnati | 14 | 477 | 14975 | 2150 Dixie Hwy | Fort Mitchell | KY | 41017 | CVG | 2 |
| 675906 | 675906W | Cincinnati | 14 | 423 | 5544 | 130 Pavilion Pkwy | Newport | KY | 41071 | CVG | 2 |
| 675874 | 675874W | Cincinnati | 14 | 355 | 14115 | 3760 Paxton Ave | Cincinnati | OH | 45209 | CVG | 2 |
| 675870 | 675870W | Cincinnati | 14 | 465 | 5553 | 4613 Marburg Ave | Cincinnati | OH | 45209 | CVG | 2 |
| 675872 | 675872W | Cincinnati | 14 | 418 | 14586 | 4500 Montgomery Rd | Cincinnati | OH | 45212 | CVG | 2 |
| 675862 | 675862W | Cincinnati | 14 | 468 | 5556 | 262 W Main Street | Amelia | OH | 45102 | CVG | 2 |
| 675875 | 675875W | Cincinnati | 14 | 902 | 16787 | 4530 Eastgate Blvd #500 | Cincinnati | OH | 45245 | CVG | 2 |
| 675876 | 675876W | Cincinnati | 14 | 915 | 16844 | 7580 Beechmont Ave | Cincinnati | OH | 45255 | CVG | 2 |
| 675718 | 675718W | Frys | 660 | 665 | 5663 | 150 E Old West Highway | Apache Junction | AZ | 85119 | PHX | 4 |
| 675745 | 675745W | Frys | 660 | 115 | 13048 | 435 S Ellsworth Rd | Mesa | AZ | 85208 | PHX | 4 |
| 675743 | 675743W | Frys | 660 | 686 | 5686 | 2724 S Signal Butte Rd | Mesa | AZ | 85209 | PHX | 4 |
| 675733 | 675733W | Frys | 660 | 655 | 91423 | 3490 S Power Rd | Gilbert | AZ | 85234 | PHX | 4 |
| 675734 | 675734W | Frys | 660 | 658 | 5661 | 4075 E Williams Field Rd | Gilbert | AZ | 85295 | PHX | 4 |
| 675796 | 675796W | Atlanta | 11 | 730 | 16091 | Terrill Mill & Powers Ferry Rd | Marietta | GA | 30067 | ATL | 5 |
| 675801 | 675801W | Atlanta | 11 | 699 | 15949 | 3240 South Cobb Drive | Smyrna | GA | 30080 | ATL | 5 |
| 675789 | 675789W | Atlanta | 11 | 673 | 15838 | 455 Nathan Dean Blvd | Dallas | GA | 30132 | ATL | 5 |
| 675751 | 675751W | Frys | 660 | 628 | 5649 | 3949 E Chandler Blvd | Phoenix | AZ | 85048 | PHX | 4 |
| 675776 | 675776W | Frys | 660 | 124 | 13097 | 3255 S Rural Rd | Tempe | AZ | 85282 | PHX | 4 |
| 675775 | 675775W | Frys | 660 | 22 | 12590 | 1835 E Guadalupe Rd | Tempe | AZ | 85283 | PHX | 4 |
| 675774 | 675774W | Frys | 660 | 627 | 5647 | 9900 S Rural Rd | Tempe | AZ | 85284 | PHX | 4 |
| 675756 | 675756W | Frys | 660 | 129 | 13118 | 4724 N 20th St | Phoenix | AZ | 85016 | PHX | 4 |
| 675744 | 675744W | Frys | 660 | 23 | 12594 | 5941 E Mckellips Rd | Mesa | AZ | 85215 | PHX | 4 |
| 675866 | 675866W | Cincinnati | 14 | 434 | 14701 | 1751 Patrick Dr | Burlington | KY | 41005 | CVG | 2 |
| 675887 | 675887W | Cincinnati | 14 | 466 | 5554 | 7685 Mall Road | Florence | KY | 41042 | CVG | 2 |
| 675891 | 675891W | Cincinnati | 14 | 409 | 5542 | 3105 North Bend Rd | Hebron | KY | 41048 | CVG | 2 |
| 675913 | 675913W | Cincinnati | 14 | 454 | 5551 | 9001 US Highway 42 | Union | KY | 41091 | CVG | 2 |
| 675764 | 675764W | Frys | 660 | 682 | 5681 | 155 W Combs Rd | San Tan Valley | AZ | 85140 | PHX | 4 |
| 675763 | 675763W | Frys | 660 | 656 | 91424 | 22265 E Queen Creek Rd | Queen Creek | AZ | 85142 | PHX | 4 |
| 675762 | 675762W | Frys | 660 | 693 | 5695 | NEC Riggs & Ellsworth | Queen Creek | AZ | 85142 | PHX | 4 |
| 675757 | 675757W | Frys | 660 | 135 | 13151 | 4505 E Thomas Rd | Phoenix | AZ | 85018 | PHX | 4 |
| 675765 | 675765W | Frys | 660 | 84 | 12893 | 542 E Hunt Hwy | San Tan Valley | AZ | 85143 | PHX | 4 |
| 675735 | 675735W | Frys | 660 | 670 | 5668 | 6470 S Higley Rd | Gilbert | AZ | 85298 | PHX | 4 |
| 675785 | 675785W | Atlanta | 11 | 367 | 5534 | 1355 S Park St | Carrollton | GA | 30117 | ATL | 5 |
| 675749 | 675749W | Frys | 660 | 612 | 5633 | 4707 E Shea Blvd | Phoenix | AZ | 85028 | PHX | 4 |
| 675793 | 675793W | Atlanta | 11 | 619 | 15641 | 1524 Hwy 16 West | Griffin | GA | 30223 | ATL | 5 |
| 675766 | 675766W | Frys | 660 | 5 | 12506 | 7770 E Mcdowell Rd | Scottsdale | AZ | 85257 | PHX | 4 |
| 675753 | 675753W | Frys | 660 | 698 | 5700 | 1311 E Bell Rd | Phoenix | AZ | 85022 | PHX | 4 |
| 675798 | 675798W | Atlanta | 11 | 647 | 15751 | 1751 Newnan Crossing Blvd E | Newnan | GA | 30265 | ATL | 5 |
| 675799 | 675799W | Atlanta | 11 | 388 | 14344 | 564 Crosstown Dr | Peachtree City | GA | 30269 | ATL | 5 |
| 675755 | 675755W | Frys | 660 | 127 | 13110 | 4204 W Cactus Rd | Phoenix | AZ | 85029 | PHX | 4 |
| 675750 | 675750W | Frys | 660 | 617 | 5635 | 2727 W Bell Rd | Phoenix | AZ | 85053 | PHX | 4 |
| 675767 | 675767W | Frys | 660 | 673 | 15841 | 20427 N Hayden Rd | Scottsdale | AZ | 85255 | PHX | 4 |
| 675752 | 675752W | Frys | 660 | 694 | 5696 | 2800 West Dove Valley | Phoenix | AZ | 85085 | PHX | 4 |
| 675758 | 675758W | Frys | 660 | 96 | 90733 | Jomax Rd & SWC Norterra Pkwy | Phoenix | AZ | 85085 | PHX | 4 |
| 675736 | 675736W | Frys | 660 | 52 | 12734 | 855 W Warner Rd | Gilbert | AZ | 85233 | PHX | 4 |
| 675746 | 675746W | Frys | 660 | 657 | 5660 | 25401 N Lake Pleasant Parkway | Peoria | AZ | 85383 | PHX | 4 |
| 675727 | 675727W | Frys | 660 | 668 | 5665 | 985 E Riggs Rd | Chandler | AZ | 85249 | PHX | 4 |
| 675747 | 675747W | Frys | 660 | 683 | 92636 | 11701 W Lone Mountain Pkwy | Peoria | AZ | 85383 | PHX | 4 |
| 675728 | 675728W | Frys | 660 | 681 | 5680 | 2929 E Ocotillo Rd | Chandler | AZ | 85249 | PHX | 4 |
| 675729 | 675729W | Frys | 660 | 69 | 12814 | 2010 S Alma School Rd | Chandler | AZ | 85286 | PHX | 4 |
| 675769 | 675769W | Frys | 660 | 86 | 12906 | 19403 N RH Johnson Blvd | Sun City West | AZ | 85375 | PHX | 4 |
| 675773 | 675773W | Frys | 660 | 674 | 15847 | 13982 W Waddell Rd | Surprise | AZ | 85379 | PHX | 4 |
| 675771 | 675771W | Frys | 660 | 678 | 5675 | NWC 163rd & Tillman | Surprise | AZ | 85387 | PHX | 4 |
| 675770 | 675770W | Frys | 660 | 680 | 5678 | 15215 N Cotton Ln | Surprise | AZ | 85388 | PHX | 4 |
| 675737 | 675737W | Frys | 660 | 625 | 5645 | 6611 W Bell Rd | Glendale | AZ | 85308 | PHX | 4 |
| 675748 | 675748W | Frys | 660 | 56 | 12748 | 9043 W Olive Ave | Peoria | AZ | 85345 | PHX | 4 |
| 675768 | 675768W | Frys | 660 | 122 | 13084 | 10660 Grand Ave | Sun City | AZ | 85351 | PHX | 4 |
| 675754 | 675754W | Frys | 660 | 79 | 12866 | 2626 S 83rd Ave | Phoenix | AZ | 85043 | PHX | 4 |
| 675739 | 675739W | Frys | 660 | 87 | 12910 | 5140 W Baseline Rd | Laveen | AZ | 85339 | PHX | 4 |
| 675720 | 675720W | Frys | 660 | 66 | 12797 | 10675 W Indian School Rd | Avondale | AZ | 85392 | PHX | 4 |
| 675772 | 675772W | Central | 21 | 332 | 13962 | 10679 N Michigan Rd | Zionsville | IN | 46077 | IND | 5 |
| 675738 | 675738W | Frys | 660 | 676 | 5673 | 16380 W Yuma Rd | Goodyear | AZ | 85338 | PHX | 4 |
| 675740 | 675740W | Frys | 660 | 667 | 5664 | 13730 W Camelback Rd | Litchfield Park | AZ | 85340 | PHX | 4 |
| 675724 | 675724W | Frys | 660 | 692 | 5694 | 19600 W Indian School Rd | Buckeye | AZ | 85396 | PHX | 4 |
| 675730 | 675730W | Frys | 660 | 104 | 12994 | 201 N Switzer Canyon Dr | Flagstaff | AZ | 86001 | PHX | 4 |
| 675759 | 675759W | Frys | 660 | 77 | 12855 | 3198 Willow Creek Rd | Prescott | AZ | 86301 | PHX | 4 |
| 675760 | 675760W | Frys | 660 | 116 | 13053 | 950 Fair St | Prescott | AZ | 86305 | PHX | 4 |
| 675761 | 675761W | Frys | 660 | 63 | 12781 | 3100 N Glassford Hill Rd | Prescott Valley | AZ | 86314 | PHX | 4 |

### Operational Inventory Seed
| warehouse_id | sku_id | on_hand | allocated |
|---|---|---|---|
| 2 | 1 | 320 | 280 |
| 2 | 10 | 920 | 460 |
| 2 | 12 | 460 | 230 |
| 2 | 2 | 640 | 100 |
| 4 | 5 | 15 | 10 |
| 5 | 10 | 830 | 415 |
| 5 | 12 | 415 | 207 |

### Inventory Lot — Aging Example
| id | sku_id | warehouse_id | qty | received_date |
|---|---|---|---|---|
| 1 | 10 | 2 | 20 | 2025-11-10 |

### ASNs
| id | code | client_id | warehouse_id | status |
|---|---|---|---|---|
| 1 | ASN-001 | 1 | 2 | Scheduled |
| 2 | ASN-002 | 2 | 2 | Received |
| 3 | ASN-003 | 3 | 4 | In Transit |

### ASN Lines
| asn_id | sku_id | expected_qty |
|---|---|---|
| 1 | 1 | 200 |
| 2 | 10 | 80 |
| 3 | 5 | 10 |

### Receipts
| id | asn_id | status |
|---|---|---|
| 1 | 1 | Complete |
| 2 | 2 | Discrepancy |
| 3 | 3 | Pending |

### Receipt Lines
| receipt_id | sku_id | expected | received | discrepancy_type |
|---|---|---|---|---|
| 1 | 1 | 200 | 200 | null |
| 2 | 10 | 80 | 75 | Missing Item |
| 3 | 5 | 10 | 0 | null |

### Pallets
| id | code | warehouse_id | sku_id | qty | length | width | height | weight_lbs | shrink_wrapped |
|---|---|---|---|---|---|---|---|---|---|
| 1 | PAL-001 | 2 | 1 | 8 | 48 | 40 | 60 | 320 | true |
| 2 | PAL-002 | 2 | 1 | 8 | 48 | 40 | 60 | 320 | true |
| 3 | PAL-003 | 2 | 2 | 8 | 48 | 40 | 72 | 280 | true |
| 4 | PAL-004 | 4 | 5 | 1 | 48 | 48 | 54 | 410 | false |

### Orders
| id | code | client_id | warehouse_id | load_type | status |
|---|---|---|---|---|---|
| 1 | ORD-001 | 1 | 2 | Palletized | Complete |
| 2 | ORD-002 | 1 | 2 | Palletized | Partial |
| 3 | ORD-003 | 1 | 2 | Mixed | Allocated |
| 4 | ORD-004 | 2 | 2 | Floor-Loaded | Ready |
| 5 | ORD-005 | 3 | 4 | Palletized | At Risk |

### Order Lines
| order_id | sku_id | ordered | allocated | shipped |
|---|---|---|---|---|
| 1 | 1 | 40 | 40 | 40 |
| 2 | 1 | 100 | 40 | 0 |
| 3 | 1 | 24 | 24 | 0 |
| 3 | 2 | 16 | 16 | 0 |
| 4 | 10 | 40 | 40 | 0 |

### Shipments
| id | code | order_id | status |
|---|---|---|---|
| 1 | SHP-001 | 1 | Delivered |
| 2 | SHP-002 | 3 | In Transit |
| 3 | SHP-003 | 4 | Pending Pickup |

### Packages
| id | code | warehouse_id | asn_id | status | notes |
|---|---|---|---|---|---|
| 1 | PKG-001 | 2 | 1 | Received | null |
| 999 | PKG-999 | 2 | null | Quarantined | Unexpected inbound — unknown SKU, pending STC approval |

### Discrepancies
| id | type | source_ref | description | status |
|---|---|---|---|---|
| 1 | Receipt Shortage | RCPT-002 | 5 units short on SKU-BAR-KROG-001 | Open |

---

## CORE WORKFLOWS

### 1 — Inbound / ASN
- STC creates ASN: select client, warehouse, SKUs, expected quantities
- Warehouse receives: scans items (barcode or QR), records actual received qty per line
- Discrepancy types (structured dropdown, required if received ≠ expected): Box Crushed | Water Damage | Packaging Damage | Missing Item | Overage | Wrong Item | Other
- Optional notes field on each receipt line
- Inventory updates in real time on receipt confirmation
- Inventory is segregated by warehouse and project at all times

### 2 — Inventory
- Track: `on_hand`, `allocated`, `available` (= on_hand − allocated, computed at query time)
- Low-stock threshold: configurable per SKU — alert fires when `available` falls below threshold
- Aging threshold: configurable per project in days — alert fires when any InventoryLot exceeds age
- Full segregation by warehouse and project — no cross-project visibility

### 3 — Order Creation
- STC creates order: select client, project, warehouse, load type
- For retail rollout projects: optionally select store — `warehouse_id` auto-populates from store's `assigned_warehouse_id`
- Add order lines: SKU + ordered quantity
- Bulk order upload: CSV/Excel with configurable field mapping

### 4 — Pick / Pack
- Warehouse user opens order and begins picking
- **Palletized**: create named pallets (Pallet 1, 2…) → scan/assign SKUs and quantities → each pallet requires L × W × H (inches), weight (lbs), shrink wrap Y/N
- **Floor-loaded**: assign SKUs + quantities directly to order, no pallet structure
- **Mixed**: pallet section and floor section within the same order

### 5 — Order Completion (fires automatically when status → Ready)
Execute all of the following simultaneously:
1. Generate unique Order ID: format `STC-ORD-{YYYY}-{zero-padded sequence}`
2. Auto-generate PDF Pack List
3. Auto-generate PDF Bill of Lading
4. Send email to all configured STC notification recipients
5. Create dashboard alert: "Order {code} is ready for pickup at {warehouse stc_reference_name}"

**Pack List PDF structure:**
- Header: STC logo, Order ID, date, client, project, warehouse, store (if applicable)
- Section A — Palletized: table with pallet #, L×W×H, weight, shrink wrap status, SKU breakdown per pallet
- Section B — Floor Loaded: table with SKU code, description, qty
- Footer: total pallets, total pieces, total weight, dimensional weight summary (where dims available)

**BOL PDF structure:**
- Shipper block: warehouse `stc_reference_name` + full address
- Consignee block: store address (if store-scoped), otherwise STC placeholder
- STC Freight Number and Warehouse STC Number (from store record)
- Airport code (from store record)
- SKU table: code, description, qty, dims, actual weight, dim weight, chargeable weight
- Carrier / PRO number fields (blank — filled at pickup)
- Signature lines

### 6 — Shipment
Order Ready → BOL generated → warehouse confirms details → status = Pending Pickup → carrier pickup → status = In Transit → EDI 214 export available for TMS handoff

### 7 — Full Pallet Orders
Entire pallets ship as discrete tracked units without piece picking. Pallets are uniquely identified by pallet code and tracked through shipment.

### 8 — Parcel / Package Tracking
- **Expected**: linked to ASN, store FedEx/UPS tracking number, display live carrier status in app
- **Unexpected**: warehouse logs receipt → assigns to project → status = Quarantined → STC alert fires → STC approves (links to ASN/project) or rejects

### 9 — Dimensional Weight (STC users only)
- Formula: (L × W × H) ÷ Dimensional Factor
- Default factors: 194, 200, 250 — plus custom numeric input
- Chargeable weight = max(actual weight, dimensional weight)
- Applies per SKU where dims are populated — displayed on pack list and BOL
- Configurable globally in Admin Settings; overridable per project

### 10 — Airport Code Routing
- `airport_code` is stored on the Store record — derived from zip at seed/import time using the Air Cargo Index
- Zero-pad numeric zips to 5 digits before lookup (e.g. zip `501` → `00501`)
- `origin_wh_tag` stored as normalized airport code: `MEM`, `CMH`, or `LAX`
- Source tag `OH` normalizes to `CMH` on import — both map to WH-CMH-01
- Airport code appears on BOL and in EDI export
- Admin Settings includes a zip-to-airport lookup and per-store override utility

---

## DASHBOARD STRUCTURE

### Global Dashboard (STC)
Stat cards: Active Projects | Open Orders | Ready for Pickup | Low Stock Alerts | Aging Alerts | Open Discrepancies | Pending Package Approvals | ASNs In Transit

Activity feeds: Recent Receiving Events | Recent Shipments

Drill-down navigation: Global → Project → Warehouse → Order → Pallet

### Project Dashboard
Inventory health by SKU | Warehouse participation summary | Order pipeline by status | Shipment readiness

For retail rollout projects (e.g. PRJ-BAR-KROG): store progress grid filterable by region and origin warehouse — shows order status per store

### Warehouse View
Inventory table: SKU, on hand, allocated, available, status | Active orders | Receiving queue | Exceptions | Package activity | Store list with per-store order status

---

## PERMISSIONS

### STC Roles
| role | access |
|---|---|
| Executive | Full system — all warehouses, projects, clients, settings |
| Ops Manager | Full operational access scoped to assigned projects and warehouses |
| Coordinator | Assigned projects and warehouses — read/write operational data |
| Read Only | View only, scoped by assignment |

### Warehouse User
- Sees only: their warehouse, assigned projects, their inventory, their orders
- Cannot see: client names, other warehouses, financial or admin data
- Sees `stc_reference_name` only — never `company_name`

### Client User
- Sees only: their projects, inventory counts, order statuses
- Cannot see: warehouse contact info, company names, internal STC data, other clients
- Drill-down: My Projects → Warehouses (masked) → Inventory → Orders

---

## ADMIN SETTINGS
All settings persist in the database via `SystemSetting` key/value store and wire into actual app behavior. No placeholder-only screens.

| # | Module | What it does |
|---|---|---|
| 1 | User & Role Management | Create/edit/deactivate users; assign role, warehouse, project, client scope |
| 2 | Warehouse Management | Create/edit warehouse profiles; assign users and projects; control name visibility |
| 3 | Client Management | Create/edit clients; assign projects; configure client-visible data scope |
| 4 | Project Management | Create/edit projects; assign warehouses, clients, BOL templates, dim rules; upload/manage store lists with warehouse allocation for rollout projects |
| 5 | SKU Management | Bulk upload and edit SKUs; set dims and weight; configure low-stock and aging thresholds; assign to projects |
| 6 | Order Import Settings | Configure field mapping for bulk uploads; define required fields; manage import templates |
| 7 | Barcode / QR Settings | Select format (Code 128, QR, etc.); generate printable labels; define labeling conventions per project |
| 8 | Alert & Notification Settings | Configure email recipients per alert type; set thresholds for low stock, aging, discrepancy, unexpected packages |
| 9 | BOL / Document Templates | Create and edit PDF BOL and pack list templates; assign by project or warehouse |
| 10 | Dimensional Weight Settings | Set global dimensional factor; override per project; configure chargeable weight behavior |
| 11 | Integration Settings | Persisted config screens for EDI/TMS, QuickBooks, Outlook SMTP, FedEx API, UPS API — wired into service layers |
| 12 | ZIP / Airport Code Lookup | Search zip → airport code; view and override a store's airport code; bulk validate airport codes for a project's store list |

---

## AUTOMATIONS

### Event-Triggered (implement as server-side hooks on status change)
| trigger | actions |
|---|---|
| Order status → Ready | Generate BOL PDF + Pack List PDF + send email + create dashboard alert |
| Inventory available < low_stock_threshold | Create low-stock alert record + dashboard notification |
| InventoryLot age > aging_threshold_days | Create aging alert record + dashboard notification |
| Receipt: received ≠ expected | Create Discrepancy record + dashboard alert |
| Unexpected package logged | Create Quarantine record + STC approval alert |

### Manual / Scheduled
- On-demand report generation for any dashboard view
- Cron-ready report scheduling scaffold (structure only, not required to execute)

---

## INTEGRATION SERVICE LAYERS
Build production-ready service modules. External connections use placeholder credentials. Call structure must be complete and documented.

| file | purpose |
|---|---|
| `services/edi.ts` | Generate and export EDI 214 transaction sets; include airport code in output |
| `services/quickbooks.ts` | Invoice and billing sync hooks |
| `services/email.ts` | Nodemailer SMTP — used for all system outbound notifications |
| `services/fedex.ts` | FedEx tracking number status lookup |
| `services/ups.ts` | UPS tracking number status lookup |

---

## FOLDER STRUCTURE
```
/app
  /dashboard          Global dashboard
  /projects           Project list and project detail pages
  /warehouses         Warehouse views
  /orders             Order management and pick/pack workflow
  /inventory          Inventory views and lot tracking
  /receiving          ASN creation and inbound receipt workflow
  /shipments          Shipment management
  /packages           Parcel tracking
  /admin              All admin settings modules (STC only)
/components           Shared UI components
/lib                  Utilities, helpers, constants, Prisma client singleton
/prisma               schema.prisma + seed.ts + migrations
/services             EDI, email, QuickBooks, FedEx, UPS
/types                Shared TypeScript types and enums
/public               Static assets and STC logo placeholder
```

---

## DELIVERABLES — BUILD ALL OF THESE IN ORDER

1. **`CLAUDE.md`** — first file created before any code
2. **`.env.local.example`** — all environment variable keys with inline comments
3. **`prisma/schema.prisma`** — complete Postgres schema, dual-URL datasource, all entities and relations
4. **`prisma/seed.ts`** — seeds all data exactly as specified above; executable via `npx prisma db seed`
5. **Complete Next.js application** — every page, every workflow, every admin module
6. **`/services`** — all five integration service files
7. **`README.md`** — includes:
   - Prerequisites: Node 18+, Supabase project created, Vercel account, GitHub repo
   - Local setup: `git clone` → `npm install` → copy `.env.local.example` to `.env.local` and fill in Supabase connection strings → `npx prisma migrate dev` → `npx prisma db seed` → `npm run dev`
   - Deployment: push to GitHub → import repo to Vercel → add all environment variables in Vercel dashboard → Vercel auto-deploys on push to main
   - Migration workflow: `npx prisma migrate dev` for local development; `npx prisma migrate deploy` for production via Vercel build command or CI
   - Supabase connection note: `DATABASE_URL` uses the Transaction pooler (port 6543, `pgbouncer=true`) for all runtime queries on Vercel serverless; `DIRECT_URL` uses the direct connection (port 5432) for migrations only
