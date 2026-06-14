# MotoMate — Demo Service Center Seed Script

This script populates your MongoDB database with **8 fictional, fully-completed
service center profiles** — 4 in **Tumkur** and 4 in **Bengaluru** (Karnataka) —
so you can demo the customer booking flow (Step 3: Choose Service Center)
without going through the SCO registration + admin approval flow for each one.

## What it creates

For each service center it inserts matching documents into 3 collections:

1. **`users`** — a `SERVICE_CENTER_OWNER` account (so it can also be used to log in
   as that SCO if you want to add workers, etc.)
2. **`service_center_registrations`** — the full profile (all fields collected
   during SCO signup: address, city/state/pincode, lat/lng, services,
   vehicle types, supported brands, GST/PAN/license, hours, etc.), with
   `approvalStatus: "APPROVED"` so it shows up immediately for customers.
3. **`sco_services`** — individual priced services (Oil Change, Tyre
   Replacement, EV Servicing, etc.) linked via `serviceCenterId`.

The `users._id`, `service_center_registrations._id`, and the
`serviceCenterId` used in `sco_services` are all the **same ObjectId**, and
both records share the same email — this matches how `AuthService.login()`
and `/api/services/centers` resolve `ownerId`, so service counts, ratings,
and brand-based filtering all work correctly out of the box.

## Centers included

**Tumkur**
- Gowda Auto Care (Maruti Suzuki, Hyundai, Tata, Honda Bikes, Hero, Bajaj)
- Speedway Motors Tumkur (Toyota, Honda Cars, Kia, MG, Mahindra)
- Tumkur Two-Wheeler Hub (Hero, Honda Bikes, TVS, Bajaj, Yamaha, Royal Enfield)
- Green Future EV Care (Tata, MG, Ather, Ola Electric, Hero Electric, TVS)

**Bengaluru**
- Precision Auto Works, Koramangala (Hyundai, Maruti Suzuki, Honda Cars, VW, Skoda, Toyota)
- City Bike Garage, Indiranagar (Royal Enfield, KTM, Yamaha, Honda Bikes, Suzuki, Kawasaki)
- VoltEdge EV Solutions, Whitefield (Tata, MG, BYD, Ather, Ola Electric, Kia)
- Metro Service Point, Jayanagar (Maruti Suzuki, Tata, Mahindra, Renault, Nissan, TVS, Hero, Bajaj)
- Elite Motors Service Center, Hebbal (Ford, Jeep, VW, Skoda, Toyota, Kia)

All names/emails/GST/PAN numbers are fictional — they don't correspond to any
real business.

## Login credentials

- **Email**: as listed in the script (e.g. `autocare.tumkur@motomate-demo.in`)
- **Password**: `Demo@1234`

## How to run

1. Make sure your backend's MongoDB is running and you know its connection
   string (e.g. `mongodb://localhost:27017/motomate` — matches the `DB_URL`
   in your backend `.env`).

2. From this folder:

   ```bash
   npm install
   DB_URL="mongodb://localhost:27017/<your-db-name>" node seed_service_centers.js
   ```

   On Windows (PowerShell):
   ```powershell
   $env:DB_URL="mongodb://localhost:27017/<your-db-name>"
   node seed_service_centers.js
   ```

3. The script is **idempotent** — if a center with the same email already
   exists, it's skipped, so you can safely re-run it.

## After seeding

- Go through **Book Service** as a customer (Step 1 → Step 2 → Step 3).
- In **Step 3 (Choose Service Center)**, centers will now appear, sorted with
  brand-matching centers first based on the vehicle brand you selected in
  Step 1 (uses the new `supportedBrands` + brand filter logic).
- Distances are computed via Haversine from your current location, so set
  your location near Tumkur or Bengaluru to see "nearby" sorting in action.

## Notes / things you may want to seed separately

- **Workers** (`SCOWorker` / `sco_workers`) are not seeded — without workers,
  doorstep "Find Technician" won't show results for these centers. You can
  add workers via the SCO dashboard after logging in with the credentials
  above, or extend this script similarly.
- **Ratings** are not seeded, so `averageRating` will show as 0 / "New"
  until real ratings are submitted.
