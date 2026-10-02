# UrbanTrim Backend

**A multi-tenant booking API for barber shops and salons, written as a case study in building a SaaS backend from scratch.**

Many salons share one backend and one database. Each salon's staff, services, customers and bookings stay invisible to every other salon. Customers book without creating an account: they confirm with a 6-digit code sent to their email.

| | |
|---|---|
| **Type** | REST API (backend only) |
| **Stack** | Node.js, TypeScript, Express 5, PostgreSQL, Prisma 7 |
| **Auth** | JWT access and refresh tokens (Passport), email one-time codes |
| **Validation** | Joi |
| **Docs** | OpenAPI 3 with Swagger UI at `/docs` |
| **Tests** | Vitest (19 unit tests) |
| **Tooling** | Docker Compose for local development |
| **Status** | In development. Auth, staff and customer booking flows work. See [Known limitations](#9-known-limitations-and-next-steps). |

---

## Contents

1. [The problem](#1-the-problem)
2. [Goals](#2-goals)
3. [Architecture](#3-architecture)
4. [Data model](#4-data-model)
5. [Design decisions](#5-design-decisions)
6. [API overview](#6-api-overview)
7. [Problems I hit and what they taught me](#7-problems-i-hit-and-what-they-taught-me)
8. [Testing](#8-testing)
9. [Known limitations and next steps](#9-known-limitations-and-next-steps)
10. [Running the project](#10-running-the-project)
11. [Project structure](#11-project-structure)

---

## 1. The problem

A small salon needs online booking, but it can't build or host its own system. The usual answer is a shared platform: one product, many salons.

That creates three problems a single-shop app never has:

- **Isolation.** Salon A must never read or change Salon B's data, even by mistake, even with a valid login.
- **Three kinds of people.** The platform owner, the salon's staff and the salon's customers all need different access, and a token for one must not work as another.
- **Friction for customers.** Someone booking a haircut won't create an account and remember a password for it.

UrbanTrim is my attempt to solve those three problems properly on the backend.

## 2. Goals

| Goal | How it shows up in the code |
|---|---|
| One database, many salons, no data leaks | Every tenant-owned row carries a `tenantId`, the token carries it too, and queries filter on it |
| Separate access for platform, staff and customers | Three Passport JWT strategies, a separate signing secret for the platform owner, and a role-to-permission map for staff |
| Booking without an account | Email + 6-digit code. Confirming the code confirms the booking and logs the customer in |
| Bad input never reaches business logic | A Joi schema on every route, checked by one `validate` middleware |
| One error format everywhere | All errors pass through one converter and one handler |
| An API a frontend developer can use without asking me | OpenAPI docs next to the routes, served at `/docs` |

## 3. Architecture

The code is layered. Each layer has one job, and a request passes through them in order.

```
Request
   │
   ▼
Route            URL + method, and which middlewares run
   │
   ▼
auth middleware  Who are you? (Passport JWT)  Are you allowed? (role permissions)
   │
   ▼
validate         Is the body / query / params valid? (Joi)  → 400 if not
   │
   ▼
Controller       Reads the request, calls services, chooses the status code
   │
   ▼
Service          Business rules. The only layer that talks to Prisma
   │
   ▼
Prisma  ──►  PostgreSQL

Any error, from any layer ──► errorConverter ──► errorHandler ──► { statusCode, message }
```

Why layers: controllers stay small and readable, and services can be unit tested with a fake database because they don't know anything about HTTP.

## 4. Data model

```mermaid
erDiagram
    Tenant ||--o{ User : employs
    Tenant ||--o{ Service : offers
    Tenant ||--o{ Customer : has
    Tenant ||--o{ Booking : owns
    Service ||--o{ Booking : "booked as"
    Customer ||--o{ Booking : makes
    User |o--o{ Booking : "assigned to"

    Tenant {
        uuid id PK
        string name
        string email UK
        boolean suspended
    }
    User {
        uuid id PK
        string email UK
        string password
        Role role
        boolean isEmailVerified
        uuid tenantId FK
    }
    Service {
        int id PK
        string name
        int price
        uuid tenantId FK
    }
    Customer {
        uuid id PK
        string name
        string phone
        string email
        uuid tenantId FK
    }
    Booking {
        int id PK
        datetime date
        Status status
        uuid tenantId FK
        int serviceId FK
        uuid customerId FK
        uuid staffId FK
    }
    Token {
        int id PK
        string token
        TokenType type
        datetime expires
        OwnerType ownerType
        string ownerId
    }
    SuperAdmin {
        uuid id PK
        string email UK
        string password
    }
```

Things worth noticing:

- **`Customer` is unique per salon, not globally.** The constraints are `(tenantId, email)` and `(tenantId, phone)`. The same person can be a customer of two salons, and each salon sees its own record.
- **`User.email` is unique globally.** A staff login is one email and one password, with no "which salon?" question at login.
- **`Token` has no foreign key.** It stores `ownerType` (`USER`, `CUSTOMER`, `SUPERADMIN`) and `ownerId`, so one table serves all three kinds of account and all five token types (`ACCESS`, `REFRESH`, `RESET_PASSWORD`, `VERIFY_EMAIL`, `OTP`).

## 5. Design decisions

### 5.1 Multi-tenancy: shared database, `tenantId` on every row

**Options.** A database per salon, a schema per salon, or shared tables with a tenant column.

**Choice.** Shared tables with a `tenantId` column.

**Why.** One set of migrations, one connection pool, and a new salon is a single `INSERT`. For many small tenants this is the cheapest model to run.

**The cost.** Isolation is now my job in every query, not the database's. I handle it in three places:

1. The staff JWT carries `tenantId`. Controllers take the tenant from the **token**, never from the request body, so a client can't ask for another salon's data by changing a field.
2. Services filter by it: `where: { id: userId, tenantId }`.
3. A row from another salon returns **404, not 403**. The response doesn't reveal that the row exists.

The riskiest spot was booking: a customer sends a `serviceId`, and service ids are simple integers. Without a tenant check, a request to Salon A could book Salon B's service. `createBookingRequest` looks the service up with both `id` and `tenantId`, and there is a unit test that proves the cross-tenant request is refused.

### 5.2 Three actors, three authentication strategies

| Actor | Passport strategy | Signing secret | Middleware | Sets |
|---|---|---|---|---|
| Platform owner | `jwt-superadmin` | `SUPER_ADMIN_JWT_SECRET` | `authSuperAdmin` | `req.superAdmin` |
| Salon staff | `jwt-user` | `JWT_SECRET` | `auth(...permissions)` | `req.user` |
| Customer | `jwt-customer` | `JWT_SECRET` | `customerAuth` | `req.customer` |

The platform owner's tokens are signed with a **different secret**. A leaked staff secret can't be used to forge a platform-owner token. Every strategy also rejects any token whose `type` is not `ACCESS`, so a refresh token or an email token can't be used as a login.

### 5.3 Access and refresh tokens, with rotation

- Access token: short-lived (30 minutes by default), never stored.
- Refresh token: long-lived (30 days by default), **stored in the database**.

Using a refresh token deletes it and issues a new pair. Logging out deletes it. Because the server keeps the list of valid refresh tokens, a session can be ended from the server side, which a pure stateless JWT can't do.

### 5.4 Customers book without a password

```mermaid
sequenceDiagram
    participant C as Customer
    participant API
    participant DB
    participant Mail

    C->>API: POST /bookings (name, phone, email, serviceId, date)
    API->>DB: Is this service in this salon?
    API->>DB: Find or create the customer (tenantId + email)
    API->>DB: Create a PENDING booking, or update the existing one
    API->>DB: Save a bcrypt hash of a 6-digit code (5 minutes)
    API->>Mail: Send the code
    API-->>C: 201 { bookingId }

    C->>API: POST /bookings/{id}/confirm (email, code)
    API->>DB: Compare the code with the stored hashes
    API->>DB: Delete the used codes, set the booking to CONFIRMED
    API-->>C: 200 { booking, authTokens }
```

Decisions inside this flow:

- **The code is stored hashed** with bcrypt, like a password. A database leak doesn't expose usable codes.
- **The code is generated with `crypto.randomInt`**, not `Math.random`.
- **One pending booking per customer.** If a customer already has a `PENDING` booking, a new request updates it instead of creating a second one. This stops a customer from piling up unconfirmed slots while still letting them change their mind before confirming.
- **Confirming logs the customer in.** They get tokens and can then view, cancel or reschedule their bookings.

### 5.5 Role-based access for staff

Roles (`OWNER`, `MANAGER`, `RECEPTIONIST`, `ASSISTANT`, `STAFF`) map to permission strings in [`src/config/role.ts`](src/config/role.ts). Routes ask for a **permission**, not a role:

```ts
router.post('/', auth('manage_staff'), validate(userValidation.createUser), userController.createUser)
```

Adding a role, or moving a permission between roles, is a change to one map and to no route.

### 5.6 One validation middleware, one error format

Every route declares a Joi schema for `body`, `query` and `params`. The `validate` middleware checks all of them, collects **every** problem into one message, and returns 400 before the controller runs.

Every error then leaves through the same handler:

```json
{ "statusCode": 400, "message": "\"email\" must be a valid email" }
```

In development the response also includes the stack trace. In production, an unexpected error (anything that is not a deliberate `ApiError`) is replaced with a generic 500, so internals don't leak.

## 6. API overview

Base path: `/v1`. Interactive docs: **`/docs`**.

### Staff authentication: `/v1/auth`

| Method | Path | Purpose | Auth |
|---|---|---|---|
| POST | `/register` | Create a salon and its owner account | Public |
| POST | `/login` | Log in | Public |
| POST | `/logout` | Invalidate a refresh token | Public |
| POST | `/refresh-tokens` | Exchange a refresh token for a new pair | Public |
| POST | `/forgot-pass` | Email a password-reset link | Public |
| POST | `/reset-pass?token=` | Set a new password | Public |
| POST | `/send-verification-email` | Email a verification link | Staff |
| POST | `/verify-email?token=` | Mark the email as verified | Public |

### Staff management: `/v1/user`

| Method | Path | Purpose | Permission |
|---|---|---|---|
| POST | `/` | Add a staff member to your salon | `manage_staff` |
| GET | `/` | List staff (filter, sort, paginate) | `get_staff` |
| GET | `/{userId}` | Get one staff member | `get_staff` |
| PATCH | `/{userId}` | Update a staff member | `manage_staff` |
| DELETE | `/{userId}` | Remove a staff member | `manage_staff` |

### Customers and bookings: `/v1/tenants/{tenantId}/customers`

| Method | Path | Purpose | Auth |
|---|---|---|---|
| POST | `/bookings` | Request a booking, receive a code by email | Public |
| POST | `/bookings/{bookingId}/confirm` | Confirm with the code, receive tokens | Public |
| GET | `/bookings` | List my bookings | Customer |
| GET | `/me` | Get my profile | Customer |
| PATCH | `/me` | Update my profile | Customer |
| PATCH | `/bookings/{bookingId}/cancel` | Cancel my booking | Customer |
| PATCH | `/bookings/{bookingId}/reschedule` | Change my booking's date | Customer |

### Platform owner: `/v1/superadmin`

| Method | Path | Purpose | Auth |
|---|---|---|---|
| POST | `/auth/login` | Log in | Public |
| POST | `/auth/logout` | Invalidate a refresh token | Public |
| POST | `/auth/refresh-tokens` | Exchange a refresh token | Public |
| POST | `/auth/forgot-password` | Email a password-reset link | Public |
| POST | `/auth/reset-password?token=` | Set a new password | Public |
| POST | `/tenant` | Create a salon and its owner | Super admin |
| GET | `/tenant` | List salons | Super admin |
| GET | `/tenant/{tenantId}` | Get one salon | Super admin |
| PATCH | `/tenant/{tenantId}` | Update a salon | Super admin |
| DELETE | `/tenant/{tenantId}` | Delete a salon | Super admin |
| GET | `/user/tenant/{tenantId}` | List a salon's staff | Super admin |
| GET | `/user/{userId}` | Get any staff member | Super admin |
| PATCH | `/user/{userId}` | Update any staff member | Super admin |
| DELETE | `/user/{userId}` | Delete any staff member | Super admin |

34 endpoints in total. The staff and customer endpoints (20) are documented in Swagger. The platform-owner endpoints are not documented there yet.

### Status codes

| Code | Used when |
|---|---|
| 200 / 201 / 204 | Success with data / something was created / success with nothing to return |
| 400 | The input failed validation, or the email is already taken |
| 401 | No token, a bad or expired token, wrong credentials, or a wrong one-time code |
| 403 | Logged in, but the role lacks the permission |
| 404 | The record doesn't exist, **or it belongs to another salon** |

## 7. Problems I hit and what they taught me

This is the part of the project I learned the most from. Each of these passed TypeScript's checks. I found them only by documenting each endpoint and then calling it, with good input and with bad input.

### 7.1 Validation that silently did nothing (Express 5)

**What I saw.** Calling `verify-email` with no token returned **401** from the service, when it should have been stopped with **400** by validation.

**Cause.** The `validate` middleware collected the parts of the request with a helper that only copies a key if `Object.hasOwn(req, key)` is true. In Express 5, `req.query` is a getter on the prototype and not an own property. So `query` was skipped, and **no query schema in the app was being checked**. Nothing failed and nothing warned.

**Fix.** Read `req[key]` directly. Express 5 also makes `req.query` read-only, so writing Joi's cleaned values back needed `Object.defineProperty` in place of assignment.

**Lesson.** "No error" is not the same as "working". A guard has to be tested with input it should **reject**.

### 7.2 Writing the API docs found real bugs

To document an endpoint I had to read its route, its validation, its controller and its service together. Doing that for every endpoint showed where they disagreed with each other:

| Bug | Effect |
|---|---|
| Three calls created staff tokens without passing `tenantId` | Register, login and refresh all returned 500 |
| A controller read `newPassword` from the body, but validation named the field `password` | Password reset could never work |
| Controllers read the email token from the body, but validation expected it in the query | Email verification could never work |
| A query filtered tokens on `userId`, a column that doesn't exist (the column is `ownerId`) | Reset and verification failed after doing half their work |
| "Create staff" returned the full user row | The password hash was sent to the client |
| "Update staff" wrote the request body straight to the database | A changed password was stored as plain text, and that user could no longer log in |

**Lesson.** Most of these are one mistake: **a name in one file didn't match the same name in another**. Documentation works as a review because it forces you to read all the layers of one endpoint side by side.

### 7.3 A catch block that hid the real error

Refresh always answered `401 Please authenticate`. The real cause was the missing `tenantId` from 7.2, but a `catch` in the service turned every error into the same 401.

**Lesson.** Converting every failure into one message is good for the client and bad for the developer. The original error should at least be logged before it's replaced.

### 7.4 Two tokens issued in the same second are identical

A JWT here is built from the owner id, the token type, the tenant and two timestamps in **whole seconds**. A login followed by a refresh inside the same second produces the same string twice, so the "old" refresh token is still valid, because it is also the new one.

I found this only because an automated test ran faster than a person can click. It is still open, and the fix is to add a random `jti` claim to every token. See below.

## 8. Testing

```bash
npm test
```

19 unit tests with Vitest. Prisma and the other services are mocked, so the tests run without a database.

| File | Covers |
|---|---|
| `customer.services.test.ts` | Tenant isolation: a booking request for another salon's service is refused |
| `superAdmin.auth.services.test.ts` | Login, logout, refresh-token rotation, password reset (success and failure paths) |
| `superAdmin.services.test.ts` | Lookups and updates, including the "email already taken" rule |

Beyond the unit tests, the staff auth and staff management endpoints were exercised end to end against a running server and a real database: correct input, missing input, wrong roles, reused tokens and cross-checks such as "after a password change, the new password logs in and the old one doesn't".

## 9. Known limitations and next steps

I'd rather list these than hide them.

**Not built yet**

- No endpoints for staff to manage **services** or to view and assign **bookings**. The tables exist, and today services have to be inserted directly into the database.
- Tenant **suspension**: the `suspended` flag and the service function exist, but there is no route for it and logins don't check it.
- Booking **time conflicts**: nothing stops two bookings for the same slot.
- Swagger docs for the platform-owner endpoints.

**Should be fixed**

- Identical JWTs within the same second (7.4). Fix: add a `jti` claim.
- `register` creates the salon and then the owner in two separate steps. If the second step fails, an empty salon is left behind. Fix: one database transaction.
- "Email already taken" returns 400. 409 Conflict would be more accurate.
- Login returns `{ user, token }` while register returns `{ user, tokens }`.
- A customer's `tenantId` in the URL isn't compared with the tenant inside their token. Data access is still scoped by the customer id from the token.

**Before production**

- Rate limiting on login and on one-time-code endpoints.
- CORS is open to every origin.
- Security headers (Helmet) and structured logging.
- Integration tests in CI, and a production Dockerfile. The current one is for development only.

## 10. Running the project

### Requirements

- Node.js 20 or newer
- PostgreSQL 16, or Docker
- An SMTP account for sending email (a test inbox such as Mailtrap or Ethereal works)

### Environment variables

Create a `.env` file in the project root:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/urbantrim

JWT_SECRET=change-me
SUPER_ADMIN_JWT_SECRET=change-me-to-something-different
JWT_ACCESS_EXPIRATION_MINUTES=30
JWT_REFRESH_EXPIRATION_DAYS=30
JWT_RESET_PASSWORD_EXPIRATION_MINUTES=10
JWT_VERIFY_EMAIL_EXPIRATION_MINUTES=10

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your-username
SMTP_PASSWORD=your-password
EMAIL_FROM=noreply@urbantrim.com
```

`NODE_ENV`, `JWT_SECRET` and `SUPER_ADMIN_JWT_SECRET` are required. The app validates its configuration at startup and refuses to start if one is missing.

### Run locally

```bash
npm install
npm run db:migrate     # apply the migrations
npm run db:generate    # generate the Prisma client
npm run dev            # http://localhost:3000
```

Then open **http://localhost:3000/docs**.

### Run with Docker

```bash
docker compose -f docker-compose.dev.yml up --build
docker compose -f docker-compose.dev.yml exec app npx prisma migrate deploy
```

The API runs on port **5000** and PostgreSQL is exposed on **5433**.

### Try it

1. `POST /v1/auth/register` to create a salon and its owner. Copy `tokens.access.token`.
2. In Swagger, click **Authorize** and paste the token.
3. `POST /v1/user` to add a staff member.
4. `POST /v1/tenants/{tenantId}/customers/bookings` to request a booking as a customer. This needs a service row in that salon.

The first platform owner (`SuperAdmin`) has to be inserted into the database directly. There is no public endpoint that creates one, on purpose.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start with reload on save |
| `npm run build` | Generate the Prisma client and compile TypeScript |
| `npm start` | Run the compiled build |
| `npm test` | Run the unit tests |
| `npm run db:migrate` | Create and apply a migration (development) |
| `npm run migrate:deploy` | Apply migrations (production) |
| `npm run db:studio` | Open Prisma Studio |

## 11. Project structure

```
src/
├── app.ts               Express app: middlewares, Passport strategies, routes, error handling
├── index.ts             Starts the server
├── client.ts            Prisma client (PostgreSQL adapter)
├── config/
│   ├── config.ts        Reads and validates environment variables
│   ├── role.ts          Role → permissions map
│   └── strategies/      Passport JWT strategies: user, customer, superadmin
├── routes/v1/           URLs, middlewares per route, OpenAPI comments
├── middlewares/         auth (x3), validate, error converter and handler
├── validations/         Joi schemas
├── controllers/         HTTP in, HTTP out
├── services/            Business rules and all database access
├── utils/               ApiError, catchAsync, bcrypt helpers, pick, exclude, code generator
├── docs/swagger.ts      Builds the OpenAPI spec from the route comments
├── types/               Express type extensions
└── tests/               Vitest unit tests
prisma/
├── schema.prisma        Data model
└── migrations/          Migration history
```
