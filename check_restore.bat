@echo off
cd /d c:\Users\kavit\VayuPos
echo Checking if tables exist in Neon...
echo SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'; | "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h ep-sweet-grass-a15ff20z.ap-southeast-1.aws.neon.tech -U neondb_owner -d neondb -p 5432
echo.
echo.
echo If you see a number above, the restore was successful!
pause
