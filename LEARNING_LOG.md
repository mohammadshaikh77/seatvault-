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


Ah yes — you mean **only the learning-log entries since the last learning-log commit**, not a rewrite of the entire project.

Based on what we did after that commit, the new material is:

1. `INNER JOIN` in the SeatVault API
2. Joining `events`, `event_seats`, and `seats`
3. Filtering available seats
4. Building `GET /api/events/:eventId/seats`
5. PostgreSQL transactions: `BEGIN`, `COMMIT`, `ROLLBACK`
6. Why transactions need a dedicated `client`
7. Row-level locking with `SELECT ... FOR UPDATE`
8. Observing lock blocking with two PostgreSQL sessions
9. Implementing the first transaction-based seat hold API
10. Testing the race-condition protection through Postman
11. Understanding why an uncommitted transaction can make another request wait
12. Verifying the resulting `event_seats` state

Here is the **only new section** you should append to `LEARNING_LOG.md`:

````md
# Learning Log — SeatVault

## New Learning Checkpoint — JOINs, Transactions, Row Locks & Seat Holds

### Date
25 September 2026

---

# 1. PostgreSQL JOINs in the SeatVault Domain

Before implementing the seat availability API, I learned how PostgreSQL JOINs allow related data to be retrieved from multiple relational tables.

SeatVault uses separate tables for:

- `events`
- `seats`
- `event_seats`

The relationship is:

```text
events
   │
   │ event_id
   ▼
event_seats
   │
   │ seat_id
   ▼
seats
````

`event_seats` connects a particular event with a physical seat.

---

## 1.1 Joining Events and Venues

Example:

```sql
SELECT
    events.name AS event_name,
    venues.name AS venue_name,
    venues.city
FROM events
JOIN venues
    ON events.venue_id = venues.id;
```

This combines information from the `events` and `venues` tables.

The important part is:

```sql
ON events.venue_id = venues.id
```

The JOIN follows the foreign-key relationship between the two tables.

---

## 1.2 Joining Event Seats and Physical Seats

Example:

```sql
SELECT
    event_seats.id,
    seats.section,
    seats.row_label,
    seats.seat_number
FROM event_seats
JOIN seats
    ON event_seats.seat_id = seats.id;
```

This allows the application to convert an `event_seats.seat_id` into meaningful physical seat information such as:

```text
Section A
Row 1
Seat 1
```

---

## 1.3 Three-Table JOIN

I then used three related tables together:

```sql
SELECT
    events.name AS event_name,
    seats.section,
    seats.row_label,
    seats.seat_number,
    event_seats.price,
    event_seats.status
FROM event_seats
JOIN events
    ON event_seats.event_id = events.id
JOIN seats
    ON event_seats.seat_id = seats.id;
```

This produces a useful representation of the event's seat inventory.

The data comes from different tables:

```text
events
→ event name

seats
→ physical seat location

event_seats
→ event-specific price and availability status
```

This demonstrates an important relational database concept:

> Data does not need to be duplicated across tables. Related information can be combined when querying using JOINs.

---

# 2. Filtering Joined Data

I learned that JOINs can be combined with `WHERE`.

For example:

```sql
SELECT
    events.name AS event_name,
    seats.section,
    seats.row_label,
    seats.seat_number,
    event_seats.price,
    event_seats.status
FROM event_seats
JOIN events
    ON event_seats.event_id = events.id
JOIN seats
    ON event_seats.seat_id = seats.id
WHERE event_seats.event_id = $1
  AND event_seats.status = 'available';
```

The query:

1. Finds event seats belonging to the requested event.
2. Joins them with the event information.
3. Joins them with physical seat information.
4. Keeps only seats whose status is `available`.

---

# 3. Seat Availability API

I implemented:

```http
GET /api/events/:eventId/seats
```

Example:

```http
GET /api/events/1/seats
```

The route is:

```js
router.get("/:eventId/seats", getAvailableSeats);
```

The controller uses the PostgreSQL JOIN query to retrieve available seats.

Current controller logic:

```js
const getAvailableSeats = async (req, res) => {
    const { eventId } = req.params;

    const result = await pool.query(
        `SELECT
            events.name AS event_name,
            seats.section,
            seats.row_label,
            seats.seat_number,
            event_seats.price,
            event_seats.status
         FROM event_seats
         JOIN events
            ON event_seats.event_id = events.id
         JOIN seats
            ON event_seats.seat_id = seats.id
         WHERE event_seats.event_id = $1
           AND event_seats.status = 'available'`,
        [eventId]
    );

    res.json({
        event: result.rows.length > 0
            ? result.rows[0].event_name
            : null,
        availableSeats: result.rows,
    });
};
```

Testing through Postman returned the available seats for:

```text
Mumbai Music Night
```

The API correctly returned the seven available seats before a seat was held.

---

# 4. Important New Concept — Database Transactions

The next major concept was PostgreSQL transactions.

A transaction groups multiple database operations into one logical unit.

The basic structure is:

```sql
BEGIN;

-- database operations

COMMIT;
```

If something goes wrong:

```sql
ROLLBACK;
```

---

## 4.1 BEGIN

```sql
BEGIN;
```

starts a transaction.

Operations performed after `BEGIN` belong to that transaction until either:

```sql
COMMIT;
```

or:

```sql
ROLLBACK;
```

is executed.

---

## 4.2 COMMIT

```sql
COMMIT;
```

permanently saves the changes made during the transaction.

Example:

```sql
BEGIN;

UPDATE event_seats
SET status = 'booked'
WHERE id = 1;

COMMIT;
```

The update becomes permanent.

---

## 4.3 ROLLBACK

```sql
ROLLBACK;
```

undoes the changes made during the current transaction.

I tested this manually:

```sql
BEGIN;

UPDATE event_seats
SET status = 'booked'
WHERE id = 1;

ROLLBACK;
```

After the rollback, the seat returned to:

```text
available
```

This demonstrated that changes made inside a transaction can be undone before the transaction is committed.

---

# 5. Why Transactions Matter for Seat Booking

A booking operation involves multiple database operations.

For example:

```text
Create booking
     ↓
Add seats to booking
     ↓
Change seat status
     ↓
Create payment
     ↓
Confirm booking
```

If one operation fails, we do not want only some of the changes to remain.

For example:

```text
Create booking       ✅
Add booking seat     ✅
Update seat          ❌
```

Without a transaction, the database could be left in an inconsistent state.

Transactions allow related operations to succeed or fail together.

---

# 6. Concurrency Problem — Double Booking

The most important problem in SeatVault is concurrent booking.

Suppose Seat 1 is:

```text
status = available
```

Two users request the same seat at approximately the same time.

A naive implementation could behave like:

```text
User A → check seat → available

User B → check seat → available

User A → book seat

User B → book seat
```

Both users may observe the seat as available before either one updates it.

This creates the possibility of:

```text
Seat 1
  ↓
Booking A
Booking B
```

This is a double-booking problem.

SeatVault needs database-level concurrency control to prevent this.

---

# 7. Row-Level Locking with SELECT FOR UPDATE

I learned:

```sql
SELECT ...
FOR UPDATE;
```

`FOR UPDATE` places a row-level lock on the selected rows.

Example:

```sql
SELECT id, status
FROM event_seats
WHERE id = 1
FOR UPDATE;
```

This means the selected row is locked for the duration of the transaction.

The lock is released when the transaction finishes with:

```sql
COMMIT;
```

or:

```sql
ROLLBACK;
```

---

# 8. Practical Row-Lock Experiment

I tested row locking using two separate PostgreSQL sessions.

### Terminal A

```sql
BEGIN;

SELECT id, status
FROM event_seats
WHERE id = 1
FOR UPDATE;
```

Seat 1 became locked by Terminal A.

### Terminal B

```sql
BEGIN;

SELECT id, status
FROM event_seats
WHERE id = 1
FOR UPDATE;
```

Terminal B did not immediately receive the row.

It waited because Terminal A was holding the row lock.

Conceptually:

```text
Terminal A
    ↓
FOR UPDATE
    ↓
Seat 1 🔒
```

while:

```text
Terminal B
    ↓
FOR UPDATE
    ↓
WAITING
```

After Terminal A executed:

```sql
COMMIT;
```

the lock was released and Terminal B could continue.

This demonstrated row-level locking practically rather than only theoretically.

---

# 9. Important Understanding of Row Locks

`FOR UPDATE` does not lock the entire `event_seats` table.

If:

```sql
WHERE id = 1
FOR UPDATE;
```

is used, the relevant row is locked.

Conceptually:

```text
Seat 1 → 🔒 locked
Seat 2 → available for other transactions
Seat 3 → available for other transactions
Seat 4 → available for other transactions
```

This allows different users to work with different seats concurrently.

---

# 10. PostgreSQL Transactions in Node.js

For a multi-step transaction in Node.js, I learned that a dedicated PostgreSQL client should be obtained from the connection pool.

Example:

```js
const client = await pool.connect();
```

Then all operations belonging to the transaction should use that same client:

```js
await client.query("BEGIN");

await client.query(...);

await client.query(...);

await client.query("COMMIT");
```

The basic pattern is:

```js
const client = await pool.connect();

try {
    await client.query("BEGIN");

    // transaction operations

    await client.query("COMMIT");
} catch (error) {
    await client.query("ROLLBACK");
    throw error;
} finally {
    client.release();
}
```

---

# 11. Why pool.connect() Is Used

A transaction needs to remain on the same PostgreSQL connection.

Therefore, instead of doing:

```js
pool.query("BEGIN");
pool.query("...");
pool.query("COMMIT");
```

for a transaction, we use:

```js
const client = await pool.connect();
```

and then:

```js
client.query(...)
```

for every operation inside that transaction.

At the end:

```js
client.release();
```

returns the connection to the pool.

---

# 12. First Seat Hold Transaction

I implemented the first transaction-based seat-holding operation.

Endpoint:

```http
POST /api/events/:eventId/seats/:eventSeatId/hold
```

Example:

```http
POST /api/events/1/seats/1/hold
```

The controller follows this flow:

```text
BEGIN
  ↓
SELECT seat FOR UPDATE
  ↓
Check whether seat exists
  ↓
Check whether status is available
  ↓
UPDATE status → held
  ↓
COMMIT
```

Implementation:

```js
const holdSeat = async (req, res) => {
    const { eventSeatId } = req.params;

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const result = await client.query(
            `SELECT id, status, price
             FROM event_seats
             WHERE id = $1
             FOR UPDATE`,
            [eventSeatId]
        );

        if (result.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Seat not found",
            });
        }

        const seat = result.rows[0];

        if (seat.status !== "available") {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message: "Seat is not available",
            });
        }

        await client.query(
            `UPDATE event_seats
             SET status = 'held',
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [eventSeatId]
        );

        await client.query("COMMIT");

        res.json({
            message: "Seat held successfully",
            seat: {
                id: seat.id,
                price: seat.price,
                status: "held",
            },
        });

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
};
```

---

# 13. Why FOR UPDATE Is Used Before the Status Check

The important sequence is:

```sql
SELECT id, status, price
FROM event_seats
WHERE id = $1
FOR UPDATE;
```

followed by:

```js
if (seat.status !== "available") {
    ...
}
```

The row is locked before we make the decision to modify it.

This prevents another transaction from simultaneously modifying the same seat while our transaction is deciding whether it can be held.

---

# 14. Why the Client Does Not Send the Price

The request only contains the seat identifier:

```text
eventSeatId
```

The server retrieves the actual price from PostgreSQL:

```sql
SELECT id, status, price
FROM event_seats
WHERE id = $1
FOR UPDATE;
```

The client should not be trusted to provide the price.

For example, we do not allow the client to send:

```json
{
    "price": 1
}
```

for a seat that actually costs:

```text
499.00
```

The database remains the source of truth for the seat price.

---

# 15. Testing the Seat Hold API

Using Postman:

```http
POST http://localhost:3000/api/events/1/seats/1/hold
```

The first request returned:

```json
{
    "message": "Seat held successfully",
    "seat": {
        "id": "1",
        "price": "499.00",
        "status": "held"
    }
}
```

The second attempt to hold the same seat returned:

```json
{
    "message": "Seat is not available"
}
```

with HTTP status:

```text
409 Conflict
```

This demonstrated that the database state changed from:

```text
available
```

to:

```text
held
```

and subsequent attempts were rejected.

---

# 16. Debugging a Hanging Request

During testing, the Postman request initially kept loading.

The reason was related to the row-lock experiment performed earlier.

A PostgreSQL transaction that has acquired a `FOR UPDATE` lock can continue holding that lock until the transaction ends.

If the transaction is left open:

```text
BEGIN
   ↓
FOR UPDATE
   ↓
lock remains active
```

another transaction attempting:

```sql
FOR UPDATE
```

on the same row can wait.

The issue was resolved by ending the old PostgreSQL transactions with:

```sql
ROLLBACK;
```

This was an important practical demonstration of why transactions must always be properly completed.

---

# 17. Verifying the Database State

After the Postman request, I inspected the complete `event_seats` table:

```sql
SELECT
    id,
    event_id,
    seat_id,
    price,
    status,
    created_at,
    updated_at
FROM event_seats
ORDER BY id;
```

The important result was:

```text
id | event_id | seat_id | price  | status
---+----------+---------+--------+-----------
1  |    1     |    1    | 499.00 | held
2  |    1     |    2    | 499.00 | available
3  |    1     |    3    | 499.00 | available
4  |    1     |    4    | 499.00 | available
5  |    1     |    5    | 499.00 | available
6  |    1     |    6    | 799.00 | available
7  |    1     |    7    | 799.00 | available
```

This confirmed that the Postman request successfully changed Seat 1 from:

```text
available → held
```

---

# 18. Current Understanding

At this point, I understand the difference between a simple database update and a concurrency-safe operation.

Simple approach:

```text
Check seat
   ↓
Update seat
```

Concurrency-safe approach:

```text
BEGIN
   ↓
SELECT ... FOR UPDATE
   ↓
Check status
   ↓
Update seat
   ↓
COMMIT
```

The second approach allows PostgreSQL to coordinate concurrent requests trying to modify the same seat.

---

# 19. Important Limitation of the Current Implementation

The current `held` state is permanent unless another operation changes it.

Currently:

```text
available
   ↓
held
```

There is no expiration mechanism yet.

In a real ticket-booking flow, a temporary hold should eventually work like:

```text
available
    ↓
held temporarily
    ↓
payment successful
    ↓
booked
```

or:

```text
available
    ↓
held temporarily
    ↓
payment abandoned / timeout
    ↓
available
```

This will later lead to the Redis TTL-based hold system.

However, Redis will be introduced after the database booking transaction is properly implemented.

---

# 20. Next Learning Step

The next step is to replace the current experimental seat hold with a proper booking transaction involving:

```text
bookings
booking_seats
event_seats
```

The transaction will eventually perform operations such as:

```text
BEGIN
   ↓
Lock selected event seat(s)
   ↓
Verify availability
   ↓
Create booking
   ↓
Create booking_seats rows
   ↓
Update event_seats
   ↓
COMMIT
```

This will be the first complete relational transaction in SeatVault.

````

### Commit this checkpoint

After updating `LEARNING_LOG.md`:

```bash
git status
````


Yes. This time I’ll give you **only everything learned/done AFTER the previous learning-log commit** — starting from the JOIN/API work through the complete booking transaction and concurrency experiment.

You can **append this directly** to `LEARNING_LOG.md`.

````md
# Learning Log — SeatVault

## New Learning Checkpoint — Seat Availability, Booking Transactions & Concurrency

### Date
26 September 2026

---

# 1. Seat Availability API Using SQL JOINs

After completing the basic PostgreSQL and backend setup, I connected the relational database design to an actual SeatVault API.

The goal was to allow a client to request:

```http
GET /api/events/:eventId/seats
````

Example:

```http
GET /api/events/1/seats
```

The API returns the seats that are currently available for a particular event.

---

## 1.1 Tables involved

The query uses three tables:

```text
events
   │
   │ event_id
   ▼
event_seats
   │
   │ seat_id
   ▼
seats
```

### `events`

Contains event-level information such as:

* event name
* venue
* event date
* status

### `seats`

Contains permanent physical seat information:

* section
* row
* seat number
* seat type

### `event_seats`

Connects a physical seat to a particular event and stores:

* event-specific price
* event-specific status

---

# 2. Three-Table JOIN

The seat availability query:

```sql
SELECT
    events.name AS event_name,
    seats.section,
    seats.row_label,
    seats.seat_number,
    event_seats.price,
    event_seats.status
FROM event_seats
JOIN events
    ON event_seats.event_id = events.id
JOIN seats
    ON event_seats.seat_id = seats.id
WHERE event_seats.event_id = $1
  AND event_seats.status = 'available';
```

This query combines:

```text
events
    ↓
event name

seats
    ↓
physical seat location

event_seats
    ↓
event-specific price and availability
```

The result for `Mumbai Music Night` initially contained seven available seats.

---

# 3. Seat Availability Controller

Created:

```text
backend/src/controllers/event.controller.js
```

with:

```js
const getAvailableSeats = async (req, res) => {
    const { eventId } = req.params;

    const result = await pool.query(
        `SELECT
            events.name AS event_name,
            seats.section,
            seats.row_label,
            seats.seat_number,
            event_seats.price,
            event_seats.status
         FROM event_seats
         JOIN events
            ON event_seats.event_id = events.id
         JOIN seats
            ON event_seats.seat_id = seats.id
         WHERE event_seats.event_id = $1
           AND event_seats.status = 'available'`,
        [eventId]
    );

    res.json({
        event: result.rows.length > 0
            ? result.rows[0].event_name
            : null,
        availableSeats: result.rows,
    });
};
```

---

# 4. Seat Availability Route

Created:

```text
backend/src/routes/event.routes.js
```

with:

```js
router.get("/:eventId/seats", getAvailableSeats);
```

Registered in `app.js`:

```js
app.use("/api/events", eventRoutes);
```

The endpoint:

```http
GET /api/events/1/seats
```

was successfully tested in Postman.

---

# 5. PostgreSQL Transactions

The next major concept was database transactions.

A transaction groups multiple database operations into one logical unit.

Basic structure:

```sql
BEGIN;

-- database operations

COMMIT;
```

If something goes wrong:

```sql
ROLLBACK;
```

---

## 5.1 BEGIN

```sql
BEGIN;
```

starts a transaction.

---

## 5.2 COMMIT

```sql
COMMIT;
```

permanently saves changes made inside the transaction.

---

## 5.3 ROLLBACK

```sql
ROLLBACK;
```

undoes changes made during the current transaction.

---

# 6. Transaction Experiment

Tested manually in PostgreSQL:

```sql
BEGIN;

UPDATE event_seats
SET status = 'booked'
WHERE id = 1;

ROLLBACK;
```

The seat temporarily became:

```text
booked
```

but after:

```sql
ROLLBACK;
```

it returned to:

```text
available
```

This demonstrated that database changes can be grouped into a transaction and reverted if the transaction is not committed.

---

# 7. Why Transactions Are Required for Booking

A booking consists of multiple related database operations.

Eventually a booking involves operations such as:

```text
Create booking
      ↓
Create booking_seats
      ↓
Update event_seats
      ↓
Payment
      ↓
Confirmation
```

We do not want a partially completed booking.

For example:

```text
Create booking       ✅
Create booking_seats  ✅
Update event_seats   ❌
```

A transaction allows the entire operation to be rolled back.

Conceptually:

```text
BEGIN
   ↓
Operation 1
   ↓
Operation 2
   ↓
Operation 3
   ↓
COMMIT
```

or:

```text
BEGIN
   ↓
Operation 1
   ↓
Operation 2
   ↓
ERROR
   ↓
ROLLBACK
```

---

# 8. Dedicated PostgreSQL Client for Transactions

For a transaction in Node.js, a dedicated PostgreSQL client is obtained from the connection pool:

```js
const client = await pool.connect();
```

The same client must be used for all queries belonging to the transaction.

Basic pattern:

```js
const client = await pool.connect();

try {
    await client.query("BEGIN");

    // transaction queries

    await client.query("COMMIT");
} catch (error) {
    await client.query("ROLLBACK");
    throw error;
} finally {
    client.release();
}
```

---

## Why not use `pool.query()` for every transaction query?

A transaction must remain on the same PostgreSQL connection.

Therefore:

```text
pool
  ↓
client
  ↓
BEGIN
  ↓
SELECT
  ↓
INSERT
  ↓
UPDATE
  ↓
COMMIT
```

All transaction operations use the same `client`.

Afterward:

```js
client.release();
```

returns the connection to the pool.

---

# 9. Row-Level Locking

The main concurrency problem in SeatVault is preventing two users from booking the same seat.

A naive approach could be:

```text
User A → check seat → available
User B → check seat → available
User A → book
User B → book
```

This creates a double-booking possibility.

---

## 9.1 SELECT FOR UPDATE

PostgreSQL provides row-level locking:

```sql
SELECT *
FROM event_seats
WHERE id = 1
FOR UPDATE;
```

`FOR UPDATE` locks the selected row until the current transaction finishes.

The lock is released when:

```sql
COMMIT;
```

or:

```sql
ROLLBACK;
```

is executed.

---

# 10. Practical Row-Lock Experiment

Used two PostgreSQL sessions.

### Session A

```sql
BEGIN;

SELECT id, status
FROM event_seats
WHERE id = 1
FOR UPDATE;
```

Session A acquired the lock.

Conceptually:

```text
Seat 1 🔒
```

### Session B

```sql
BEGIN;

SELECT id, status
FROM event_seats
WHERE id = 1
FOR UPDATE;
```

Session B waited because Session A already held the row lock.

Conceptually:

```text
Session A
    ↓
FOR UPDATE
    ↓
Seat 1 🔒

Session B
    ↓
FOR UPDATE
    ↓
WAITING
```

After Session A executed:

```sql
COMMIT;
```

the lock was released and Session B continued.

This demonstrated PostgreSQL row-level locking practically.

---

# 11. Important Row-Locking Concept

`FOR UPDATE` does not lock the entire table.

For example:

```sql
SELECT *
FROM event_seats
WHERE id = 1
FOR UPDATE;
```

locks the relevant row.

Other seats can still be processed by other transactions.

Conceptually:

```text
Seat 1 → 🔒
Seat 2 → available
Seat 3 → available
Seat 4 → available
```

This makes row-level locking suitable for seat booking.

---

# 12. Initial Seat Hold Experiment

Before implementing complete bookings, created a simple endpoint:

```http
POST /api/events/:eventId/seats/:eventSeatId/hold
```

Example:

```http
POST /api/events/1/seats/1/hold
```

The transaction performed:

```text
BEGIN
   ↓
SELECT seat FOR UPDATE
   ↓
Check status
   ↓
UPDATE status → held
   ↓
COMMIT
```

The first request successfully changed:

```text
available → held
```

A second request for the same seat returned:

```json
{
    "message": "Seat is not available"
}
```

with HTTP status:

```text
409 Conflict
```

---

# 13. Debugging a Hanging Postman Request

During the seat-hold test, the Postman request initially remained in a loading state.

The reason was an existing PostgreSQL transaction that was still holding a row lock from the previous `FOR UPDATE` experiment.

An uncommitted transaction can continue holding its row lock.

Conceptually:

```text
BEGIN
   ↓
FOR UPDATE
   ↓
lock remains
   ↓
another transaction tries FOR UPDATE
   ↓
WAIT
```

The old transactions were ended using:

```sql
ROLLBACK;
```

After releasing the lock, the Postman request completed normally.

This demonstrated an important practical lesson:

> Transactions must always be properly completed with `COMMIT` or `ROLLBACK`.

---

# 14. Moving From Seat Holds to Real Bookings

The temporary `holdSeat` experiment only changed:

```text
event_seats.status
```

It did not create a booking.

The real booking flow needs:

```text
bookings
      ↓
booking_seats
      ↓
event_seats
```

For example:

```text
Booking #3
user_id = 1
event_id = 1
total_amount = 998
status = pending
```

with:

```text
booking_seats

booking_id | event_seat_id | price_at_booking
-----------+---------------+-----------------
3          | 2             | 499
3          | 3             | 499
```

---

# 15. API Design Decision — `seatIds` vs `eventSeatIds`

Initially the booking API was designed to accept:

```json
{
    "userId": 1,
    "eventSeatIds": [2, 3]
}
```

However, we identified an important conceptual distinction.

The user thinks in terms of:

```text
"I want Seat 2 and Seat 3."
```

The user does not need to know about the internal `event_seats` table.

Therefore the API was changed to accept:

```json
{
    "userId": 1,
    "seatIds": [2, 3]
}
```

---

# 16. Difference Between `seats.id` and `event_seats.id`

This distinction is important.

## `seats.id`

Identifies the physical seat.

Example:

```text
Seat #1
Seat #2
Seat #3
```

The same physical seat can be used for different events.

---

## `event_seats.id`

Identifies the event-specific inventory record.

Example:

```text
Event 1 + Seat 1 → event_seats.id = 1

Event 2 + Seat 1 → event_seats.id = 4
```

Both records can have:

```text
seat_id = 1
```

but they represent different event inventory.

---

# 17. Why the API Uses `seatIds`

The API now uses:

```json
{
    "seatIds": [2, 3]
}
```

The URL already identifies the event:

```http
POST /api/events/1/bookings
```

Therefore the backend has:

```text
event_id = 1
seat_ids = [2, 3]
```

The backend can resolve those physical seat IDs to the corresponding `event_seats` records.

This keeps the external API conceptually simple for the client.

---

# 18. Multi-Seat Booking Query

The booking controller now retrieves the requested seats using:

```sql
SELECT id, seat_id, price, status
FROM event_seats
WHERE event_id = $1
  AND seat_id = ANY($2)
ORDER BY seat_id
FOR UPDATE;
```

Parameters:

```js
[eventId, sortedSeatIds]
```

Here:

```text
$1 → event ID
$2 → array of physical seat IDs
```

---

# 19. Why `ANY($2)` Is Used

The user can select multiple seats:

```js
seatIds = [2, 3, 4];
```

Instead of writing:

```sql
seat_id = 2
OR seat_id = 3
OR seat_id = 4
```

PostgreSQL can use:

```sql
seat_id = ANY($2)
```

where `$2` is the array:

```text
[2, 3, 4]
```

This allows the query to work with a variable number of selected seats.

---

# 20. Consistent Locking Order

For multiple seats, the requested IDs are sorted:

```js
const sortedSeatIds = [...seatIds].sort((a, b) => a - b);
```

Example:

```text
Input:
[4, 2, 3]

Sorted:
[2, 3, 4]
```

The SQL also uses:

```sql
ORDER BY seat_id
FOR UPDATE
```

The purpose is to establish a consistent locking order.

For example, if two transactions need overlapping seats:

```text
Transaction A → [2, 3]
Transaction B → [3, 2]
```

without a consistent order they could potentially lock different rows first and wait for each other.

Sorting makes both transactions attempt:

```text
2 → 3
```

instead of:

```text
2 → 3
3 → 2
```

This reduces the possibility of deadlocks caused by inconsistent lock ordering.

---

# 21. Validation — Requested Seats Must Belong to the Event

After retrieving the seats:

```js
if (result.rows.length !== sortedSeatIds.length) {
    await client.query("ROLLBACK");

    return res.status(404).json({
        message: "One or more seats do not belong to this event",
    });
}
```

Example:

Request:

```json
{
    "seatIds": [2, 3, 999]
}
```

Expected:

```text
3 seats
```

but PostgreSQL only finds:

```text
Seat 2
Seat 3
```

Therefore:

```text
result.rows.length = 2
sortedSeatIds.length = 3
```

The booking is rejected.

This prevents a partial booking where only some requested seats exist.

---

# 22. Validation — All Seats Must Be Available

The controller checks:

```js
const unavailableSeat = result.rows.find(
    (seat) => seat.status !== "available"
);
```

If an unavailable seat exists:

```js
if (unavailableSeat) {
    await client.query("ROLLBACK");

    return res.status(409).json({
        message: "One or more seats are not available",
        seatId: unavailableSeat.seat_id,
        status: unavailableSeat.status,
    });
}
```

This checks for states such as:

```text
held
booked
blocked
```

and prevents the booking from continuing.

---

# 23. Calculating the Booking Total

The booking total is calculated from the prices retrieved from PostgreSQL.

```js
let totalAmount = 0;

for (let i = 0; i < result.rows.length; i++) {
    totalAmount += Number(result.rows[i].price);
}
```

For:

```text
Seat 2 → ₹499
Seat 3 → ₹499
```

the total becomes:

```text
₹998
```

The important concept is that the backend obtains the price from the database rather than trusting a client-supplied price.

---

# 24. Creating the Booking

After the seats are successfully locked and validated:

```sql
INSERT INTO bookings (
    user_id,
    event_id,
    total_amount,
    status
)
VALUES ($1, $2, $3, 'pending')
RETURNING id, user_id, event_id, total_amount, status;
```

The newly created booking is stored in:

```js
const booking = bookingResult.rows[0];
```

Example:

```text
id = 3
user_id = 1
event_id = 1
total_amount = 998.00
status = pending
```

---

# 25. Creating `booking_seats`

For every selected seat:

```js
for (const seat of result.rows) {
    await client.query(
        `INSERT INTO booking_seats (
            booking_id,
            event_seat_id,
            price_at_booking
        )
        VALUES ($1, $2, $3)`,
        [
            booking.id,
            seat.id,
            seat.price,
        ]
    );
}
```

Important distinction:

```text
seat.id
```

here is the `event_seats.id`.

This is correct because:

```text
booking_seats.event_seat_id
        ↓
event_seats.id
```

The API accepts physical `seatIds`, but internally the booking relationship uses the event-specific inventory record.

---

# 26. Updating Event Seat Status

After creating the booking and booking-seat records:

```sql
UPDATE event_seats
SET status = 'held',
    updated_at = CURRENT_TIMESTAMP
WHERE event_id = $1
  AND seat_id = ANY($2);
```

The selected event seats change:

```text
available → held
```

---

# 27. Final Booking Transaction

The overall transaction is now:

```text
BEGIN
  ↓
Sort requested seat IDs
  ↓
SELECT event seats
FOR UPDATE
  ↓
Verify all requested seats belong to event
  ↓
Verify all seats are available
  ↓
Calculate total amount
  ↓
INSERT booking
  ↓
INSERT booking_seats
  ↓
UPDATE event_seats → held
  ↓
COMMIT
```

If any operation throws an error:

```text
ROLLBACK
```

and the transaction is aborted.

---

# 28. Successful Booking Test

Tested through Postman:

```http
POST http://localhost:3000/api/events/1/bookings
```

with:

```json
{
    "userId": 1,
    "seatIds": [2, 3]
}
```

The API successfully returned:

```json
{
    "message": "Booking and booking seats created",
    "booking": {
        "id": "3",
        "user_id": "1",
        "event_id": "1",
        "total_amount": "998.00",
        "status": "pending"
    },
    "seats": [
        {
            "id": "2",
            "seat_id": "2",
            "price": "499.00",
            "status": "available"
        },
        {
            "id": "3",
            "seat_id": "3",
            "price": "499.00",
            "status": "available"
        }
    ]
}
```

The `seats` array in the response represents the rows read before the status update. The actual database state is changed to `held` before the transaction commits.

---

# 29. Complete Booking Information Query

To inspect a booking across the relational tables, I used:

```sql
SELECT
    b.user_id,
    b.event_id,
    e.venue_id,
    s.section,
    s.row_label,
    s.seat_number,
    s.seat_type,
    s.id AS seat_id,
    bs.price_at_booking AS price,
    b.status
FROM bookings b
JOIN booking_seats bs
    ON b.id = bs.booking_id
JOIN event_seats es
    ON bs.event_seat_id = es.id
JOIN seats s
    ON es.seat_id = s.id
JOIN events e
    ON b.event_id = e.id
ORDER BY b.id, s.id;
```

This query demonstrates how the complete booking information is assembled from multiple relational tables.

The `seat_id` displayed by this query is:

```sql
s.id AS seat_id
```

which is the physical seat ID from the `seats` table.

---

# 30. Understanding the Booking Relationship

The complete relationship is:

```text
bookings
   │
   │ booking_id
   ▼
booking_seats
   │
   │ event_seat_id
   ▼
event_seats
   │
   │ seat_id
   ▼
seats
```

And separately:

```text
bookings
   │
   │ event_id
   ▼
events
```

Therefore a booking can connect:

```text
User
  ↓
Booking
  ↓
Event
  ↓
Event-specific seat inventory
  ↓
Physical seat
```

---

# 31. Concurrency Experiment

The most important test so far was demonstrating PostgreSQL row locking.

Two PostgreSQL sessions attempted:

```sql
BEGIN;

SELECT id, seat_id, status
FROM event_seats
WHERE event_id = 1
  AND seat_id = 4
FOR UPDATE;
```

The first transaction acquired the lock.

The second transaction waited.

Conceptually:

```text
Transaction A
     ↓
FOR UPDATE
     ↓
Seat 4 🔒

Transaction B
     ↓
FOR UPDATE
     ↓
WAITING
```

After Transaction A committed:

```sql
COMMIT;
```

the lock was released and Transaction B continued.

This successfully demonstrated the concurrency-control mechanism used by the booking system.

---

# 32. Why This Prevents Double Booking

Without row locking:

```text
User A → check available
User B → check available
User A → book
User B → book
```

Potential double booking.

With:

```sql
SELECT ...
FOR UPDATE;
```

the flow becomes:

```text
User A
   ↓
BEGIN
   ↓
FOR UPDATE 🔒
   ↓
check availability
   ↓
book
   ↓
COMMIT
```

while User B attempting the same row must wait.

After User A commits, User B reads the latest state and can be rejected if the seat is no longer available.

---

# 33. Current Seat State

After the booking tests, `event_seats` contained states such as:

```text
seat 1 → held
seat 2 → held
seat 3 → held
other seats → available
```

The database was verified directly using:

```sql
SELECT
    id,
    event_id,
    seat_id,
    price,
    status,
    created_at,
    updated_at
FROM event_seats
ORDER BY id;
```

This confirmed that the API requests were actually changing the PostgreSQL state.

---

# 34. Important Current Limitation

The current `held` status is not yet temporary.

Currently:

```text
available
    ↓
held
```

There is no automatic expiration mechanism yet.

This creates a real problem:

```text
User selects seat
      ↓
seat becomes held
      ↓
user leaves without paying
      ↓
seat remains held
```

A real temporary hold should eventually behave like:

```text
available
    ↓
held temporarily
    ↓
payment successful → booked
```

or:

```text
available
    ↓
held temporarily
    ↓
hold expires
    ↓
available
```

The next major technology for this part will be Redis and TTL-based expiration.

---

# 35. Current Architecture Understanding

The booking flow currently looks like:

```text
Postman / Frontend
        ↓
Express Route
        ↓
Controller
        ↓
PostgreSQL Transaction
        ↓
Lock event_seats rows
        ↓
Validate seats
        ↓
Create booking
        ↓
Create booking_seats
        ↓
Update event_seats
        ↓
COMMIT
```

The PostgreSQL database remains the source of truth for seat availability.

---

# 36. Key Concepts Learned in This Checkpoint

### SQL / PostgreSQL

* Multi-table JOINs
* Filtering joined data
* `BEGIN`
* `COMMIT`
* `ROLLBACK`
* Row-level locks
* `SELECT ... FOR UPDATE`
* `ANY($2)`
* Consistent locking order
* Transaction atomicity

### Database design

* Difference between `seats.id` and `event_seats.id`
* Physical seat vs event-specific seat inventory
* `booking_seats.event_seat_id`
* Price snapshot using `price_at_booking`

### Node.js / Express

* Transaction handling using `pool.connect()`
* Dedicated PostgreSQL client
* `client.query()`
* `client.release()`
* Error handling with rollback

### Concurrency

* Race conditions
* Double booking
* Row-level locking
* Lock waiting
* Consistent lock ordering
* Basic deadlock prevention

### API design

* Client sends `seatIds`
* Backend resolves those IDs to event-specific inventory
* Client does not need to know internal `event_seats.id` values
* Backend obtains prices from PostgreSQL rather than trusting the client

---

# 37. Next Learning Step

The next major topic is:

## Redis Temporary Seat Holds

The goal will be:

```text
User selects seat
       ↓
PostgreSQL transaction
       ↓
Seat becomes held
       ↓
Redis TTL starts
       ↓
10 minutes
       ↓
Payment completed?
       ├── YES → booked
       │
       └── NO → hold expires → seat available
```

Topics to learn:

* Why Redis is useful
* Redis keys
* TTL
* `SET ... EX`
* Redis vs PostgreSQL responsibilities
* Temporary holds
* Expiration
* Synchronizing Redis with PostgreSQL
* Why PostgreSQL remains the source of truth

````

### Commit

After appending this section:

```bash
git status
git add LEARNING_LOG.md backend/src/controllers/event.controller.js backend/src/routes/event.routes.js backend/src/app.js
git commit -m "docs: log booking transactions and concurrency"
git push
````

If only the learning log changed since your last code commit, then just:

```bash
git add LEARNING_LOG.md
git commit -m "docs: log booking transactions and concurrency"
git push
```

This is now a clean checkpoint before we start the **Redis + temporary hold** phase.


Yes — **this is a good point to commit.** We have completed a clean learning milestone:

> **Redis fundamentals + Node.js Redis integration + BullMQ delayed-job basics**

We should commit now before connecting BullMQ to the actual booking flow. That way, if something goes wrong later, we have a clean checkpoint.

And yes, I'll keep this log to **only what we learned after the previous commit**. No repetition of PostgreSQL/JOIN/concurrency material.

Replace/append the following section in your `LEARNING_LOG.md`:

````md
# Learning Log — SeatVault

## New Learning Checkpoint — Redis & BullMQ

### Date
27 September 2026

---

# 1. Introduction to Redis

Redis was introduced as a new technology for SeatVault.

Redis is an in-memory data store that can be used for:

- Temporary data
- Caching
- Counters
- Sessions
- Queues
- Rate limiting
- Temporary locks
- Data with expiration

For SeatVault, the first use case is:

> Managing temporary seat-hold information and expiration.

---

# 2. PostgreSQL vs Redis

The important architectural distinction is:

```text
PostgreSQL
    ↓
Permanent application data

Redis
    ↓
Temporary / fast-access data
````

PostgreSQL remains the **source of truth** for SeatVault.

PostgreSQL stores things such as:

```text
users
events
seats
event_seats
bookings
booking_seats
payments
tickets
```

Redis will be used for temporary information such as:

```text
temporary seat holds
TTL
queue information
```

The architecture is therefore:

```text
                    SeatVault
                       │
              ┌────────┴────────┐
              ↓                 ↓
        PostgreSQL            Redis
              │                 │
       permanent data     temporary data
       source of truth        TTL/queues
```

---

# 3. Installing Redis

Redis was installed locally on macOS using Homebrew:

```bash
brew install redis
```

Redis version was verified using:

```bash
redis-server --version
```

---

# 4. Running Redis

Redis server was started using:

```bash
redis-server
```

The server runs locally on the default Redis port:

```text
localhost:6379
```

The Redis CLI was opened using:

```bash
redis-cli
```

The CLI showed:

```text
127.0.0.1:6379>
```

This confirmed that the Redis server was running and the CLI successfully connected to it.

---

# 5. Redis Key-Value Model

Redis was learned using a simple key-value model.

Example:

```text
key       value
----------------
name      Mohammad
```

The equivalent mental model in JavaScript is similar to:

```js
const data = {
    name: "Mohammad"
};
```

Redis is more powerful than a JavaScript object, but this is a useful beginner mental model.

---

# 6. Basic Redis Commands

The following commands were practiced manually using `redis-cli`.

## SET

```text
SET name Mohammad
```

Stores:

```text
name → Mohammad
```

---

## GET

```text
GET name
```

Retrieves:

```text
"Mohammad"
```

---

## DEL

```text
DEL name
```

Deletes the key.

Redis returned:

```text
(integer) 1
```

meaning one key was successfully deleted.

Afterward:

```text
GET name
```

returned:

```text
(nil)
```

meaning the key no longer existed.

---

# 7. Redis TTL

TTL means:

> Time To Live

TTL defines how long a Redis key should remain alive before Redis automatically removes it.

Example:

```text
SET message hello EX 30
```

means:

```text
key   = message
value = hello
TTL   = 30 seconds
```

Redis automatically removes the key after the TTL expires.

---

# 8. Checking TTL

The remaining lifetime of a key can be checked with:

```text
TTL message
```

Example output:

```text
(integer) 23
```

means approximately 23 seconds remain.

During the experiment, the TTL decreased:

```text
23
22
20
8
1
-2
```

When it reached:

```text
-2
```

the key no longer existed because Redis had automatically expired it.

Important TTL meanings:

```text
positive number
    ↓
key exists and has that many seconds remaining

-1
    ↓
key exists but has no expiration

-2
    ↓
key does not exist
```

---

# 9. Redis TTL vs Manual Deletion

There are two different ways a key can disappear.

### Manual deletion

```text
DEL message
```

The application/user explicitly deletes the key.

### Automatic expiration

```text
SET message hello EX 30
```

Redis automatically removes the key after 30 seconds.

For SeatVault, automatic expiration is important because seat holds should not remain forever.

---

# 10. Redis Temporary Seat Hold Concept

The eventual SeatVault Redis key structure was designed as:

```text
hold:event:1:seat:2
```

The key can store information such as:

```text
hold:event:1:seat:2 → booking:3
```

This means conceptually:

> Booking 3 currently has a temporary hold associated with Seat 2 for Event 1.

A TTL can be attached:

```text
hold:event:1:seat:2 → booking:3
TTL → 600 seconds
```

The `:` characters are simply part of the key naming convention.

They make Redis keys easier to organize and understand.

---

# 11. Important Redis/PostgreSQL Architecture Issue

Redis expiration does not automatically update PostgreSQL.

For example:

```text
Redis
hold:event:1:seat:2 → booking:3
TTL expires
        ↓
key disappears
```

But PostgreSQL could still contain:

```text
event_seats
seat 2 → held
```

Therefore:

```text
Redis
   ↓
temporary hold expires

PostgreSQL
   ↓
still says held
```

Something must connect these two systems and release the PostgreSQL seat.

This led to the next concept:

> Delayed jobs.

---

# 12. Connecting Redis to Node.js

The Node.js Redis client package was installed:

```bash
npm install redis
```

A Redis configuration file was created:

```text
backend/src/config/redis.js
```

The Redis client was created using:

```js
const { createClient } = require("redis");

const redisClient = createClient({
    url: "redis://localhost:6379",
});
```

---

# 13. Redis Connection Events

An error listener was added:

```js
redisClient.on("error", (error) => {
    console.error("Redis error:", error);
});
```

A connection listener was added:

```js
redisClient.on("connect", () => {
    console.log("Redis se connection ban gaya");
});
```

A ready listener was also added:

```js
redisClient.on("ready", () => {
    console.log("Redis ready — commands bhej sakte ho");
});
```

The distinction was learned:

```text
connect
    ↓
Redis connection established

ready
    ↓
Redis client is ready to execute commands
```

---

# 14. Connecting Redis During Server Startup

The Redis connection function:

```js
const connectRedis = async () => {
    await redisClient.connect();

    console.log("Redis connected (from connectRedis function)");
};
```

was called from `server.js`.

The startup flow is now:

```text
Node.js starts
      ↓
connectDB()
      ↓
PostgreSQL connected
      ↓
connectRedis()
      ↓
Redis connected
      ↓
Express starts
```

The server successfully printed:

```text
PostgreSQL connected
Redis se connection ban gaya
Redis ready — commands bhej sakte ho
Redis connected (from connectRedis function)
SeatVault server running on port 3000
```

---

# 15. Testing Redis Connection From Node.js

Redis connectivity was tested using:

```js
const response = await redisClient.ping();

console.log("redis response:", response);
```

Redis returned:

```text
PONG
```

This confirmed:

```text
Node.js
   ↓
Redis client
   ↓
Redis server
   ↓
PONG
```

---

# 16. Redis SET and GET From Node.js

Redis operations were then performed directly from Node.js.

### SET

```js
await redisClient.set("name", "Mohammad");
```

This is the programmatic equivalent of:

```text
SET name Mohammad
```

### GET

```js
const name = await redisClient.get("name");
```

This is the programmatic equivalent of:

```text
GET name
```

The test successfully returned:

```text
Name stored in Redis
Name from Redis: Mohammad
```

---

# 17. Redis TTL From Node.js

TTL was then tested from Node.js.

```js
await redisClient.set("message", "hello", {
    EX: 30,
});
```

This creates:

```text
message → hello
TTL → 30 seconds
```

The remaining TTL can be retrieved using:

```js
const ttl = await redisClient.ttl("message");
```

The test successfully returned:

```text
Message from Redis: hello
Remaining TTL: 30
```

This demonstrated that the same Redis TTL functionality available through `redis-cli` can be used programmatically from Node.js.

---

# 18. Redis Key Naming for Seat Holds

Multiple temporary seat-hold keys were tested.

Example:

```js
await redisClient.set(
    "hold:event:1:seat:2",
    "booking:3",
    {
        EX: 30,
    }
);
```

and:

```js
await redisClient.set(
    "hold:event:1:seat:3",
    "booking:3",
    {
        EX: 30,
    }
);
```

They were retrieved using:

```js
const seat2 = await redisClient.get(
    "hold:event:1:seat:2"
);

const seat3 = await redisClient.get(
    "hold:event:1:seat:3"
);
```

The result was:

```text
Seat 2 hold: booking:3
Seat 3 hold: booking:3
```

This demonstrated that each seat can have its own Redis key and TTL.

---

# 19. Why `setTimeout()` Is Not Enough

A simple JavaScript timer could theoretically be used:

```js
setTimeout(() => {
    // release seat
}, 10 * 60 * 1000);
```

However, the timer exists inside the Node.js process.

If the server crashes:

```text
Node.js
   ↓
setTimeout()
   ↓
server crashes
   ↓
timer disappears
```

The application would lose knowledge of the scheduled work.

This becomes even more problematic when multiple application servers are running.

Therefore, SeatVault needs a persistent job/queue mechanism rather than relying on an in-memory JavaScript timer.

---

# 20. What Is a Job?

A job is a piece of work that needs to be performed.

Examples:

```text
Send email
Generate report
Process image
Release expired seat
Process payment
```

For SeatVault, a job can eventually be:

```text
Release booking #3 after 10 minutes
```

---

# 21. What Is a Queue?

A queue stores work that needs to be processed.

Conceptually:

```text
Producer
   ↓
Queue
   ↓
Worker
```

Instead of Node.js waiting for 10 minutes, it adds a job to the queue.

The worker can process the job when it becomes ready.

---

# 22. Producer and Worker

Two important queue concepts were learned.

### Producer

The producer creates/adds jobs.

In SeatVault:

```text
Booking created
      ↓
Node.js
      ↓
add expiration job
```

### Worker

The worker processes jobs.

Eventually:

```text
Expiration time arrives
      ↓
Worker receives job
      ↓
Checks booking
      ↓
Releases seats if necessary
```

So:

```text
Producer
   ↓
Queue
   ↓
Worker
```

---

# 23. BullMQ

BullMQ was introduced as the Node.js job queue library for SeatVault.

BullMQ uses Redis to store and manage queue information.

The architecture is:

```text
Node.js
   ↓
BullMQ
   ↓
Redis
```

BullMQ will eventually allow SeatVault to create delayed jobs such as:

```text
Release booking #3
after 10 minutes
```

---

# 24. Installing BullMQ

BullMQ was installed using:

```bash
npm install bullmq
```

---

# 25. BullMQ Queue

A queue was created in:

```text
backend/src/queues/hold.queue.js
```

using:

```js
const { Queue } = require("bullmq");

const holdQueue = new Queue("seat-hold", {
    connection: {
        host: "localhost",
        port: 6379,
    },
});

module.exports = holdQueue;
```

The queue is named:

```text
seat-hold
```

This queue will eventually contain jobs related to temporary seat holds.

---

# 26. BullMQ Worker

A worker was created in:

```text
backend/src/workers/hold.worker.js
```

The worker listens to the:

```text
seat-hold
```

queue.

Basic worker structure:

```js
const { Worker } = require("bullmq");

const holdWorker = new Worker(
    "seat-hold",
    async (job) => {
        console.log("Job received:", job.name);
        console.log("Job data:", job.data);
    },
    {
        connection: {
            host: "localhost",
            port: 6379,
        },
    }
);
```

The worker waits for jobs and processes them when they become available.

---

# 27. BullMQ `ioredis` Dependency

Initially the worker failed with an error indicating that BullMQ could not load:

```text
ioredis
```

The required package was installed:

```bash
npm install ioredis
```

This allowed the BullMQ Worker to connect successfully.

Important distinction:

```text
redis package
    ↓
used for normal Redis operations

ioredis
    ↓
used by BullMQ worker connection
```

The existing `redis` package was not replaced.

---

# 28. BullMQ Test Producer

A temporary producer was created:

```text
backend/src/test-queue.js
```

It adds a job:

```js
const job = await holdQueue.add(
    "test-hold",
    {
        message: "Hello from SeatVault",
    },
    {
        delay: 10000,
    }
);
```

The job contains:

```text
name:
test-hold

data:
{
    message: "Hello from SeatVault"
}

delay:
10000 milliseconds
```

---

# 29. Delayed Jobs

The following:

```js
delay: 10000
```

means:

```text
10,000 milliseconds
      ↓
10 seconds
```

Therefore:

```text
Producer
   ↓
add job
   ↓
wait 10 seconds
   ↓
Worker receives job
```

This is called a **delayed job**.

---

# 30. Successful BullMQ Experiment

The worker was started using:

```bash
node src/workers/hold.worker.js
```

The producer was started using:

```bash
node src/test-queue.js
```

The worker successfully reported:

```text
Worker ready
Job received: test-hold
Job data: { message: 'Hello from SeatVault' }
```

The producer reported:

```text
Job added: 1
```

This confirmed that the complete pipeline works:

```text
Producer
    ↓
BullMQ Queue
    ↓
Redis
    ↓
Delayed Job
    ↓
BullMQ Worker
    ↓
Job Processing
```

---

# 31. Important Queue Persistence Lesson

During the first BullMQ attempt, a job was added before the Worker could successfully start because the `ioredis` dependency was missing.

After `ioredis` was installed and the Worker started, the Worker was able to find and process the existing job.

This demonstrated an important difference from `setTimeout()`:

```text
setTimeout()
   ↓
lives inside Node.js process
```

whereas:

```text
BullMQ
   ↓
Redis
   ↓
job stored outside the Node.js process
```

Therefore, the Worker can start later and process jobs that were already placed into the queue.

---

# 32. Current SeatVault Architecture

The architecture has now expanded to:

```text
                         SeatVault
                            │
                         Node.js
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
        PostgreSQL        Redis          BullMQ
             │              │              │
       source of truth   temporary       job queue
       bookings          holds           delayed jobs
       seats             TTL
       payments
                            │
                            ▼
                         Worker
                            │
                            ▼
                       PostgreSQL
```

The eventual temporary-hold flow will be:

```text
User selects seat
       ↓
PostgreSQL transaction
       ↓
Seat → held
       ↓
Booking → pending
       ↓
Redis temporary hold
       ↓
BullMQ delayed expiration job
       ↓
10 minutes
       ↓
Worker
       ↓
Check booking in PostgreSQL
       ↓
Still pending?
     /       \
   YES        NO
    ↓          ↓
release      do nothing
seat
```

---

# 33. Important Design Principle

Redis expiration and BullMQ jobs solve different problems.

### Redis TTL

Answers:

> How long should this temporary Redis key exist?

### BullMQ delayed job

Answers:

> When should our application perform some work?

For SeatVault we can use both:

```text
Redis
   ↓
temporary hold + TTL

BullMQ
   ↓
delayed expiration work
```

PostgreSQL remains the source of truth.

---

# 34. Concepts Learned in This Checkpoint

### Redis

* What Redis is
* Redis server
* `redis-cli`
* Redis port `6379`
* Key-value model
* `SET`
* `GET`
* `DEL`
* TTL
* `EX`
* Redis key naming
* Redis connection from Node.js
* `connect` event
* `ready` event
* `PING` / `PONG`
* Redis expiration

### Node.js + Redis

* `redis` package
* `createClient()`
* Redis connection URL
* `redisClient.connect()`
* `redisClient.set()`
* `redisClient.get()`
* `redisClient.ttl()`

### Job Queues

* What a job is
* What a queue is
* Producer
* Worker
* Delayed job
* Why `setTimeout()` is insufficient for persistent scheduled work

### BullMQ

* BullMQ
* Queue creation
* Worker creation
* Job data
* Job name
* Job ID
* Delayed jobs
* Redis as BullMQ's backing store
* `ioredis` dependency for the Worker
* Producer → Queue → Redis → Worker flow

---

# 35. Next Learning Step

The next step is to move from the generic test job:

```text
test-hold
{
    message: "Hello from SeatVault"
}
```

to a realistic SeatVault expiration job:

```text
release-hold
{
    bookingId: 3
}
```

The Worker will eventually:

```text
receive bookingId
       ↓
query PostgreSQL
       ↓
check booking status
       ↓
if still pending and expired
       ↓
release seats
       ↓
mark booking expired
```

Before modifying the actual booking controller, we will first create and understand this realistic job in isolation.

---

# Checkpoint

Redis and BullMQ have been successfully installed, connected, and tested.

The next major integration will be:

```text
Seat Booking
     ↓
Redis Hold
     ↓
BullMQ Delayed Job
     ↓
Expiration Worker
     ↓
PostgreSQL Seat Release
```

````

### Then commit this checkpoint

First check what actually changed:

```bash
git status
````

You should see things around:

```text
backend/package.json
backend/package-lock.json
backend/src/config/redis.js
backend/src/server.js
backend/src/queues/hold.queue.js
backend/src/workers/hold.worker.js
backend/src/test-queue.js
LEARNING_LOG.md
```

Then:

```bash
git add LEARNING_LOG.md backend/package.json backend/package-lock.json backend/src/config/redis.js backend/src/server.js backend/src/queues/hold.queue.js backend/src/workers/hold.worker.js backend/src/test-queue.js
```

Commit:

```bash
git commit -m "feat: add Redis and BullMQ job queue"
```

And push:

```bash
git push
```

**This is a very good checkpoint** because everything up to here is tested independently. Next we can start integrating the queue with the actual SeatVault booking flow.

Absolutely. Since the previous checkpoint already covered the **Redis + BullMQ fundamentals**, this log should only document what we implemented **after that commit**.

Add this to the bottom of `LEARNING_LOG.md`:

````md
# New Learning Checkpoint — BullMQ Booking Hold Expiration

## What I Implemented

I connected the BullMQ delayed job system with PostgreSQL so that a pending seat booking can automatically expire and release its seats.

The flow is:

```text
Booking created
      ↓
Seats marked as HELD
      ↓
BullMQ delayed job created
      ↓
Worker receives bookingId
      ↓
Worker queries PostgreSQL
      ↓
Check current booking status
      ↓
If status = pending
      ↓
Booking → expired
      ↓
Seats → available
      ↓
COMMIT
````

---

## 1. BullMQ Job Carries the Booking ID

Instead of putting the complete booking information inside the BullMQ job, the job only contains the booking ID.

Example:

```js
const job = await holdQueue.add(
    "release-hold",
    {
        bookingId: 3,
    },
    {
        delay: 10000,
    }
);
```

The worker receives:

```js
{
    bookingId: 3
}
```

### Why only the ID?

The worker should not depend on potentially outdated data stored inside the job.

Instead:

```text
BullMQ
   ↓
bookingId
   ↓
PostgreSQL
   ↓
current booking state
```

This means the worker always checks the latest state of the booking when the job actually executes.

---

# 2. Worker Queries PostgreSQL

The BullMQ worker uses the `bookingId` to find the booking:

```js
const result = await pool.query(
    `SELECT id, user_id, event_id, total_amount, status
     FROM bookings
     WHERE id = $1`,
    [bookingId]
);
```

For booking `3`, PostgreSQL returned:

```text
id: 3
user_id: 1
event_id: 1
total_amount: 998.00
status: pending
```

This proved that the BullMQ worker can communicate with PostgreSQL and retrieve the current booking state.

---

# 3. Booking Row Locking with FOR UPDATE

Before changing the booking, the worker locks the booking row:

```sql
SELECT id, user_id, event_id, total_amount, status
FROM bookings
WHERE id = $1
FOR UPDATE;
```

The transaction structure is:

```js
await client.query("BEGIN");

const result = await client.query(
    `SELECT ...
     FROM bookings
     WHERE id = $1
     FOR UPDATE`,
    [bookingId]
);
```

### What `FOR UPDATE` does

It locks the selected booking row until the transaction finishes.

It does NOT lock the entire `bookings` table.

This is important because later the payment process may try to update the same booking.

For example:

```text
Payment process             Expiration worker
       ↓                           ↓
 lock booking 3              lock booking 3
       ↓                           ↓
 confirm booking             waits
```

Only one transaction can acquire the row lock first.

The second transaction waits and then sees the latest booking status.

---

# 4. Checking the Current Booking Status

The worker does not automatically expire every booking.

It checks:

```js
if (booking.status !== "pending") {
    console.log(
        `Booking ${bookingId} is ${booking.status}. No action needed.`
    );

    await client.query("COMMIT");
    return;
}
```

This is important because the booking might already have been confirmed by the time the expiration job runs.

Example:

```text
Booking = confirmed
       ↓
Expiration job runs
       ↓
Worker checks PostgreSQL
       ↓
status !== pending
       ↓
Do nothing
```

This prevents an already-confirmed booking from being accidentally expired.

---

# 5. Expiring the Booking

If the booking is still pending:

```sql
UPDATE bookings
SET status = 'expired',
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1;
```

For booking `3`, the database changed:

```text
pending → expired
```

Verified result:

```text
id | user_id | event_id | total_amount | status
---+---------+----------+--------------+---------
3  |    1    |     1    |    998.00    | expired
```

---

# 6. Releasing the Held Seats

The booking's seats are stored in:

```text
booking_seats
```

which references:

```text
event_seats
```

The worker releases the seats belonging to the booking.

Using PostgreSQL `UPDATE ... FROM`:

```sql
UPDATE event_seats AS es
SET status = 'available',
    updated_at = CURRENT_TIMESTAMP
FROM booking_seats AS bs
WHERE es.id = bs.event_seat_id
  AND bs.booking_id = $1
  AND es.status = 'held';
```

### Relationship

```text
bookings
   │
   │ booking_id
   ↓
booking_seats
   │
   │ event_seat_id
   ↓
event_seats
```

Only the seats belonging to the specific booking are released.

The condition:

```sql
AND es.status = 'held'
```

also ensures that only currently held seats are changed.

---

# 7. Entire Expiration Process Uses One Transaction

The worker performs the booking expiration and seat release inside one PostgreSQL transaction:

```js
await client.query("BEGIN");

// Lock booking

// Check status

// Update booking

// Release seats

await client.query("COMMIT");
```

If something fails:

```js
catch (error) {
    await client.query("ROLLBACK");
    throw error;
}
```

This gives us atomic behavior.

Conceptually:

```text
BEGIN
   ↓
Lock booking
   ↓
Check booking
   ↓
Expire booking
   ↓
Release seats
   ↓
COMMIT
```

If an error occurs:

```text
BEGIN
   ↓
Something fails
   ↓
ROLLBACK
   ↓
Database changes are undone
```

---

# 8. Why the Transaction Matters

We don't want this situation:

```text
Booking → expired
Seats → still held
```

or:

```text
Booking → pending
Seats → available
```

The booking status update and seat release belong to the same logical operation.

Using one transaction means they are committed together.

---

# 9. PostgreSQL UPDATE JOIN

I also learned that PostgreSQL uses `UPDATE ... FROM` for update operations involving another table.

Instead of:

```sql
UPDATE event_seats
SET status = 'available'
WHERE id IN (
    SELECT event_seat_id
    FROM booking_seats
    WHERE booking_id = $1
);
```

we can write:

```sql
UPDATE event_seats AS es
SET status = 'available'
FROM booking_seats AS bs
WHERE es.id = bs.event_seat_id
  AND bs.booking_id = $1;
```

The important PostgreSQL pattern is:

```sql
UPDATE table1
SET ...
FROM table2
WHERE table1.id = table2.foreign_key;
```

---

# 10. Final Working Flow

The complete system currently works like this:

```text
User selects seats
       ↓
PostgreSQL transaction
       ↓
SELECT seats FOR UPDATE
       ↓
Check availability
       ↓
Create booking
       ↓
Create booking_seats
       ↓
Seats → held
       ↓
COMMIT
       ↓
BullMQ delayed job
       ↓
Worker receives bookingId
       ↓
Worker starts PostgreSQL transaction
       ↓
SELECT booking FOR UPDATE
       ↓
Check booking status
       ↓
If pending
       ↓
Booking → expired
       ↓
Seats → available
       ↓
COMMIT
```

---

## 11. Important Learning

The key architecture lesson is:

> **BullMQ decides when the expiration work should run, but PostgreSQL decides what the current truth is.**

BullMQ:

```text
"When should I run?"
```

PostgreSQL:

```text
"What is the current state?"
```

PostgreSQL remains the source of truth for bookings and seat availability.

---

## 12. Current Limitation

The `bookings` table already has:

```sql
expires_at TIMESTAMP
```

but it is currently `NULL`.

The BullMQ test currently uses:

```js
delay: 10000
```

which means the job runs after 10 seconds.

The next step will be to connect these concepts properly:

```text
booking.expires_at
       ↓
calculate hold duration
       ↓
BullMQ delayed job
       ↓
worker
       ↓
expire booking
       ↓
release seats
```

For now, the expiration mechanism has been successfully tested using a 10-second demo delay.

---

## Commit

Suggested commit:

```bash
git add .
git commit -m "feat: add booking hold expiration worker"
```

### Checkpoint

At this point I have successfully implemented and tested:

* BullMQ delayed jobs
* Passing `bookingId` through a queue
* BullMQ worker querying PostgreSQL
* PostgreSQL transactions inside workers
* `SELECT ... FOR UPDATE`
* Checking current booking status
* Expiring pending bookings
* Releasing held seats
* PostgreSQL `UPDATE ... FROM`
* Atomic booking expiration + seat release
* Handling already-processed/non-pending bookings

```

This is the correct checkpoint to commit. **After this commit, the next topic is `expires_at` + dynamically scheduling the BullMQ expiration job.**


Absolutely. Here is the **full `LEARNING_LOG.md` up to the latest successful commit**. This includes the earlier PostgreSQL/transactions/Redis/BullMQ learning plus the new automatic booking-expiration integration.

You can replace your current `LEARNING_LOG.md` with this.

````md
# SeatVault Learning Log

This file documents what I learn and implement while building SeatVault.

The goal is not only to build the project, but to understand the backend concepts behind each feature.

---

# Project

## SeatVault — Event Ticket Booking Platform

SeatVault is a backend-focused event ticket booking platform designed around one important problem:

> How do we allow multiple users to try booking seats concurrently without allowing the same seat to be booked twice?

### Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Redis
- BullMQ
- JWT
- Docker
- Postman
- k6 / Artillery
- Git / GitHub

### Architecture

SeatVault follows a modular monolithic architecture.

Current flow:

```text
Route
  ↓
Controller
  ↓
Database / Redis / Queue
  ↓
PostgreSQL / Redis
````

Planned architecture:

```text
Routes
  ↓
Middleware
  ↓
Controllers
  ↓
Services
  ↓
Repositories / Database
```

Background jobs are handled separately by workers.

---

# Initial Project Structure

```text
seatvault/
├── backend/
├── docs/
│   ├── requirements.md
│   ├── architecture.md
│   └── database-schema.md
├── LEARNING_LOG.md
└── README.md
```

Backend structure currently includes:

```text
backend/
├── src/
│   ├── config/
│   │   ├── db.js
│   │   └── redis.js
│   │
│   ├── controllers/
│   │   ├── health.controller.js
│   │   ├── user.controller.js
│   │   └── event.controller.js
│   │
│   ├── queues/
│   │   └── hold.queue.js
│   │
│   ├── workers/
│   │   └── hold.worker.js
│   │
│   ├── routes/
│   │   ├── health.route.js
│   │   ├── user.routes.js
│   │   └── event.routes.js
│   │
│   ├── app.js
│   ├── server.js
│   └── test-queue.js
│
├── .env
├── package.json
└── .gitignore
```

---

# Checkpoint 1 — Project Initialization

## What I learned

Created the SeatVault workspace and initialized the backend.

Backend initialized with:

```bash
npm init -y
```

Installed:

```bash
npm install express pg dotenv
npm install -D nodemon
```

Later installed:

```bash
npm install redis
npm install bullmq
npm install ioredis
```

### Important Git lesson

Git commits should represent meaningful checkpoints rather than every tiny change.

Initial commit:

```text
chore: initialize SeatVault project workspace
```

---

# Checkpoint 2 — PostgreSQL Setup

## PostgreSQL

Installed PostgreSQL 16 using Homebrew.

Created database:

```text
seatvault_dev
```

PostgreSQL runs locally on:

```text
localhost:5432
```

---

# Database Design

SeatVault uses PostgreSQL as the **source of truth** for:

* Users
* Venues
* Events
* Physical seats
* Event-specific seats
* Bookings
* Booking seats
* Payments
* Tickets

---

# 1. Users Table

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

Important concepts learned:

* `PRIMARY KEY`
* `UNIQUE`
* `NOT NULL`
* `DEFAULT`
* `BIGSERIAL`

---

# 2. Venues Table

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

Learned:

* Foreign keys create relationships between tables.
* `CHECK` constraints can enforce valid values.
* A venue belongs to a user through `created_by`.

---

# 3. Events Table

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
        CHECK (status IN (
            'draft',
            'published',
            'cancelled',
            'completed'
        ))
);
```

Learned:

* An event belongs to a venue.
* An event has a lifecycle.
* `CHECK` constraints can restrict status values.

---

# 4. Seats Table

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
        CHECK (seat_type IN (
            'regular',
            'premium',
            'vip'
        )),

    CONSTRAINT unique_seat_position
        UNIQUE (
            venue_id,
            section,
            row_label,
            seat_number
        )
);
```

## Important design decision

`seats` represents the **physical seat in the venue**.

For example:

```text
Venue 1
Section A
Row 1
Seat 1
```

That physical seat can be reused for multiple events.

---

# 5. Event Seats Table

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

## Important concept

`event_seats` represents:

> A physical seat for a specific event.

Therefore:

```text
seats
  ↓
physical seat

event_seats
  ↓
physical seat + specific event
```

This allows the same physical seat to be reused across different events.

---

# 6. Bookings Table

```sql
CREATE TABLE bookings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    event_id BIGINT NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
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

Booking lifecycle:

```text
pending
   │
   ├── payment success → confirmed
   │
   └── timeout → expired
```

---

# 7. Booking Seats Table

```sql
CREATE TABLE booking_seats (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    event_seat_id BIGINT NOT NULL,
    price_at_booking NUMERIC(10, 2) NOT NULL CHECK (price_at_booking >= 0),
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

Relationship:

```text
booking
   ↓
booking_seats
   ↓
event_seats
   ↓
seats
```

`price_at_booking` stores the price at the time of booking rather than relying on the current seat price.

---

# 8. Payments Table

```sql
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
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

Payment processing itself has not yet been implemented.

---

# 9. Tickets Table

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

Ticket processing has not yet been implemented.

---

# Checkpoint 3 — PostgreSQL Connection from Node.js

Created:

```text
src/config/db.js
```

Using the `pg` package:

```js
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
        console.error(
            "PostgreSQL connection failed:",
            error.message
        );

        process.exit(1);
    }
};

module.exports = {
    pool,
    connectDB
};
```

Learned:

* `Pool` manages PostgreSQL connections.
* `pool.query()` can execute simple queries.
* `pool.connect()` gives a dedicated connection, which is important for transactions.

---

# Checkpoint 4 — Transactions

## Why transactions?

A transaction groups multiple database operations into one logical operation.

SeatVault needs this because booking a seat involves multiple changes:

```text
Check seats
   ↓
Create booking
   ↓
Create booking_seats
   ↓
Mark seats held
```

These changes should not partially succeed.

---

# Basic Transaction

```sql
BEGIN;

-- queries

COMMIT;
```

If something fails:

```sql
ROLLBACK;
```

Concept:

```text
BEGIN
  ↓
Multiple operations
  ↓
Everything successful?
  ↓ YES
COMMIT

Something failed?
  ↓
ROLLBACK
```

---

# Node.js Transaction Pattern

```js
const client = await pool.connect();

try {
    await client.query("BEGIN");

    // database operations

    await client.query("COMMIT");
} catch (error) {
    await client.query("ROLLBACK");
    throw error;
} finally {
    client.release();
}
```

## Important lesson

All queries belonging to the transaction must use:

```js
client.query()
```

and not:

```js
pool.query()
```

because the transaction belongs to one specific PostgreSQL connection.

---

# Checkpoint 5 — Row Locking with FOR UPDATE

Learned:

```sql
SELECT ...
FROM event_seats
WHERE ...
FOR UPDATE;
```

`FOR UPDATE` locks the selected rows until the transaction ends.

It does **not** lock the entire table.

Example:

```text
Transaction A
     ↓
SELECT seat 4 FOR UPDATE
     ↓
Seat 4 locked
```

Transaction B trying to lock the same row must wait until Transaction A:

```text
COMMIT
```

or:

```text
ROLLBACK
```

This is essential for preventing concurrent users from booking the same seat.

---

# Seat Locking Strategy

When booking multiple seats, the requested seat IDs are sorted:

```js
const sortedSeatIds = [...seatIds].sort(
    (a, b) => a - b
);
```

Then seats are locked in a consistent order.

This helps reduce deadlock risk when multiple transactions request overlapping seats.

---

# Checkpoint 6 — Booking Creation with Transaction

Booking flow:

```text
POST /api/events/:eventId/bookings
        ↓
BEGIN
        ↓
Sort seat IDs
        ↓
SELECT event_seats
FOR UPDATE
        ↓
Check seats belong to event
        ↓
Check seats are available
        ↓
Calculate total
        ↓
Create booking
        ↓
Create booking_seats
        ↓
Seats → held
        ↓
COMMIT
```

Example request:

```json
{
    "userId": 1,
    "seatIds": [2, 3]
}
```

---

# Seat Availability Validation

The booking controller checks:

### 1. All requested seats belong to the event

```js
if (result.rows.length !== sortedSeatIds.length) {
    // reject request
}
```

### 2. All requested seats are available

```js
const unavailableSeat = result.rows.find(
    (seat) => seat.status !== "available"
);
```

If one is unavailable, the transaction is rolled back.

---

# Why `find()`?

`find()` is useful because we need the actual unavailable seat.

Example:

```text
seat 2 → available
seat 3 → held
seat 4 → available
```

`find()` returns seat 3.

This allows the API to return useful information such as:

```json
{
    "message": "One or more seats are not available",
    "seatId": 3,
    "status": "held"
}
```

---

# Checkpoint 7 — JOIN Queries

Learned how to combine relational tables using SQL joins.

Booking information can be retrieved using:

```sql
SELECT
    b.user_id,
    b.event_id,
    e.venue_id,
    s.section,
    s.row_label,
    s.seat_number,
    s.seat_type,
    s.id AS seat_id,
    bs.price_at_booking AS price,
    b.status
FROM bookings b
JOIN booking_seats bs
    ON b.id = bs.booking_id
JOIN event_seats es
    ON bs.event_seat_id = es.id
JOIN seats s
    ON es.seat_id = s.id
JOIN events e
    ON b.event_id = e.id
ORDER BY b.id, s.id;
```

Learned that joins allow us to follow relationships:

```text
bookings
    ↓
booking_seats
    ↓
event_seats
    ↓
seats
    ↓
events
```

---

# Checkpoint 8 — Redis

Redis was introduced for temporary state and fast access.

Installed Redis locally using Homebrew.

Redis runs on:

```text
localhost:6379
```

Redis is an in-memory key-value store.

Basic commands learned:

```bash
SET name Mohammad
GET name
DEL name
```

---

# Redis TTL

TTL means:

> Time To Live

Example:

```bash
SET message hello EX 30
```

This creates a key that expires after 30 seconds.

Check remaining time:

```bash
TTL message
```

Important TTL values:

```text
positive number → remaining seconds
-1              → key exists without expiration
-2              → key does not exist
```

Redis automatically removes the key when its TTL expires.

---

# Seat Hold Keys

Learned a possible Redis key structure:

```text
hold:event:1:seat:2
```

Value:

```text
booking:3
```

Example:

```js
await redisClient.set(
    "hold:event:1:seat:2",
    "booking:3",
    { EX: 30 }
);
```

For multiple seats:

```js
await redisClient.set(
    "hold:event:1:seat:2",
    "booking:3",
    { EX: 30 }
);

await redisClient.set(
    "hold:event:1:seat:3",
    "booking:3",
    { EX: 30 }
);
```

---

# Important Redis Architecture Lesson

Redis TTL expiration does **not automatically update PostgreSQL**.

For example:

```text
Redis
hold:event:1:seat:2
TTL expires
       ↓
Redis key disappears
```

This does NOT automatically mean:

```text
PostgreSQL
event_seats.status
held → available
```

Therefore PostgreSQL remains the source of truth.

Something else must perform the database update.

This led to learning BullMQ.

---

# Checkpoint 9 — BullMQ

BullMQ is a job queue system built on Redis.

Main components:

```text
Producer
   ↓
Queue
   ↓
Redis
   ↓
Worker
```

A job represents a unit of work that needs to happen later or asynchronously.

---

# Why not use setTimeout()?

A simple Node.js approach could be:

```js
setTimeout(() => {
    // release seat
}, 600000);
```

But this is unreliable for background work.

If the Node.js process crashes:

```text
setTimeout
   ↓
process crashes
   ↓
timer disappears
```

With BullMQ:

```text
Node.js
   ↓
BullMQ
   ↓
Redis
```

The job is stored outside the process.

The worker can process it later.

---

# BullMQ Queue

Created:

```text
src/queues/hold.queue.js
```

```js
const { Queue } = require("bullmq");

const holdQueue = new Queue("seat-hold", {
    connection: {
        host: "localhost",
        port: 6379,
    },
});

module.exports = holdQueue;
```

The queue name is:

```text
seat-hold
```

---

# BullMQ Worker

Created:

```text
src/workers/hold.worker.js
```

Worker listens to:

```text
seat-hold
```

Example:

```js
const { Worker } = require("bullmq");

const holdWorker = new Worker(
    "seat-hold",
    async (job) => {
        console.log("Job received:", job.name);
        console.log("Job data:", job.data);
    },
    {
        connection: {
            host: "localhost",
            port: 6379,
        },
    }
);
```

Important concept:

The producer and worker use the same queue name:

```text
Queue:
seat-hold

Worker:
seat-hold
```

Both connect to:

```text
localhost:6379
```

Redis acts as the communication/storage layer.

---

# Delayed BullMQ Jobs

A test job was created:

```js
await holdQueue.add(
    "test-hold",
    {
        message: "Hello from SeatVault",
    },
    {
        delay: 10000,
    }
);
```

The worker received it after the delay.

Learned that delayed jobs are stored by BullMQ/Redis until they become ready.

---

# BullMQ Job Data Design

Initially, test data contained:

```js
{
    message: "Hello from SeatVault"
}
```

Later changed to realistic data:

```js
{
    bookingId: 3
}
```

Important lesson:

> Pass an identifier through the queue and query the current database state when the worker executes.

Avoid passing stale booking status such as:

```js
{
    bookingId: 3,
    status: "pending"
}
```

because the booking might become confirmed before the job runs.

Better:

```js
{
    bookingId: 3
}
```

Then the worker queries PostgreSQL.

---

# Checkpoint 10 — BullMQ Worker + PostgreSQL

The worker was connected to PostgreSQL:

```js
const { pool } = require("../config/db");
```

The worker receives:

```js
const { bookingId } = job.data;
```

Then queries:

```sql
SELECT id, user_id, event_id, total_amount, status
FROM bookings
WHERE id = $1;
```

This established the architecture:

```text
BullMQ
   ↓
bookingId
   ↓
Worker
   ↓
PostgreSQL
   ↓
Current booking state
```

---

# Checkpoint 11 — Booking Hold Expiration

The worker was extended to automatically expire pending bookings.

The worker starts a transaction:

```js
await client.query("BEGIN");
```

Then locks the booking:

```sql
SELECT id, user_id, event_id, total_amount, status
FROM bookings
WHERE id = $1
FOR UPDATE;
```

---

# Worker Checks Booking Status

The worker checks:

```js
if (booking.status !== "pending") {
    await client.query("COMMIT");
    return;
}
```

This prevents already-confirmed or otherwise processed bookings from being expired.

Example:

```text
Booking = confirmed
        ↓
Expiration job runs
        ↓
Worker checks PostgreSQL
        ↓
status !== pending
        ↓
Do nothing
```

---

# Expiring the Booking

If the booking is still pending:

```sql
UPDATE bookings
SET status = 'expired',
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1;
```

---

# Releasing the Seats

Seats belonging to the booking are changed:

```sql
UPDATE event_seats
SET status = 'available',
    updated_at = CURRENT_TIMESTAMP
WHERE id IN (
    SELECT event_seat_id
    FROM booking_seats
    WHERE booking_id = $1
)
AND status = 'held';
```

This was also understood using PostgreSQL `UPDATE ... FROM` syntax:

```sql
UPDATE event_seats AS es
SET status = 'available',
    updated_at = CURRENT_TIMESTAMP
FROM booking_seats AS bs
WHERE es.id = bs.event_seat_id
  AND bs.booking_id = $1
  AND es.status = 'held';
```

---

# Why the Worker Uses a Transaction

The expiration operation consists of two related changes:

```text
Booking → expired
Seats → available
```

These should happen together.

Without a transaction:

```text
UPDATE booking
    ↓
success

UPDATE seats
    ↓
failure
```

The database could become:

```text
Booking = expired
Seats = held
```

This is inconsistent.

With a transaction:

```text
BEGIN
   ↓
Booking → expired
   ↓
Seats → available
   ↓
COMMIT
```

If anything fails:

```text
BEGIN
   ↓
Booking → expired
   ↓
Seat update fails
   ↓
ROLLBACK
```

The booking change is undone.

Therefore:

```text
COMMIT
    =
make all changes permanent

ROLLBACK
    =
undo all changes in this transaction
```

---

# Why FOR UPDATE Is Important in the Worker

The worker uses:

```sql
FOR UPDATE
```

because later the payment/confirmation flow will also need to modify the booking.

Possible race:

```text
             Booking 5
                │
       ┌────────┴────────┐
       ↓                 ↓
Payment request    Expiration worker
```

Both could try to modify the booking.

`FOR UPDATE` ensures only one transaction can hold the booking row lock at a time.

The lock lasts until:

```text
COMMIT
```

or:

```text
ROLLBACK
```

---

# Checkpoint 12 — `expires_at`

The `bookings` table already contained:

```sql
expires_at TIMESTAMP
```

Initially it was:

```text
NULL
```

The booking creation logic was updated so a new pending booking gets a 10-minute expiration time.

The SQL uses:

```sql
CURRENT_TIMESTAMP + INTERVAL '10 minutes'
```

Example:

```text
Booking created:
09:30:00

expires_at:
09:40:00
```

---

# Why `expires_at` Is Needed

Previously the BullMQ test used:

```js
delay: 10000
```

This was only a 10-second test.

Now the database knows:

```text
"When does this booking expire?"
```

This is useful business data.

Example:

```text
booking 5
status = pending
expires_at = 09:40:00
```

---

# Calculating BullMQ Delay

BullMQ's `delay` is specified in milliseconds.

Therefore:

```js
const delayMs =
    new Date(booking.expires_at).getTime()
    - Date.now();
```

This means:

```text
expiration timestamp
        -
current timestamp
        =
milliseconds until expiration
```

For 10 minutes:

```text
10 × 60 × 1000
=
600000 ms
```

A real test produced:

```text
BullMQ delay: 599967
```

The difference from `600000` was only 33 milliseconds because a small amount of time passed while the code executed.

---

# Checkpoint 13 — Connecting Booking Creation to BullMQ

Previously, BullMQ was tested manually using:

```text
test-queue.js
```

The actual booking system was then connected directly to the queue.

At the top of the booking controller:

```js
const holdQueue = require("../queues/hold.queue");
```

After the PostgreSQL transaction commits:

```js
await client.query("COMMIT");
```

the controller calculates:

```js
const delayMs =
    new Date(booking.expires_at).getTime()
    - Date.now();
```

Then creates the delayed job:

```js
await holdQueue.add(
    "release-hold",
    {
        bookingId: booking.id,
    },
    {
        delay: delayMs,
    }
);
```

---

# Why the BullMQ Job Is Added After COMMIT

The flow is intentionally:

```text
BEGIN
   ↓
Create booking
   ↓
Create booking seats
   ↓
Hold seats
   ↓
COMMIT
   ↓
Add BullMQ job
```

We don't want:

```text
BEGIN
   ↓
Create booking
   ↓
Add BullMQ job
   ↓
Database transaction fails
   ↓
ROLLBACK
```

because that could leave a BullMQ job referring to a booking that never successfully committed.

Therefore the current learning implementation adds the job after the PostgreSQL transaction commits.

---

# How BullMQ and PostgreSQL Are Connected

BullMQ is not directly connected to PostgreSQL.

The Node.js application is the bridge.

Architecture:

```text
                 Node.js
              /           \
             ↓             ↓
       PostgreSQL        BullMQ
                            ↓
                          Redis
                            ↓
                          Worker
                            ↓
                       PostgreSQL
```

The producer:

```js
holdQueue.add(...)
```

puts a job into the:

```text
seat-hold
```

queue.

The worker:

```js
new Worker("seat-hold", ...)
```

listens to that same queue.

Redis is the shared infrastructure that stores and coordinates the jobs.

---

# Complete Automatic Hold Expiration Flow

The complete flow is now:

```text
User
  ↓
POST /api/events/:eventId/bookings
  ↓
createBooking()
  ↓
BEGIN
  ↓
Lock requested event seats
  ↓
Check availability
  ↓
Create booking
  ↓
expires_at = current time + 10 minutes
  ↓
Create booking_seats
  ↓
Seats → held
  ↓
COMMIT
  ↓
Calculate BullMQ delay
  ↓
Add release-hold job
  ↓
Redis / BullMQ
  ↓
Wait until expiration
  ↓
Worker receives bookingId
  ↓
BEGIN
  ↓
SELECT booking FOR UPDATE
  ↓
Check current status
  ↓
If pending
  ↓
Booking → expired
  ↓
Seats → available
  ↓
COMMIT
```

---

# Test That Proved the Integration Works

A new booking was created using available seats.

Example booking:

```text
Booking ID: 7
User ID: 1
Event ID: 1
Total: 998
Status: pending
```

The BullMQ job was automatically created from the booking controller.

After the delay, the worker printed:

```text
Job received: release-hold
Job data: { bookingId: '7' }

Booking found: {
  id: '7',
  user_id: '1',
  event_id: '1',
  total_amount: '998.00',
  status: 'pending'
}

Booking 7 expired
Seats for booking 7 released
Job completed: 12
```

This proved that the complete automatic flow works.

---

# Important Concept — HELD vs BOOKED

A seat being `held` does NOT mean the user permanently owns it.

Current intended lifecycle:

```text
AVAILABLE
    ↓
User selects seat
    ↓
HELD
    │
    ├── Payment/confirmation succeeds
    │        ↓
    │      BOOKED
    │
    └── Time expires
             ↓
          AVAILABLE
```

Booking lifecycle:

```text
PENDING
   │
   ├── payment success → CONFIRMED
   │
   └── timeout → EXPIRED
```

The actual payment/confirmation flow has not yet been implemented.

---

# Important Concept — What Happens to the BullMQ Job After Payment?

Suppose:

```text
Booking = pending
Seats = held
```

The user completes payment before the 10-minute expiration.

The booking should become:

```text
confirmed
```

The seats should become:

```text
booked
```

The BullMQ expiration job may still run later.

When it runs, the worker checks PostgreSQL:

```text
status = confirmed
```

Therefore:

```text
status !== pending
```

and the worker does nothing.

This is why the worker checks the current database state rather than blindly expiring the booking.

---

# Current Seat Lifecycle

```text
┌───────────┐
│ AVAILABLE │
└─────┬─────┘
      │
      │ booking created
      ↓
┌───────────┐
│   HELD    │
└─────┬─────┘
      │
      ├───────────────┐
      │               │
      │ payment       │ timeout
      │ successful    │
      ↓               ↓
┌───────────┐    ┌───────────┐
│  BOOKED   │    │ AVAILABLE │
└───────────┘    └───────────┘
```

---

# Current Booking Lifecycle

```text
┌─────────┐
│ PENDING │
└────┬────┘
     │
     ├───────────────┐
     │               │
     │ payment       │ timeout
     │ success       │
     ↓               ↓
┌───────────┐   ┌─────────┐
│ CONFIRMED │   │ EXPIRED │
└───────────┘   └─────────┘
```

---

# Major Concepts Learned So Far

## PostgreSQL

* Relational database design
* Primary keys
* Foreign keys
* Unique constraints
* Check constraints
* One-to-many relationships
* Event-specific seat inventory
* SQL joins
* `UPDATE ... FROM`
* Transactions
* `BEGIN`
* `COMMIT`
* `ROLLBACK`
* `SELECT ... FOR UPDATE`
* Row-level locking
* Consistent lock ordering
* PostgreSQL as source of truth

## Redis

* Key-value storage
* Redis commands
* TTL
* Automatic key expiration
* Redis as infrastructure for BullMQ
* Why Redis expiration does not automatically modify PostgreSQL

## BullMQ

* Jobs
* Queues
* Producers
* Workers
* Redis-backed job storage
* Delayed jobs
* Queue names
* Worker listening
* Passing identifiers through jobs
* Querying fresh database state inside workers

## Backend Concurrency

* Preventing double booking
* Row-level locking
* Transactional consistency
* Race conditions
* Payment vs expiration race
* Atomic operations
* Avoiding partial database updates

---

# Current Implementation Status

## Completed

* PostgreSQL database setup
* Relational database schema
* Users
* Venues
* Events
* Physical seats
* Event-specific seats
* Bookings
* Booking seats
* Payments table
* Tickets table
* PostgreSQL connection from Node.js
* Booking creation
* Seat availability checking
* Transactional booking
* Row-level seat locking
* Redis setup
* Redis Node.js integration
* Redis TTL experiments
* BullMQ setup
* BullMQ worker
* Delayed jobs
* PostgreSQL integration inside worker
* Booking expiration worker
* Seat release after expiration
* `expires_at`
* Dynamic BullMQ delay
* Automatic BullMQ job creation from booking creation
* End-to-end automatic hold expiration

---

# Not Implemented Yet

* Actual payment integration
* Payment confirmation flow
* Booking confirmation
* Changing event seats from `held` → `booked`
* Payment webhooks
* Payment idempotency
* Ticket generation
* QR code generation
* Authentication/authorization for the final booking flow
* Redis production hold strategy
* Docker Compose
* Load/concurrency testing
* Deployment
* Observability/logging improvements

---

# Current Important Architecture

```text
                    SeatVault
                       │
                       ↓
                Express Backend
                       │
          ┌────────────┴────────────┐
          ↓                         ↓
     PostgreSQL                  BullMQ
          │                         │
 Source of truth                  Redis
          │                         │
          │                      Worker
          │                         │
          └────────────┬────────────┘
                       ↓
                  PostgreSQL
```

PostgreSQL remains the source of truth for:

* Booking status
* Seat status
* Prices
* Relationships
* Expiration timestamp

Redis/BullMQ handles:

* Delayed background work
* Scheduling booking expiration
* Worker execution

---

# Latest Git Checkpoint

Suggested commit:

```bash
git add .
git commit -m "feat: connect booking holds with BullMQ expiration"
```

This checkpoint represents the successful end-to-end implementation of:

```text
Booking
   ↓
Seat hold
   ↓
expires_at
   ↓
BullMQ delayed job
   ↓
Worker
   ↓
Booking expiration
   ↓
Seat release
```

---

# Next Learning Goal

The next major feature is the **booking confirmation/payment flow**.

The intended flow is:

```text
HELD
  ↓
User completes payment
  ↓
Payment succeeds
  ↓
Booking → CONFIRMED
  ↓
Seats → BOOKED
```

The important concurrency case to study will be:

```text
Payment confirmation
        vs
Expiration worker
```

Both may attempt to modify the same booking near the expiration time.

This will build on the concepts already learned:

* Transactions
* `FOR UPDATE`
* Current database state
* Atomic updates
* Race conditions
* BullMQ delayed jobs

```

### Current checkpoint

At this point, the **temporary hold → automatic expiration → seat release** system is fully working end-to-end.

The next major concept is **confirming a held booking before its expiration**, which will complete the other branch of the booking lifecycle.
```

```
