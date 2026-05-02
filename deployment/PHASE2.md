# Phase 2 — Booking core (rules, conflicts, policy)

Implemented in code (not a separate deploy step).

## Server-side rules

- **Verified doctors only** — Patients cannot book `Doctor` profiles with `isVerified: false`.
- **Calendar day** — `appointmentDate` is stored as **UTC midnight** for that day; overlap checks use the same day window so legacy noon rows still match.
- **Within weekly availability** — Slot must fall fully inside at least one active `Availability` block for that UTC weekday (multiple blocks per day supported).
- **Overlap** — New bookings cannot overlap an existing **scheduled** or **confirmed** appointment (string `startTime`/`endTime` overlap), not only identical `startTime`.
- **Advance booking** — `MIN_BOOKING_NOTICE_HOURS` (default **2**) before slot start. Env: `MIN_BOOKING_NOTICE_HOURS`.
- **Patient cancellation window** — Patients must cancel more than `CANCELLATION_NOTICE_HOURS` (default **24**) before slot start. Doctors and admins are not restricted by this window. Env: `CANCELLATION_NOTICE_HOURS`.
- **Terminal states** — Cannot move status out of **completed**, **cancelled**, or **no-show** via `PUT`. Cannot cancel **completed** / **no-show**.

## Data integrity

- **Partial unique index** on `(doctor, appointmentDate, startTime)` for documents whose `status` is not `cancelled` or `no-show` — last line of defence against double booking (duplicate key → 409).

## Bugfixes bundled here

- **Doctor access** — `GET/PUT/DELETE` appointments compared **User** id to **Doctor** id; doctor role now resolves `Doctor` by `user` and compares correctly.
- **Availability by date** — Removed `setHours` double-mutation bug; queries use a **UTC half-open day range** `[day, day+1)`.
- **Slot grid** — Multiple availability rows for the same weekday are merged; slot `available` reflects **overlap** with bookings, not only exact `startTime` match.

## Frontend copy

Patient booking page summarizes advance booking and cancellation policy (aligned with defaults above).
