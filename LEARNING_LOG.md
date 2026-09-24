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


Yes. Replace your current Phase 1.6 section with the following detailed version in `LEARNING_LOG.md`.

Markdown

````
## Phase 1.6 — Completed Database Tables

Created the initial PostgreSQL schema for SeatVault.

The database contains the following tables:

1. users
2. venues
3. events
4. seats
5. event_seats
6. bookings
7. booking_seats
8. payments
9. tickets

---

## 1. How the Tables Were Created

We created the tables using PostgreSQL's `CREATE TABLE` command.

A table contains:

- Columns: define what information is stored.
- Data types: define what kind of value each column accepts.
- Primary key: uniquely identifies every row.
- Foreign key: connects one table to another.
- Constraints: prevent invalid data from entering the database.
- Default values: automatically insert values when none are provided.

Example:

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'buyer'
);
````

### Important SQL concepts used

#### BIGSERIAL

Automatically generates an increasing numeric ID.

Example:

```
1
2
3
4
```

#### PRIMARY KEY

Uniquely identifies each record.

For example, two users cannot have the same `id`.

#### NOT NULL

The column must contain a value.

For example, every user must have a name and email.

#### UNIQUE

Prevents duplicate values.

We used it for email because two users should not register with the same email address.

#### DEFAULT

Automatically provides a value when the user does not specify one.

Example:

SQL

```
role VARCHAR(20) DEFAULT 'buyer'
```

If no role is provided, the user becomes a buyer.

#### FOREIGN KEY

Connects a column to a primary key in another table.

This maintains referential integrity and prevents references to records that do not exist.

#### CHECK

Restricts values according to a condition.

Example:

SQL

```
CHECK (price >= 0)
```

This prevents negative ticket prices.

## 2. Relationship Between the Tables

SeatVault uses a relational database.

Instead of storing all information in one huge table, we divide information into multiple connected tables.

This avoids:

* Repeated data

* Inconsistent data

* Difficult updates

* Unnecessary duplication

The tables are connected using primary keys and foreign keys.

## 3. `users` Table

The `users` table stores all registered users.

Important columns:

* `id`: unique user ID

* `name`: user's name

* `email`: unique email address

* `password_hash`: securely hashed password

* `role`: buyer, organizer, or admin

Example:

|
id

|

name

|

email

|

role

|
| --- | --- | --- | --- |
|

1

|

Test Buyer

|

[buyer@seatvault.com](mailto:buyer@seatvault.com)

|

buyer

|

This table is referenced by other tables such as `venues`, `events`, and `bookings`.

## 4. `venues` Table

The `venues` table stores information about locations where events happen.

Important columns:

* `id`: unique venue ID

* `name`: venue name

* `address`: venue address

* `city`: venue city

* `capacity`: maximum number of seats

* `created_by`: user who created the venue

The `created_by` column is a foreign key referencing `users(id)`.

Relationship:

```
One user can create multiple venues.
```

This is a one-to-many relationship:

```
users (1) ──────── (many) venues
```

Example:

```
User #1
 ├── SeatVault Arena
 ├── Mumbai Stadium
 └── City Convention Hall
```

## 5. `events` Table

The `events` table stores information about events organized at venues.

Important columns:

* `id`: unique event ID

* `venue_id`: venue where the event takes place

* `name`: event name

* `description`: event details

* `event_date`: date and time of the event

* `status`: draft, published, cancelled, or completed

* `created_by`: organizer who created the event

Foreign keys:

```
events.venue_id → venues.id
events.created_by → users.id
```

Relationships:

### One venue can host many events

```
venues (1) ──────── (many) events
```

Example:

```
SeatVault Arena
 ├── Mumbai Music Night
 ├── Comedy Show
 └── Tech Conference
```

### One user can create many events

```
users (1) ──────── (many) events
```

## 6. `seats` Table

The `seats` table represents the permanent physical seats inside a venue.

It answers:

> What physical seats exist in this venue?

Important columns:

* `id`: unique seat ID

* `venue_id`: venue to which the seat belongs

* `section`: section name

* `row_label`: row identifier

* `seat_number`: seat number

* `seat_type`: regular, premium, or VIP

Example:

|
id

|

venue_id

|

section

|

row

|

seat number

|
| --- | --- | --- | --- | --- |
|

1

|

1

|

A

|

1

|

1

|
|

2

|

1

|

A

|

1

|

2

|
|

3

|

1

|

A

|

1

|

3

|
|

6

|

1

|

B

|

1

|

1

|

Relationship:

```
One venue can contain many physical seats.

venues (1) ──────── (many) seats
```

The same physical seat can be used for multiple events hosted at that venue.

## 7. `event_seats` Table

The `event_seats` table connects a specific event with a specific physical seat.

It answers:

> What is the price and availability of this seat for this particular event?

Important columns:

* `id`: unique event-seat record ID

* `event_id`: event

* `seat_id`: physical seat

* `price`: price for this event

* `status`: available, held, booked, or blocked

Foreign keys:

```
event_seats.event_id → events.id
event_seats.seat_id → seats.id
```

Relationships:

```
events (1) ──────── (many) event_seats
seats  (1) ──────── (many) event_seats
```

This table acts as a connection between events and physical seats.

### Why is this table necessary?

The same physical seat can have different prices and statuses for different events.

Example:

|
Event

|

Seat

|

Price

|

Status

|
| --- | --- | --- | --- |
|

Mumbai Music Night

|

A1

|

₹499

|

available

|
|

Comedy Show

|

A1

|

₹299

|

booked

|
|

Rock Concert

|

A1

|

₹999

|

available

|

The physical seat remains the same, but its event-specific details change.

This is an example of an event-specific inventory system.

The constraint:

SQL

```
UNIQUE (event_id, seat_id)
```

ensures that the same physical seat cannot be added twice for the same event.

## 8. `bookings` Table

The `bookings` table represents a user's booking attempt or reservation.

Important columns:

* `id`: unique booking ID

* `user_id`: user making the booking

* `event_id`: event being booked

* `total_amount`: total booking amount

* `status`: pending, confirmed, expired, cancelled, or refunded

* `expires_at`: time until which a pending booking remains valid

Foreign keys:

```
bookings.user_id → users.id
bookings.event_id → events.id
```

Relationships:

### One user can make many bookings

```
users (1) ──────── (many) bookings
```

### One event can have many bookings

```
events (1) ──────── (many) bookings
```

Example:

```
Mohammad
 ├── Booking #1 for Mumbai Music Night
 ├── Booking #2 for Comedy Show
 └── Booking #3 for Rock Concert
```

### Booking lifecycle

```
pending
   ├──→ confirmed
   ├──→ expired
   └──→ cancelled
```

* `pending`: booking created but payment is incomplete

* `confirmed`: payment succeeded

* `expired`: payment window ended

* `cancelled`: booking was cancelled

* `refunded`: payment was returned

## 9. `booking_seats` Table

The `booking_seats` table stores the individual seats included in a booking.

A single booking can contain multiple seats.

For example:

```
Booking #1
 ├── Seat A1
 ├── Seat A2
 └── Seat B1
```

Instead of storing multiple seat IDs in one column, we create separate rows.

Example:

|
id

|

booking_id

|

event_seat_id

|

price_at_booking

|
| --- | --- | --- | --- |
|

1

|

1

|

1

|

₹499

|
|

2

|

1

|

2

|

₹499

|
|

3

|

1

|

6

|

₹799

|

Foreign keys:

```
booking_seats.booking_id → bookings.id
booking_seats.event_seat_id → event_seats.id
```

Relationships:

```
bookings (1) ──────── (many) booking_seats
event_seats (1) ──────── (many) booking_seats
```

This table connects bookings and event-specific seats.

### Why `price_at_booking`?

Suppose:

```
Seat A1 price when booked = ₹499
```

Later, the organizer changes the price to ₹699.

The original customer should still be charged ₹499.

Therefore, `price_at_booking` stores a snapshot of the price at the time of booking.

This preserves historical pricing information.

## 10. `payments` Table

The `payments` table stores payment-related information for a booking.

Important columns:

* `id`: unique payment ID

* `booking_id`: related booking

* `amount`: amount paid

* `payment_method`: card, UPI, etc.

* `status`: pending, successful, failed, or refunded

* `transaction_id`: unique payment-provider reference

Foreign key:

```
payments.booking_id → bookings.id
```

Relationship:

```
bookings (1) ──────── (many) payments
```

A booking may have multiple payment attempts.

For example:

```
Booking #1
 ├── Payment attempt 1 → failed
 └── Payment attempt 2 → successful
```

The `transaction_id` is marked as `UNIQUE` to prevent the same payment transaction from being recorded more than once.

## 11. `tickets` Table

The `tickets` table stores proof of a successful booking.

A ticket is generated after payment succeeds and the booking becomes confirmed.

Important columns:

* `id`: unique ticket ID

* `booking_id`: related booking

* `ticket_code`: unique ticket reference

* `qr_code_data`: information used to generate or validate a QR code

* `status`: valid, used, or cancelled

* `issued_at`: ticket generation time

Foreign key:

```
tickets.booking_id → bookings.id
```

Relationship:

```
bookings (1) ──────── (1) tickets
```

We used:

SQL

```
booking_id BIGINT NOT NULL UNIQUE
```

This means one booking can have only one ticket record in our current design.

Ticket lifecycle:

```
valid
  ├──→ used
  └──→ cancelled
```

* `valid`: ticket can be used

* `used`: ticket has been scanned at entry

* `cancelled`: ticket is no longer valid

## 12. Complete Relationship Diagram

```
users
 ├── venues
 │     ├── seats
 │     └── events
 │            └── event_seats
 │                   └── booking_seats
 │                          └── bookings
 │                                 ├── payments
 │                                 └── tickets
 │
 ├── events
 └── bookings
```

A more relationship-focused view:

```
users
  │
  ├──< venues
  │      │
  │      └──< seats
  │
  ├──< events >── venues
  │      │
  │      └──< event_seats >── seats
  │                         │
  │                         └──< booking_seats >── bookings
  │                                                   │
  │                                                   ├──< payments
  │                                                   └── tickets
  │
  └──< bookings
```

Legend:

```
──< means one-to-many
```

## 13. Complete Booking Flow

A typical SeatVault booking works like this:

1. A user registers in the `users` table.

2. An organizer creates a venue in `venues`.

3. Physical seats are created in `seats`.

4. An event is created in `events`.

5. Seats are made available for that event in `event_seats`.

6. A buyer selects seats.

7. A booking is created in `bookings` with status `pending`.

8. Selected seats are inserted into `booking_seats`.

9. A payment attempt is recorded in `payments`.

10. If payment succeeds:

```
*   Booking becomes `confirmed`.
```

```
*   Event seats become `booked`.
    
*   A ticket is created in `tickets`.
    
```

11.  If payment fails or the hold expires:

```
*   Booking becomes `expired` or `cancelled`.
    
*   Seats become available again.
    
```

## 14. Main Concepts Learned

### Primary keys

Used to uniquely identify records.

### Foreign keys

Used to connect related tables.

### One-to-many relationships

Examples:

* One user can create many events.

* One venue can contain many seats.

* One booking can contain many booking-seat records.

### Event-specific inventory

`event_seats` allows the same physical seat to have different prices and statuses for different events.

### Price snapshotting

`price_at_booking` preserves the price that applied when the customer booked.

### Constraints

Constraints prevent invalid data, such as:

* Duplicate emails

* Negative prices

* Invalid statuses

* Duplicate event-seat mappings

* References to non-existent users or events

### Normalization

Data is divided into related tables to reduce duplication and improve consistency.

### Booking and payment separation

A booking represents the reservation, while a payment represents the financial transaction.

### Ticket generation

A ticket is generated after a booking is successfully confirmed.

````
After updating the file, commit it with:

```bash
git add LEARNING_LOG.md
git commit -m "docs: explain database tables and relationships"
git push
````
