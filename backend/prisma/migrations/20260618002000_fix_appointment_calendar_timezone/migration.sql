UPDATE "appointment_calendars"
SET "time_zone" = 'America/Santiago'
WHERE "time_zone" IS NULL
   OR "time_zone" = 'UTC';
