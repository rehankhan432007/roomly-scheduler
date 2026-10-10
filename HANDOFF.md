# Part 4 Handoff (Experience & Intelligence)

## Features Included
- **RoomBot (`apps/api/src/modules/roombot`)**: AI booking agent with dialog state manager and NLP parsing.
- **Insights (`apps/api/src/modules/insights`)**: Location heatmap, busy-slot warnings.
- **Reviews (`apps/api/src/modules/reviews`)**: Public/Owner review endpoints, issue reporting, equipment flagging.
- **Ranking (`apps/api/src/modules/ranking`)**: Bayesian recalculations, utilization tracking.
- **Check-in (`apps/api/src/modules/checkin`)**: QR scanning rules, auto-release jobs.
- **Notifications (`apps/api/src/modules/notifications`)**: Review requests, check-in reminders.

## Testing Locally
Because Part 4 depends on Parts 1-3, I created Dev Stubs in `apps/api/src/_dev-stubs/` (Rooms, Bookings, Search, Auth). 
1. Fix your Node `PATH` and run `npm install`.
2. Ensure you have MySQL running and create a `.env` file with `DATABASE_URL`.
3. Run `npm run dev` in `apps/api`.
4. The dev server will automatically load the stubs and you can hit all the Part 4 endpoints without needing the other parts!

## Exporting for Main Device (Part 1)
When you're ready to share this with the Main Device (Part 1), run:
```bash
node scripts/export-part.mjs
```
This will run the bundler and create a `part-4-export.json` file in the root directory containing all the files matched by the `ownership.json` globs for Part 4.
