## Phase 1.4–1.5 — Database Design

### Completed

- Selected PostgreSQL as the primary database.
- Identified the core SeatVault entities.
- Defined relationships between users, venues, seats, events, and bookings.
- Designed the booking lifecycle.
- Introduced the event_seats table.
- Distinguished physical seats from event-specific seat inventory.
- Documented the double-booking prevention requirement.

### Key Understanding

A physical seat belongs to a venue, but its availability is specific
to an event.

Therefore:

- `seats` represents physical seats.
- `event_seats` represents seats for a particular event.
- `booking_seats` represents seats selected in a booking.

Temporary holds and confirmed bookings will use the same bookings table
with different booking statuses.

### Important Design Decision

PostgreSQL will remain the source of truth for confirmed bookings.
Redis will support temporary holds and expiration handling later.

