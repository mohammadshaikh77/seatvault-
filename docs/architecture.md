
# SeatVault — System Architecture

## 1. Architecture Style

SeatVault will use a modular monolithic architecture.

The application will initially run as one backend service, but its internal
code will be divided into clear modules.

This allows us to learn and implement the system without the complexity
of microservices.

---

## 2. High-Level Architecture

```text
Client
  |
  v
Express API
  |
  v
Routes
  |
  v
Middleware
  |
  v
Controllers
  |
  v
Services
  |
  +------------------+
  |                  |
  v                  v
PostgreSQL          Redis
  |
  v
Background Jobs
(BullMQ + Worker)
````

## 3. Request Flow

A typical request will follow this structure:

```
Client Request
      |
      v
Route
      |
      v
Authentication / Validation Middleware
      |
      v
Controller
      |
      v
Service
      |
      v
Database / Redis / External Service
      |
      v
Service Response
      |
      v
Controller Response
      |
      v
Client
```

### Responsibilities

#### Routes

Routes define the API endpoints and connect them to controllers.

Example:

```
POST /api/bookings
```

#### Middleware

Middleware handles cross-cutting responsibilities such as:

* Authentication

* Role authorization

* Request validation

* Rate limiting

* Error forwarding

#### Controllers

Controllers handle HTTP-specific responsibilities:

* Reading request data

* Calling services

* Returning HTTP responses

Controllers should not contain complex booking logic.

#### Services

Services contain the main business logic.

Examples:

* Checking seat availability

* Holding seats

* Creating bookings

* Processing payments

* Confirming tickets

#### Database Layer

The database layer handles communication with PostgreSQL.

It will manage:

* Users

* Events

* Venues

* Seats

* Bookings

* Payments

* Tickets

#### Redis

Redis will be used for:

* Temporary seat holds

* Hold expiration tracking

* Caching frequently accessed data

* Rate limiting where appropriate

#### Background Worker

Background jobs will handle tasks that do not need to block the main API request.

Examples:

* Releasing expired holds

* Sending booking notifications

* Generating tickets

* Processing payment-related events

## 4. Main Application Modules

The backend will eventually contain these modules:

```
src/
├── config/
├── routes/
├── controllers/
├── services/
├── models/
├── repositories/
├── middleware/
├── validators/
├── utils/
└── workers/
```

### Planned Feature Modules

* Authentication

* Users

* Events

* Venues

* Seats

* Bookings

* Payments

* Tickets

* Admin

## 5. Core Booking Architecture

The booking process will be divided into separate stages.

```
1. User selects seats
        |
        v
2. System checks seat availability
        |
        v
3. Database transaction locks relevant seat records
        |
        v
4. System creates a temporary hold
        |
        v
5. User proceeds to payment
        |
        v
6. Payment succeeds
        |
        v
7. Booking becomes confirmed
        |
        v
8. Tickets are generated
```

If the hold expires or payment fails:

```
Hold / Booking is released
        |
        v
Seats become available again
```

## 6. Preventing Double-Booking

SeatVault must guarantee that two users cannot successfully purchase the same seat for the same event.

This will be enforced through multiple layers:

### Database Layer

* Unique constraints

* Transactions

* Row-level locking

* Correct booking-seat relationships

### Application Layer

* Seat availability checks

* Booking state validation

* Idempotent operations

### Redis Layer

* Temporary hold tracking

* Hold expiration

* Fast availability-related operations

The database will remain the final source of truth for confirmed bookings.

Redis will not replace PostgreSQL as the authoritative booking database.

## 7. Architectural Principles

SeatVault will follow these principles:

1. Keep controllers thin.

2. Place business logic inside services.

3. Keep database operations isolated.

4. Validate incoming requests.

5. Use transactions for multi-step booking operations.

6. Treat PostgreSQL as the source of truth for bookings.

7. Use Redis for temporary state and performance improvements.

8. Make payment processing idempotent.

9. Keep version 1 modular but avoid premature microservices.

10. Prefer correctness over premature optimization.

```
---
```

````
## Important Concept: Why Modular Monolith?

Unlike Job Board, SeatVault has more complex interactions between:

- Database transactions
- Redis
- Payments
- Background jobs
- Booking state

But we will **not** immediately create separate microservices.

We’ll first build a well-organized single backend. Later, we can discuss which parts might need independent scaling.

---

## Next Step

Save `architecture.md`.

Then update `LEARNING_LOG.md` by adding this section at the bottom:

```markdown
## Phase 1.3 — System Architecture

### Completed

- Defined the modular monolithic architecture.
- Defined the request flow from routes to services.
- Identified the responsibilities of controllers and services.
- Planned PostgreSQL, Redis, and background worker integration.
- Identified the architecture for preventing double-booking.

### Key Understanding

SeatVault will use PostgreSQL as the source of truth for confirmed bookings.
Redis will support temporary seat holds and performance-related tasks,
but it will not replace the database.

### Next Step

Finalize the version 1 database entities and relationships.
````


