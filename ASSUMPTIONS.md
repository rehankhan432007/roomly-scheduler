# Part 4 Assumptions & Decisions

## 1. Domain Modeling
- **Location Timezones**: We assume all times in the backend are handled in UTC, and the frontend/bot converts them based on the `timezone` field in the location record.
- **RoomBot State**: We store the conversation state as JSON in `chat_sessions`. We assume a finite state machine for slot filling (AWAITING_ATTENDEES, AWAITING_TIME, etc.) rather than purely relying on an LLM to manage state, as this is more deterministic and robust.
- **NLP Parsing**: We used a combination of Regex and `chrono-node` for the NLP parser. While an LLM could be plugged in via the `llm` config, the regex approach works instantly and deterministically for the core required intents (Book a room for X people tomorrow at Y PM).
- **Check-in Window**: We assume check-ins open 10 minutes before the meeting and close 15 minutes after the start. This is configurable via env vars (`CHECKIN_OPEN_BEFORE_MIN` and `DEFAULT_CHECKIN_GRACE_MIN`), but rooms can override their grace period.

## 2. Shared Package
- The `@meetmaze/shared` package is treated as the source of truth for types, DTOs, interfaces, and ID seeds.
- Since we are Part 4, we declared all interfaces for services we don't own (Rooms, Bookings, Search) based on our needs. Parts 1-3 will need to implement these interfaces when we merge.

## 3. Fake Data / Dev Stubs
- Since we cannot test our Experience features without Rooms or Bookings, we created `_dev-stubs/` that implement the `RoomsService`, `BookingService`, and `SearchService`. 
- These stubs return the exact 6 rooms from the contract and allow us to simulate holdings, confirmations, and check-ins.
- The `export-part.mjs` script purposefully ignores `apps/api/src/_dev-stubs/` because they should not be sent to the main device.

## 4. Notifications & Background Jobs
- Notifications are currently polled every 30s by the frontend. In a real-world scenario, this would likely use Server-Sent Events (SSE) or WebSockets, but polling is simpler for this decoupled architecture.
- Background jobs run via `setInterval` within the Express app. We assume there is only one instance of the API server running, or that it doesn't matter if multiple instances send the same notification (idempotency). In a distributed setup, we would need a job queue like BullMQ or Redis locks.

## 5. Bayesian Ranking
- We use a Bayesian average to rank rooms, pulling the prior mean to 7.0 and weight to 3 reviews. This prevents a new room with a single 10/10 review from ranking higher than an established room with fifty 9/10 reviews.
- The stats are recomputed nightly, but individual room stats are recomputed instantly when a new review is added or an issue is resolved.
