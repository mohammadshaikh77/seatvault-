# SeatVault — Database Schema Design

## 1. Database Choice

SeatVault will use PostgreSQL as its primary database.

PostgreSQL is suitable because SeatVault requires:

- Strong relationships between entities.
- Foreign key constraints.
- Unique constraints.
- Transactions.
- Row-level locking.
- Reliable consistency during concurrent bookings.

PostgreSQL will be the source of truth for confirmed bookings and payments.

---

## 2. Main Entities

The initial database will contain the following tables:

1. users
2. venues
3. seats
4. events
5. bookings
6. booking_seats
7. payments
8. tickets

---

## 3. Entity Responsibilities

### 3.1 users

Stores all platform users.

Possible fields:

- id
- name
- email
- password_hash
- role
- created_at
- updated_at

Possible roles:

- buyer
- organizer
- admin

---

### 3.2 venues

Stores locations where events take place.

Possible fields:

- id
- name
- address
- city
- capacity
- created_by
- created_at
- updated_at

The created_by field references the organizer or user who created
the venue.

---

### 3.3 seats

Stores individual seats belonging to a venue.

Possible fields:

- id
- venue_id
- section
- row_label
- seat_number
- created_at

Each seat belongs to exactly one venue.

A venue can contain many seats.

A seat identity must be unique within its venue.

For example:

- Venue A, Section A, Row 1, Seat 1
- Venue A, Section A, Row 1, Seat 2
- Venue A, Section B, Row 1, Seat 1

The same seat number may exist in different sections.

---

### 3.4 events

Stores events created by organizers.

Possible fields:

- id
- title
- description
- category
- event_date
- start_time
- venue_id
- organizer_id
- status
- created_at
- updated_at

Possible statuses:

- draft
- published
- cancelled
- completed

Each event takes place at one venue.

An organizer can create multiple events.

---

### 3.5 bookings

Represents a buyer's booking attempt or completed reservation.

Possible fields:

- id
- booking_reference
- user_id
- event_id
- status
- total_amount
- expires_at
- created_at
- updated_at

Possible statuses:

- pending
- confirmed
- cancelled
- expired
- refunded

The expires_at field is useful for temporary booking holds.

---

### 3.6 booking_seats

This is a junction table connecting bookings and seats.

Possible fields:

- id
- booking_id
- event_id
- seat_id
- price
- created_at

This table is required because:

- One booking can contain multiple seats.
- One seat can be booked for different events.
- A booking and a seat have a many-to-many relationship across events.

The database must enforce that the same seat cannot be confirmed
twice for the same event.

---

### 3.7 payments

Stores payment information associated with bookings.

Possible fields:

- id
- booking_id
- payment_reference
- amount
- status
- provider
- paid_at
- created_at
- updated_at

Possible statuses:

- pending
- successful
- failed
- refunded

For the initial version, payment processing may be simulated.

---

### 3.8 tickets

Stores tickets generated after successful booking.

Possible fields:

- id
- ticket_reference
- booking_id
- booking_seat_id
- qr_code_data
- status
- issued_at
- created_at

Possible statuses:

- valid
- used
- cancelled

Each confirmed seat should produce an individual ticket.

---

## 4. Relationships

### Users

- One user can create many events.
- One user can create many bookings.
- One user can make many payments through bookings.

### Venues

- One venue can contain many seats.
- One venue can host many events.

### Events

- One event belongs to one venue.
- One event belongs to one organizer.
- One event can have many bookings.

### Bookings

- One booking belongs to one buyer.
- One booking belongs to one event.
- One booking can contain many seats.
- One booking can have payment records.
- One booking can generate multiple tickets.

### Seats

- One seat belongs to one venue.
- A seat can be booked for multiple different events.
- A seat must not be sold twice for the same event.

---

## 5. Relationship Diagram

```text
users
  |
  | 1-to-many
  v
events -------- many-to-one -------- venues
  |                                  |
  |                                  | 1-to-many
  |                                  v
  |                                seats
  |
  | 1-to-many
  v
bookings
  |
  | 1-to-many
  v
booking_seats -------- many-to-one -------- seats
  |
  | 1-to-many
  v
tickets

bookings
  |
  | 1-to-many
  v
payments

# Phase 1.4 — Design the PostgreSQL Database

This is our first major new concept compared with Job Board.

Before creating tables, we need to understand how SeatVault’s data is connected—especially events, seats, bookings, and booking history.

## Step 1: Create a new documentation file

Inside `docs/`, create:

```
database-schema.md
```

Your structure becomes:

```
seatvault/
├── backend/
├── docs/
│   ├── requirements.md
│   ├── architecture.md
│   └── database-schema.md
├── LEARNING_LOG.md
└── README.md
```

# Step 2: Add the initial database design

Paste this into `docs/database-schema.md`:

Markdown

````
# SeatVault — Database Schema Design

## 1. Database Choice

SeatVault will use PostgreSQL as its primary database.

PostgreSQL is suitable because SeatVault requires:

- Strong relationships between entities.
- Foreign key constraints.
- Unique constraints.
- Transactions.
- Row-level locking.
- Reliable consistency during concurrent bookings.

PostgreSQL will be the source of truth for confirmed bookings and payments.

---

## 2. Main Entities

The initial database will contain the following tables:

1. users
2. venues
3. seats
4. events
5. bookings
6. booking_seats
7. payments
8. tickets

---

## 3. Entity Responsibilities

### 3.1 users

Stores all platform users.

Possible fields:

- id
- name
- email
- password_hash
- role
- created_at
- updated_at

Possible roles:

- buyer
- organizer
- admin

---

### 3.2 venues

Stores locations where events take place.

Possible fields:

- id
- name
- address
- city
- capacity
- created_by
- created_at
- updated_at

The created_by field references the organizer or user who created
the venue.

---

### 3.3 seats

Stores individual seats belonging to a venue.

Possible fields:

- id
- venue_id
- section
- row_label
- seat_number
- created_at

Each seat belongs to exactly one venue.

A venue can contain many seats.

A seat identity must be unique within its venue.

For example:

- Venue A, Section A, Row 1, Seat 1
- Venue A, Section A, Row 1, Seat 2
- Venue A, Section B, Row 1, Seat 1

The same seat number may exist in different sections.

---

### 3.4 events

Stores events created by organizers.

Possible fields:

- id
- title
- description
- category
- event_date
- start_time
- venue_id
- organizer_id
- status
- created_at
- updated_at

Possible statuses:

- draft
- published
- cancelled
- completed

Each event takes place at one venue.

An organizer can create multiple events.

---

### 3.5 bookings

Represents a buyer's booking attempt or completed reservation.

Possible fields:

- id
- booking_reference
- user_id
- event_id
- status
- total_amount
- expires_at
- created_at
- updated_at

Possible statuses:

- pending
- confirmed
- cancelled
- expired
- refunded

The expires_at field is useful for temporary booking holds.

---

### 3.6 booking_seats

This is a junction table connecting bookings and seats.

Possible fields:

- id
- booking_id
- event_id
- seat_id
- price
- created_at

This table is required because:

- One booking can contain multiple seats.
- One seat can be booked for different events.
- A booking and a seat have a many-to-many relationship across events.

The database must enforce that the same seat cannot be confirmed
twice for the same event.

---

### 3.7 payments

Stores payment information associated with bookings.

Possible fields:

- id
- booking_id
- payment_reference
- amount
- status
- provider
- paid_at
- created_at
- updated_at

Possible statuses:

- pending
- successful
- failed
- refunded

For the initial version, payment processing may be simulated.

---

### 3.8 tickets

Stores tickets generated after successful booking.

Possible fields:

- id
- ticket_reference
- booking_id
- booking_seat_id
- qr_code_data
- status
- issued_at
- created_at

Possible statuses:

- valid
- used
- cancelled

Each confirmed seat should produce an individual ticket.

---

## 4. Relationships

### Users

- One user can create many events.
- One user can create many bookings.
- One user can make many payments through bookings.

### Venues

- One venue can contain many seats.
- One venue can host many events.

### Events

- One event belongs to one venue.
- One event belongs to one organizer.
- One event can have many bookings.

### Bookings

- One booking belongs to one buyer.
- One booking belongs to one event.
- One booking can contain many seats.
- One booking can have payment records.
- One booking can generate multiple tickets.

### Seats

- One seat belongs to one venue.
- A seat can be booked for multiple different events.
- A seat must not be sold twice for the same event.

---

## 5. Relationship Diagram

```text
users
  |
  | 1-to-many
  v
events -------- many-to-one -------- venues
  |                                  |
  |                                  | 1-to-many
  |                                  v
  |                                seats
  |
  | 1-to-many
  v
bookings
  |
  | 1-to-many
  v
booking_seats -------- many-to-one -------- seats
  |
  | 1-to-many
  v
tickets

bookings
  |
  | 1-to-many
  v
payments
````

## 6. Important Database Constraints

The database should enforce the following rules:

### Users

* Email must be unique.

* Role must contain an allowed value.

### Venues

- Capacity must be greater than zero.

### Seats

* A seat must belong to a valid venue.

* The combination of venue_id, section, row_label, and seat_number must be unique.

### Events

* An event must reference a valid venue.

* An event must reference a valid organizer.

### Bookings

* A booking must reference a valid buyer.

* A booking must reference a valid event.

* Booking references must be unique.

### Booking Seats

* A booking-seat record must reference a valid booking.

* A booking-seat record must reference a valid seat.

* A seat must belong to the venue where the event is hosted.

* The same seat must not be confirmed twice for the same event.

### Payments

* A payment must reference a valid booking.

* Payment references should be unique where appropriate.

### Tickets

* Ticket references must be unique.

* A ticket must reference a valid booking seat.

## 7. Critical Double-Booking Rule

The most important business rule is:

> A seat can be sold only once for a particular event.

A seat may be sold for multiple different events because the same venue and physical seat can host different events on different dates.

Example:

|
Event

|

Seat

|

Allowed?

|
| --- | --- | --- |
|

Concert A

|

A-1

|

Yes

|
|

Concert B

|

A-1

|

Yes

|
|

Concert A

|

A-1 again

|

No

|

This rule will later be protected using:

* Database constraints.

* Transactions.

* Row-level locks.

* Booking status checks.

* Application-level validation.

## 8. Design Decision

Seat availability is event-specific.

We will not permanently mark a physical seat as globally booked.

Instead, availability will be calculated based on:

* The event.

* The venue's seats.

* Existing active holds.

* Confirmed bookings for that event.

This allows the same venue and seats to be reused for future events.

````
---

# Step 3: Important Concept

Notice this key design:

```text
seats
````

stores the physical seat.

But:

```
booking_seats
```

stores the seat’s participation in a specific event booking.

That distinction is essential.

For example:

```
Seat A-1
   ├── Concert A → Booked
   ├── Concert B → Available
   └── Concert C → Booked
```

We do not change the physical seat itself to `booked = true`.

## 9. Important Design Decision: Booking Lifecycle

SeatVault will use the bookings table to represent both temporary
reservations and completed bookings.

A booking will begin with a pending status.

After successful payment, it will become confirmed.

Possible lifecycle:

```text
pending → confirmed
pending → expired
pending → cancelled
confirmed → refunded

The expires_at field will determine when a pending booking should expire.

This avoids creating separate tables for temporary holds and bookings during the initial version.

10. Event-Specific Seat Inventory

A physical seat belongs to a venue, but its availability is specific to an event.

For this reason, SeatVault will use an event_seats table.

event_seats

This table connects a physical seat to a particular event.

Possible fields:

id

event_id

seat_id

price

status

created_at

updated_at

Possible statuses:

available

held

booked

blocked

Why event_seats is necessary

The same physical seat can be used for multiple events.

For example:

Event

	

Physical Seat

	

Status




Concert A

	

A-1

	

booked




Concert B

	

A-1

	

available




Concert C

	

A-1

	

held

The seat itself does not permanently store booking status.

Instead, event_seats stores the status of that seat for a specific event.

11. Updated Booking Relationship

The booking process will use this relationship:

events
   |
   v
event_seats
   |
   v
booking_seats
   |
   v
bookings

A booking will reference event-specific seats through booking_seats.

This makes it easier to:

Check availability.

Lock seats during a transaction.

Prevent double-booking.

Track event-specific pricing.

Reuse the same venue for different events.

12. Double-Booking Protection

The database will eventually enforce that an event-specific seat cannot be successfully booked more than once.

The application will use:

Transactions.

Row-level locking.

Seat status checks.

Foreign keys.

Unique constraints where appropriate.

PostgreSQL will remain the final source of truth for confirmed bookings.

Redis will assist with temporary hold expiration and fast access, but Redis will not replace PostgreSQL.


---

# Step 2: Update the Main Entity List

At the top of the same file, find:

```text
1. users
2. venues
3. seats
4. events
5. bookings
6. booking_seats
7. payments
8. tickets

Replace it with:

1. users
2. venues
3. seats
4. events
5. event_seats
6. bookings
7. booking_seats
8. payments
9. tickets

Also add event_seats to the Entity Responsibilities section.

Key Concept to Understand
seats = physical seats inside a venue
event_seats = those seats made available for a particular event
booking_seats = seats selected in a user's booking

This separation is one of the most important database design decisions in SeatVault.
