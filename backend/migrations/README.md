# Database Migrations

This directory contains SQL migration files for updating the database schema.

## How to Apply Migrations

### Option 1: Using psql command line

```bash
# Connect to your database and run the migration
psql -U your_username -d your_database_name -f migrations/add_city_to_locations.sql
```

### Option 2: Using a PostgreSQL client

1. Connect to your database using your preferred PostgreSQL client (pgAdmin, DBeaver, etc.)
2. Open and execute the SQL file: `migrations/add_city_to_locations.sql`

### Option 3: For new installations

If you're setting up a fresh database, the `init-db.sql` file already includes the updated schema with city_name and country_code columns, so no migration is needed.

## Migration History

- **add_city_to_locations.sql** (2025-01-04)
  - Added `city_name` column to `user_recent_locations` table
  - Added `country_code` column to `user_recent_locations` table
  - These columns store the city name and country code for better display in recent searches

## Verifying Migration

After applying the migration, you can verify it worked by running:

```sql
\d user_recent_locations
```

You should see the new columns listed in the table structure.
