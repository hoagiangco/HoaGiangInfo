# Verify PostgreSQL connection and password

Write-Host "PostgreSQL Connection Troubleshooting" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is running
Write-Host "1. Checking if PostgreSQL is running on port 5432..." -ForegroundColor Yellow
$portCheck = Test-NetConnection -ComputerName localhost -Port 5432 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($portCheck) {
    Write-Host "   ✅ PostgreSQL is running" -ForegroundColor Green
} else {
    Write-Host "   ❌ PostgreSQL is NOT running on port 5432" -ForegroundColor Red
    Write-Host "   Please start PostgreSQL service" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "2. Testing connection with password 'postgres'..." -ForegroundColor Yellow
$env:PGPASSWORD = "postgres"
$test = & psql -U postgres -h localhost -d postgres -c "SELECT version();" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Connection successful with password 'postgres'!" -ForegroundColor Green
    Write-Host ""
    Write-Host "3. Checking if database 'resort_info' exists..." -ForegroundColor Yellow
    $dbCheck = & psql -U postgres -h localhost -c "SELECT 1 FROM pg_database WHERE datname = 'resort_info';" 2>&1
    if ($dbCheck -match "1 row") {
        Write-Host "   ✅ Database 'resort_info' exists" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Database 'resort_info' does not exist. Creating..." -ForegroundColor Yellow
        & psql -U postgres -h localhost -c "CREATE DATABASE resort_info;" 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Database created!" -ForegroundColor Green
        }
    }
    Write-Host ""
    Write-Host "✅ Everything looks good! Try running: npm run db:push" -ForegroundColor Green
} else {
    Write-Host "   ❌ Connection failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "1. Password is NOT 'postgres'" -ForegroundColor White
    Write-Host "2. PostgreSQL authentication method (check pg_hba.conf)" -ForegroundColor White
    Write-Host "3. User 'postgres' doesn't exist or has different password" -ForegroundColor White
    Write-Host ""
    Write-Host "Solutions:" -ForegroundColor Cyan
    Write-Host "1. Check password in pgAdmin (if you can connect there)" -ForegroundColor White
    Write-Host "2. Try connecting with: psql -U postgres -h localhost" -ForegroundColor White
    Write-Host "3. Reset password in PostgreSQL if needed" -ForegroundColor White
}










