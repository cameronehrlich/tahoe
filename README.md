# Tahoe

A shared vacation property management app. Families and friend groups use it to coordinate reservations, set recurring holds, manage waitlists, and communicate about their shared properties.

## Prerequisites

You need **Node.js** installed on your Mac. If you don't have it, open Terminal and run:

```bash
# Install Homebrew (if you don't have it)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node
```

## Getting Started

```bash
# Clone the repo
git clone https://github.com/cameronehrlich/tahoe.git
cd tahoe

# Install dependencies
npm install

# Create the local database and seed it with sample data
npx prisma migrate dev
npm run db:seed

# Start the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Switching Users

The app ships with three sample users: **Sarah Mitchell** (admin), **Jake Mitchell**, and **Emma Rodriguez**. Use the user switcher in the top-right corner to log in as any of them — no passwords required in development.

## Project Structure

| Directory | Purpose |
|-----------|---------|
| `src/app/api/` | API routes (Next.js App Router) |
| `src/app/property/` | Property detail pages (calendar, requests, settings, etc.) |
| `src/components/` | Shared React components |
| `src/lib/` | Utilities and database client |
| `prisma/` | Database schema, migrations, and seed data |

## Tech Stack

- **Next.js 16** with App Router
- **Prisma 7** ORM with SQLite (local) / Turso (production)
- **Tailwind CSS** + **shadcn/ui** components
- Deployed on **Vercel**

## Useful Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run db:seed` | Seed the database with sample data |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:reset` | Reset the database and re-seed |
