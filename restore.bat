@echo off
cd /d c:\Users\kavit\VayuPos
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h ep-sweet-grass-a15ff20z.ap-southeast-1.aws.neon.tech -U neondb_owner -d neondb -p 5432 < backup.sql
echo Restore completed!
pause
