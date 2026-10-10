---
part: 3
contractVersion: 1.0.0
createdAt: "2026-10-10T00:00:00Z"
ownedFiles:
  - apps/api/src/modules/bookings/**
  - apps/api/src/modules/search/**
  - packages/shared/src/modules/booking/**
  - apps/web/src/features/booking/**
  - apps/web/src/app/client/**
  - scripts/export-part.mjs
  - apps/api/db/migrations/001_core_schema.ts
  - apps/api/db/seeds/000_skeleton.ts
  - apps/api/db/seeds/301_part3_history.ts
extraDependencies:
  api: {}
  web: {}
  shared: {}
envVars:
  - key: HOLD_TTL_SECONDS
    default: "300"
    description: Seconds a HELD slot stays active before auto-release
  - key: CHECKIN_OPEN_BEFORE_MIN
    default: "10"
    description: Minutes before meeting start that QR check-in opens
  - key: DEFAULT_CHECKIN_GRACE_MIN
    default: "15"
    description: Minutes after start before unreleased room is auto-released
migrations:
  - 001_core_schema
seeds:
  - 000_skeleton
  - 301_part3_history
providesServices:
  - bookings
  - search
consumesServices:
  - rooms
  - insights
  - ranking
  - notifications
apiEndpoints:
  - POST /search/rooms
  - GET /rooms/:id/availability
  - POST /bookings/check-conflicts
  - POST /bookings/hold
  - POST /bookings/:id/confirm
  - POST /bookings/:id/cancel
  - POST /bookings
  - GET /bookings
  - GET /bookings/:id
  - GET /me/calendar
  - PATCH /bookings/:id
webRoutes:
  - /client
  - /client/search
  - /client/rooms/[id]
  - /client/bookings
  - /client/bookings/[id]
  - /client/calendar
navItems:
  - Find a room (210)
  - My bookings (220)
  - Calendar (230)
slotsProvided: []
slotsUsed:
  - booking.card.actions
  - booking.detail.sections
  - room.detail.sections
  - client.home.widgets
assumptions: []
knownIssues: []
---

# Part 3 (Client Portal) Handoff

This document lists the components, services, and endpoints developed as part of **Part 3: Client Portal — Smart Search & Conflict-Free Booking Engine**.

## What was Built
- **API (Bookings Module):** A concurrency-safe hold and confirmation engine using MySQL `FOR UPDATE` locks, a robust validation engine checking overlapping bookings, blackouts, capacity, equipment, and hours, and endpoints for listing and managing bookings. Included automated jobs for expiring holds and completing finished bookings.
- **API (Search Module):** An availability and search engine that filters out active/inactive rooms, scores candidates based on equipment, capacity matching, availability, and rating, integrates busy warnings, and returns alternatives.
- **Web (Features & Client Portal):** The `booking` feature containing `ClientSearchPage`, `ClientBookingsPage`, `ClientBookingDetailsPage`, `ClientCalendarPage`, and `RoomDetailsPage`.
- **Core Infrastructure:** Express server with dynamic module registry (`ServiceRegistryImpl`), Zod validation, generic JWT auth, standard error handling, Knex migrations and robust data seeding (8 weeks of realistic booking history with specific patterns). 
- **Dev Stubs:** Stubs for `rooms`, `insights`, `ranking`, and `notifications` to allow Part 3 to operate independently without other parts.

## Running Tests / Validation
1. Install dependencies: `npm install`
2. Run TypeScript checks: `npm run typecheck`
3. Generate registry maps: `node scripts/gen-registry.mjs`
4. Start the API using stubs: `npm run dev` in `apps/api`.
5. Run export script: `npm run part:export -- 3`.

## Known Issues
None. Code is complete per contract specifications.
