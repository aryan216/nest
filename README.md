# NestVerify

A mobile-first marketplace for physically verified homes. The first live city is Lucknow. Buyers do not pay brokerage, and buyer phone numbers are stored only for the NestVerify desk.

This app uses **Next.js (App Router) and MongoDB with Mongoose**. The brand name and live city live in one file so they can be renamed without hunting through the UI.

## Rename the brand or city

Edit `src/config/brand.ts`:

- `name` is the public brand. The placeholder is `NestVerify`.
- `city` and `citySlug` are the only live market. The placeholder is Lucknow / `lucknow`.
- `comingSoonCities` are shown as coming soon. They are not described as live.

After changing the city, run the seed again so the database matches the config.

## Setup

1. Install and start MongoDB locally on port 27017.
2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Install, seed, and run:

```bash
npm install
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Sign-in

Sign-in uses email and password. Hardcoded test accounts:

| Email | Password | Role |
| --- | --- | --- |
| partner@nestverify.test | partner123 | Partner |
| admin@nestverify.test | admin123 | Admin |
| test@nestverify.test | test123 | Buyer |

Google sign-in is enabled only when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set. Enquiry OTP still uses `/api/otp` when configured.

## Environment

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Mongo connection string |
| `MONGODB_DB` | Database name, default `nestverify` |
| `NEXTAUTH_SECRET` | Session and OTP signing secret |
| `NEXTAUTH_URL` | Public site origin used by NextAuth |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for SEO |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp click-to-chat number |
| `STORAGE_DRIVER` | `local` (default), `s3`, `cloudinary`, or `imagekit` |
| `OTP_WEBHOOK_URL` | Optional webhook that receives OTP codes in production |

S3 and Cloudinary variables are listed in `.env.example`. For ImageKit set `IMAGEKIT_URL_ENDPOINT` and `IMAGEKIT_PRIVATE_KEY`. Local uploads go to `public/uploads`.

## What the seed creates

- 1 live city and 3 coming-soon cities
- 8 Lucknow localities
- 40 verified listings with unique photo sets, consistent titles, slugs, areas and prices
- Extra queue items: one unrealistic 4 BHK, one normal pending row house, and a shared photo so the quality panel has something to show
- Sample stories, clearly labeled as samples
- Staff users and a sample partner application

Photos are downloaded from [Lorem Picsum](https://picsum.photos) into `public/media/seed`. Re-running the seed wipes and recreates this database.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run seed
```

## Folder map

```text
src/config/brand.ts          brand, city, contact
src/config/catalog.ts        property types, budgets, labels
src/models/index.ts          Mongoose models
src/services/                queries and writes (UI never talks to Mongo)
src/actions/market.ts        validated server actions
src/app/api/                 auth, OTP, saved homes, enquiry export
src/components/              header, cards, search, forms
src/app/                     routes
```

Public pages only render listings with status `VERIFIED`. Home counts, locality cards and category chips are derived from that same verified set. Titles and slugs are generated from property type, BHK and locality through `src/lib/listing-identity.ts`.

Buyer phone numbers are stored on enquiries and are returned only from the staff enquiry screens and the CSV export.
