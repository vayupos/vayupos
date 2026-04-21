@echo off
cd /d c:\Users\kavit\VayuPos
"C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" --no-owner --no-privileges --inserts -h database-1.cr8c6ywmy5p3.ap-south-1.rds.amazonaws.com -U postgres -d postgres -p 5432 > backup.sql
echo Backup completed. File size: 
dir backup.sql
