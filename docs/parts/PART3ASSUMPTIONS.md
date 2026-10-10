# Part 3 Assumptions

1. **Authentication:** We assume the presence of a JWT-based authentication system. Since the full auth service might be in another part, a basic auth stub was included in `_dev-stubs` to allow testing.
2. **Date and Timezones:** Room searches are performed in local timezone provided by the room's location configuration. Bookings are stored in UTC strings for MySQL `DATETIME` fields as standard practice.
3. **Capacity Matching:** We consider a room a perfect match if its capacity is exactly or slightly above attendee count (up to 1.4x). Larger rooms incur a matching penalty to optimize space utilization.
4. **Dev Stubs:** Provided dev stubs return static high-confidence responses for testing. 
5. **Conflict Resolution:** For overlapping slots, the search system will suggest the nearest available slot (up to ±3h offset).
