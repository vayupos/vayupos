@echo off
cd /d c:\Users\kavit\VayuPos
echo Creating public schema...
echo CREATE SCHEMA IF NOT EXISTS public; | "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h ep-sweet-grass-a15ff20z.ap-southeast-1.aws.neon.tech -U neondb_owner -d neondb -p 5432
echo.
echo Now restoring backup...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h ep-sweet-grass-a15ff20z.ap-southeast-1.aws.neon.tech -U neondb_owner -d neondb -p 5432 < backup.sql
echo.
echo Restore completed!
pause
