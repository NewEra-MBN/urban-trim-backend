-- Allow "=" on staffId inside a GiST constraint
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- One staff cannot have two active bookings whose times overlap
ALTER TABLE "Booking"
  ADD CONSTRAINT booking_no_overlap
  EXCLUDE USING gist (
    "staffId" WITH =,
    tsrange("startAt", "endAt") WITH &&
  )
  WHERE (status <> 'CANCELLED');
