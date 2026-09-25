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



Absolutely. Since you want to commit this checkpoint, I’d make the learning log capture **everything we actually did**, not just a list of commands. I’ll also keep the distinction between concepts you already knew from Job Board and the genuinely new PostgreSQL work.

You can add the following to `LEARNING_LOG.md`.

````md
# SeatVault — Learning Log

## Project Overview

**Project:** SeatVault  
**Type:** Event Ticket Booking & Reservation Platform  
**Backend-first project**

SeatVault is being built to learn backend concepts that were not fully covered in the Job Board project, especially:

- PostgreSQL and relational database design
- SQL queries and relationships
- Transactions
- Concurrency and race conditions
- Row-level locking
- Redis TTL-based seat holds
- Background jobs with BullMQ
- Payment webhooks and idempotency
- Docker
- Load/performance testing
- Observability and deployment

The main business problem is:

> Multiple users should never be able to successfully book the same physical seat for the same event.

PostgreSQL will be the **source of truth** for bookings and seat inventory.

---

# Phase 1 — Requirements & Database Architecture

## 1.1 Project Goal

SeatVault allows users to:

1. Browse events
2. View available seats
3. Temporarily hold seats
4. Complete payment
5. Receive confirmed tickets
6. View booking history
7. Cancel/refund bookings where applicable

The system also supports organizers and admins.

### Main roles

- `buyer`
- `organizer`
- `admin`

---

# 1.2 Database Architecture

SeatVault uses PostgreSQL as the primary relational database.

The main tables are:

```text
users
venues
seats
events
event_seats
bookings
booking_seats
payments
tickets
````

### High-level relationship

```text
users
  │
  ├──────────────┐
  │              │
  ▼              ▼
venues         events
  │              │
  ▼              ▼
seats       event_seats
               │
               ▼
          booking_seats
               │
               ▼
            bookings
               │
               ├──────────► payments
               │
               └──────────► tickets
```

---

# 1.3 Important Database Design Decision

We separated:

```text
seats
```

from:

```text
event_seats
```

### `seats`

Represents a permanent physical seat inside a venue.

Example:

```text
Venue: SeatVault Arena
Section: A
Row: 1
Seat: 5
```

This physical seat exists regardless of which event is happening.

### `event_seats`

Represents that physical seat for a **specific event**.

It stores information such as:

* event
* physical seat
* price
* availability status

Example:

```text
Event: Mumbai Music Night
Seat: A-1-5
Price: ₹499
Status: available
```

The same physical seat can therefore have:

```text
Event A → ₹499
Event B → ₹799
```

This separation is important because price and availability belong to the **event-specific inventory**, not permanently to the physical seat.

---

# Phase 1.4 — PostgreSQL Setup

## PostgreSQL installation

PostgreSQL 16 was installed using Homebrew.

PostgreSQL was started successfully.

Database created:

```text
seatvault_dev
```

PostgreSQL is running on:

```text
localhost:5432
```

The database was accessed using `psql`.

---

# Phase 1.5 — Database Tables Created

## 1. `users`

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'buyer',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Purpose

Stores users of SeatVault.

Important constraints:

* `PRIMARY KEY` on `id`
* `NOT NULL` on required fields
* `UNIQUE` on email
* default role is `buyer`
* timestamps are automatically generated

A test user was inserted:

```text
id: 1
name: Test Buyer
email: buyer@seatvault.com
role: buyer
```

---

# 2. `venues`

```sql
CREATE TABLE venues (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_venues_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
);
```

### Purpose

Stores physical locations where events take place.

Relationship:

```text
users → venues
```

The `created_by` column references the user who created the venue.

---

# 3. `events`

```sql
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    venue_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    event_date TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_events_venue
        FOREIGN KEY (venue_id)
        REFERENCES venues(id),

    CONSTRAINT fk_events_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id),

    CONSTRAINT chk_events_status
        CHECK (
            status IN (
                'draft',
                'published',
                'cancelled',
                'completed'
            )
        )
);
```

### Purpose

Represents an actual event.

An event belongs to:

* one venue
* one creator

Example:

```text
Mumbai Music Night
Venue: SeatVault Arena
Date: 20 Dec 2026
Status: draft
```

---

# 4. `seats`

```sql
CREATE TABLE seats (
    id BIGSERIAL PRIMARY KEY,
    venue_id BIGINT NOT NULL,
    section VARCHAR(50) NOT NULL,
    row_label VARCHAR(20) NOT NULL,
    seat_number INTEGER NOT NULL CHECK (seat_number > 0),
    seat_type VARCHAR(20) NOT NULL DEFAULT 'regular',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_seats_venue
        FOREIGN KEY (venue_id)
        REFERENCES venues(id),

    CONSTRAINT chk_seats_type
        CHECK (seat_type IN ('regular', 'premium', 'vip')),

    CONSTRAINT unique_seat_position
        UNIQUE (venue_id, section, row_label, seat_number)
);
```

### Purpose

Stores permanent physical seats belonging to a venue.

Seat types:

```text
regular
premium
vip
```

The combination:

```text
venue_id
section
row_label
seat_number
```

must be unique.

---

# 5. `event_seats`

```sql
CREATE TABLE event_seats (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    seat_id BIGINT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_event_seats_event
        FOREIGN KEY (event_id)
        REFERENCES events(id),

    CONSTRAINT fk_event_seats_seat
        FOREIGN KEY (seat_id)
        REFERENCES seats(id),

    CONSTRAINT chk_event_seats_status
        CHECK (
            status IN (
                'available',
                'held',
                'booked',
                'blocked'
            )
        ),

    CONSTRAINT unique_event_seat
        UNIQUE (event_id, seat_id)
);
```

### Purpose

Connects a physical seat to a specific event.

Stores:

* event
* physical seat
* price
* current status

Possible statuses:

```text
available
held
booked
blocked
```

The same physical seat can therefore have different information for different events.

---

# 6. `bookings`

```sql
CREATE TABLE bookings (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,
    event_id BIGINT NOT NULL,

    total_amount NUMERIC(10, 2) NOT NULL
        CHECK (total_amount >= 0),

    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    expires_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bookings_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_bookings_event
        FOREIGN KEY (event_id)
        REFERENCES events(id),

    CONSTRAINT chk_bookings_status
        CHECK (
            status IN (
                'pending',
                'confirmed',
                'expired',
                'cancelled',
                'refunded'
            )
        )
);
```

### Purpose

Represents a user's reservation/booking.

Booking lifecycle:

```text
pending
   ↓
confirmed
```

or:

```text
pending
   ↓
expired
```

or:

```text
pending
   ↓
cancelled
```

A confirmed booking can later potentially become:

```text
refunded
```

---

# 7. `booking_seats`

```sql
CREATE TABLE booking_seats (
    id BIGSERIAL PRIMARY KEY,

    booking_id BIGINT NOT NULL,
    event_seat_id BIGINT NOT NULL,

    price_at_booking NUMERIC(10, 2) NOT NULL
        CHECK (price_at_booking >= 0),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_booking_seats_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_booking_seats_event_seat
        FOREIGN KEY (event_seat_id)
        REFERENCES event_seats(id),

    CONSTRAINT unique_booking_event_seat
        UNIQUE (booking_id, event_seat_id)
);
```

### Purpose

Connects bookings to the seats selected by the user.

A booking can contain multiple seats.

Example:

```text
Booking #10
    ├── Seat A1
    ├── Seat A2
    └── Seat A3
```

Therefore we need multiple rows in `booking_seats`.

### `price_at_booking`

Stores the price at the time of booking.

This is a price snapshot.

If the event seat price later changes, the historical booking price remains unchanged.

---

# 8. `payments`

```sql
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,

    booking_id BIGINT NOT NULL,

    amount NUMERIC(10, 2) NOT NULL
        CHECK (amount >= 0),

    payment_method VARCHAR(30),

    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    transaction_id VARCHAR(255) UNIQUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payments_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(id),

    CONSTRAINT chk_payments_status
        CHECK (
            status IN (
                'pending',
                'successful',
                'failed',
                'refunded'
            )
        )
);
```

### Purpose

Stores payment attempts associated with bookings.

Payment states:

```text
pending
successful
failed
refunded
```

`transaction_id` is unique so the same external transaction ID cannot be stored multiple times.

---

# 9. `tickets`

```sql
CREATE TABLE tickets (
    id BIGSERIAL PRIMARY KEY,

    booking_id BIGINT NOT NULL UNIQUE,

    ticket_code VARCHAR(100) NOT NULL UNIQUE,

    qr_code_data TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'valid',

    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_tickets_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(id),

    CONSTRAINT chk_tickets_status
        CHECK (
            status IN (
                'valid',
                'used',
                'cancelled'
            )
        )
);
```

### Purpose

Represents the ticket generated after a successful booking.

Ticket states:

```text
valid
used
cancelled
```

Current design:

```text
one booking → one ticket
```

---

# Phase 1.6 — Important PostgreSQL Concepts Learned

## Primary Key

Example:

```sql
id BIGSERIAL PRIMARY KEY
```

A primary key uniquely identifies a row.

---

## Foreign Key

Example:

```sql
FOREIGN KEY (venue_id)
REFERENCES venues(id)
```

This creates a relationship between tables.

For example:

```text
events.venue_id
       ↓
venues.id
```

---

## NOT NULL

```sql
name VARCHAR(100) NOT NULL
```

The column cannot contain `NULL`.

---

## UNIQUE

```sql
email VARCHAR(255) UNIQUE
```

Prevents duplicate values.

---

## CHECK

Example:

```sql
CHECK (capacity > 0)
```

The database itself rejects invalid values.

---

## DEFAULT

Example:

```sql
role VARCHAR(20) DEFAULT 'buyer'
```

If the application doesn't provide a role, PostgreSQL automatically uses:

```text
buyer
```

---

# Phase 2 — Node.js + Express + PostgreSQL

## 2.1 Backend Initialization

Backend location:

```text
seatvault/backend
```

Node.js project initialized with:

```bash
npm init -y
```

Packages installed:

```bash
npm install express pg dotenv
```

Development dependency:

```bash
npm install -D nodemon
```

### Package responsibilities

| Package   | Purpose                                          |
| --------- | ------------------------------------------------ |
| `express` | HTTP server and API routing                      |
| `pg`      | PostgreSQL driver for Node.js                    |
| `dotenv`  | Environment variables                            |
| `nodemon` | Automatically restarts server during development |

---

# 2.2 Backend Structure

Current structure:

```text
backend/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── health.controller.js
│   │   └── user.controller.js
│   └── routes/
│       ├── health.routes.js
│       └── user.routes.js
├── .env
├── .gitignore
└── package.json
```

---

# 2.3 Environment Variables

`.env` contains:

```env
PORT=3000

DB_USER=saimashaikh
DB_HOST=localhost
DB_NAME=seatvault_dev
DB_PASSWORD=
DB_PORT=5432
```

The `.env` file is ignored by Git:

```gitignore
node_modules/
.env
```

This prevents database credentials from being committed to GitHub.

---

# 2.4 Express Application

`src/app.js` contains the Express application.

Current basic structure:

```javascript
const express = require("express");
const healthRoutes = require("./routes/health.routes");
const userRoutes = require("./routes/user.routes");

const app = express();

app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Welcome to SeatVault API",
    });
});

module.exports = app;
```

### Important concept: `app.use()`

```javascript
app.use("/api/users", userRoutes);
```

means:

> Mount the routes contained inside `userRoutes` under `/api/users`.

For example:

```javascript
router.get("/", getUsers);
```

combined with:

```javascript
app.use("/api/users", userRoutes);
```

becomes:

```text
GET /api/users
```

---

# 2.5 Server Startup

`src/server.js`:

```javascript
const app = require("./app");
const { connectDB } = require("./config/db");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`SeatVault server running on port ${PORT}`);
    });
};

startServer();
```

### Startup flow

```text
npm run dev
     ↓
startServer()
     ↓
connectDB()
     ↓
PostgreSQL available?
     ↓
    YES
     ↓
Start Express server
```

If PostgreSQL is unavailable, the application exits instead of starting an API that cannot access its required database.

---

# 2.6 PostgreSQL Connection Pool

`src/config/db.js`:

```javascript
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const connectDB = async () => {
    try {
        await pool.query("SELECT NOW()");
        console.log("PostgreSQL connected");
    } catch (error) {
        console.error("PostgreSQL connection failed:", error.message);
        process.exit(1);
    }
};

module.exports = { pool, connectDB };
```

### What is a Pool?

`Pool` manages PostgreSQL database connections for the application.

Instead of manually opening a completely new connection for every request, the application can use connections from the pool.

Conceptually:

```text
Express
   ↓
PostgreSQL Pool
   ↓
PostgreSQL
```

---

# 2.7 Database Connection Test

The following SQL was used:

```sql
SELECT NOW();
```

The application successfully returned:

```text
PostgreSQL connected:
{ now: 2026-09-25T05:42:21.035Z }
```

This confirmed that:

```text
Node.js → pg → PostgreSQL
```

was working successfully.

---

# 2.8 Port

Port `5000` was initially tested but returned `403`.

The backend was moved to:

```text
3000
```

and worked successfully.

Current SeatVault backend:

```text
http://localhost:3000
```

PostgreSQL:

```text
localhost:5432
```

---

# Phase 2.9 — First Database Health API

Created:

```text
src/controllers/health.controller.js
src/routes/health.routes.js
```

Endpoint:

```http
GET /api/health/db
```

Controller executes:

```sql
SELECT current_database();
```

Response:

```json
{
    "message": "Database connection is working",
    "database": "seatvault_dev"
}
```

### Complete flow

```text
Postman
   ↓
GET /api/health/db
   ↓
health.routes.js
   ↓
health.controller.js
   ↓
pool.query()
   ↓
PostgreSQL
   ↓
seatvault_dev
   ↓
JSON response
```

This was the first complete:

```text
Route → Controller → PostgreSQL → Response
```

flow in SeatVault.

---

# Phase 2.10 — First Real User API

Created:

```text
src/controllers/user.controller.js
src/routes/user.routes.js
```

Endpoint:

```http
GET /api/users
```

Initial SQL:

```sql
SELECT * FROM users;
```

This successfully returned the user records.

---

# 2.11 Explicit Column Selection

The query was improved from:

```sql
SELECT * FROM users;
```

to:

```sql
SELECT id, name, email, role
FROM users;
```

### Why?

The database contains:

```text
password_hash
```

and other internal fields.

The API should not blindly expose every database column.

Current response:

```json
{
    "users": [
        {
            "id": "1",
            "name": "Test Buyer",
            "email": "buyer@seatvault.com",
            "role": "buyer"
        }
    ]
}
```

### Lesson

`SELECT *` means all columns.

Explicitly selecting columns makes the API response more controlled.

---

# Phase 2.12 — Fetch One User

Endpoint:

```http
GET /api/users/:id
```

Example:

```http
GET /api/users/1
```

SQL:

```sql
SELECT id, name, email, role
FROM users
WHERE id = $1;
```

Controller:

```javascript
const { id } = req.params;

const result = await pool.query(
    "SELECT id, name, email, role FROM users WHERE id = $1",
    [id]
);
```

### Route parameter

For:

```text
GET /api/users/1
```

Express provides:

```javascript
req.params.id
```

which contains:

```text
"1"
```

---

# 2.13 Parameterized Queries

Instead of directly inserting user input into SQL:

```javascript
// Do not do this
`SELECT * FROM users WHERE id = ${id}`
```

we use:

```sql
WHERE id = $1
```

and pass:

```javascript
[id]
```

separately.

This is called a **parameterized query**.

It is an important defense against SQL injection.

---

# 2.14 Handling 404 — User Not Found

If PostgreSQL returns no rows:

```javascript
result.rows.length === 0
```

the API returns:

```http
404 Not Found
```

with:

```json
{
    "message": "User not found"
}
```

Tested using:

```http
GET /api/users/999
```

The response worked correctly.

---

# Phase 2.15 — Creating a User

Endpoint:

```http
POST /api/users
```

Request body:

```json
{
    "name": "Alice",
    "email": "alice@seatvault.com",
    "password_hash": "temporary_hash",
    "role": "buyer"
}
```

SQL:

```sql
INSERT INTO users (name, email, password_hash, role)
VALUES ($1, $2, $3, $4)
RETURNING id, name, email, role;
```

Values:

```javascript
[name, email, password_hash, role]
```

The API returns the newly created user without exposing `password_hash`.

Example response:

```json
{
    "user": {
        "id": "3",
        "name": "Alice",
        "email": "alice@seatvault.com",
        "role": "buyer"
    }
}
```

---

# 2.16 PostgreSQL `RETURNING`

PostgreSQL supports:

```sql
RETURNING
```

which allows us to get information about the row that was just inserted.

Example:

```sql
INSERT INTO users (...)
VALUES (...)
RETURNING id, name, email, role;
```

This means we don't need to perform a separate `SELECT` just to retrieve the newly created user's information.

---

# 2.17 Why the User ID Became 3

The `users.id` column uses:

```sql
BIGSERIAL PRIMARY KEY
```

`BIGSERIAL` uses an automatically managed PostgreSQL sequence.

Conceptually:

```text
1 → 2 → 3 → 4 → 5 → ...
```

The sequence is not intended to be a perfect count of currently existing rows.

For example:

```text
Insert → id 1
Insert → id 2
Delete id 2
Insert → id 3
```

The new row can therefore receive `id = 3`.

IDs are identifiers, not necessarily continuous numbering.

We should not reset the sequence just because there are gaps.

---

# Phase 2.18 — Postman Testing

SeatVault API testing is being done using **Postman**.

Current tested endpoints:

### Health

```http
GET /api/health/db
```

### Users

```http
GET /api/users
GET /api/users/:id
POST /api/users
```

Successful tests have been completed for:

* Database connection
* Fetching all users
* Fetching one user
* User not found
* Creating a user

---

# Current Architecture

At this stage the application follows:

```text
                 Postman
                    │
                    ▼
                 Express
                    │
              ┌─────┴─────┐
              ▼           ▼
           Routes       Middleware
              │
              ▼
          Controllers
              │
              ▼
         PostgreSQL Pool
              │
              ▼
          PostgreSQL
```

The project will later evolve toward:

```text
Route
  ↓
Middleware
  ↓
Controller
  ↓
Service
  ↓
Database / Redis / External Services
```

The service layer will become particularly important when we implement booking and concurrency logic.

---

# Important Concepts Learned So Far

## PostgreSQL

* Database creation
* Tables
* Primary keys
* Foreign keys
* Constraints
* `NOT NULL`
* `UNIQUE`
* `CHECK`
* `DEFAULT`
* `BIGSERIAL`
* Relational table design

## SQL

* `SELECT`
* `SELECT *`
* Selecting specific columns
* `WHERE`
* `INSERT`
* `RETURNING`
* Parameterized queries
* Reading `result.rows`

## Express

* Express application
* Routes
* Routers
* `app.use()`
* Route parameters
* Controllers
* JSON middleware

## Node.js + PostgreSQL

* `pg`
* PostgreSQL connection pool
* `pool.query()`
* Database startup checks
* Environment variables
* `.env`
* `.gitignore`

## API behavior

* HTTP `200`
* HTTP `201`
* HTTP `404`
* JSON responses
* Postman API testing

---

# What We Have NOT Learned Yet

The following are intentionally left for later:

* PostgreSQL joins in application code
* `UPDATE`
* `DELETE`
* SQL aggregation
* `GROUP BY`
* `HAVING`
* Indexes
* Transactions
* Isolation levels
* Row-level locking
* `FOR UPDATE`
* `SKIP LOCKED`
* Race conditions
* Redis
* TTL-based seat holds
* BullMQ
* Payment webhooks
* Idempotency
* Docker
* Load testing
* Deployment
* Observability

These will be learned when they become necessary for SeatVault.

---

# Important Learning Strategy

We do NOT need to memorize the entire database schema before implementing the application.

The approach is:

```text
Understand the business problem
        ↓
Identify the tables involved
        ↓
Learn the SQL needed
        ↓
Implement the feature
        ↓
Test it with Postman
        ↓
Handle edge cases
        ↓
Record the learning
```

For example, when implementing booking:

```text
bookings
   ↓
booking_seats
   ↓
event_seats
```

will be studied deeply at that point.

When implementing payments:

```text
bookings
   ↓
payments
   ↓
tickets
```

will be studied.

This avoids trying to memorize the entire database upfront.

---

# Next Planned Step

Continue building the PostgreSQL-backed APIs.

The next SQL concepts will be introduced gradually through the application rather than as isolated theory.

The immediate CRUD progression is:

```text
CREATE → INSERT       ✅
READ   → SELECT       ✅
UPDATE → UPDATE       ⏳
DELETE → DELETE       ⏳
```

After basic CRUD, we will move into the more important SeatVault-specific topics:

```text
Relationships
     ↓
JOINs
     ↓
Transactions
     ↓
Concurrency
     ↓
Row-level locking
     ↓
Redis seat holds
```

The most important learning goal of SeatVault is not simply building CRUD APIs.

It is understanding how a backend maintains **correctness when many users try to book the same seat at the same time**.

````

### Commit this checkpoint

After replacing/updating your `LEARNING_LOG.md`:

```bash
git add LEARNING_LOG.md
````

Then:

```bash
git commit -m "docs: update learning log for PostgreSQL backend setup"
```

And push:

```bash
git push
```

Once that's pushed, **we'll continue from the next step rather than revisiting these PostgreSQL basics**.
