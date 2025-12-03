# Create PostgreSQL database

Write-Host "Creating PostgreSQL database..." -ForegroundColor Cyan

$password = Read-Host "Enter PostgreSQL password for user 'postgres' (press Enter for 'postgres')"
if ([string]::IsNullOrWhiteSpace($password)) {
    $password = "postgres"
}

Write-Host "`nAttempting to create database 'resort_info'..." -ForegroundColor Yellow

# Try to create database using psql
$env:PGPASSWORD = $password
$createDbCmd = "CREATE DATABASE resort_info;"

try {
    $result = & psql -U postgres -h localhost -c $createDbCmd 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database 'resort_info' created successfully!" -ForegroundColor Green
    } else {
        if ($result -match "already exists") {
            Write-Host "Database 'resort_info' already exists. That's OK!" -ForegroundColor Yellow
        } else {
            Write-Host "Error creating database:" -ForegroundColor Red
            Write-Host $result -ForegroundColor Red
            Write-Host "`nYou may need to create it manually:" -ForegroundColor Yellow
            Write-Host "1. Open pgAdmin or psql" -ForegroundColor Cyan
            Write-Host "2. Run: CREATE DATABASE resort_info;" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "psql command not found. Please create database manually:" -ForegroundColor Yellow
    Write-Host "1. Open pgAdmin" -ForegroundColor Cyan
    Write-Host "2. Connect to PostgreSQL server" -ForegroundColor Cyan
    Write-Host "3. Right-click 'Databases' -> Create -> Database" -ForegroundColor Cyan
    Write-Host "4. Name: resort_info" -ForegroundColor Cyan
    Write-Host "5. Click Save" -ForegroundColor Cyan
}

Write-Host "`nUpdating .env file with correct password..." -ForegroundColor Yellow
$dbUrl = "postgresql://postgres:$password@localhost:5432/resort_info?schema=public"
$envContent = Get-Content .env
$newContent = @()
foreach ($line in $envContent) {
    if ($line -match "^DATABASE_URL=") {
        $newContent += "DATABASE_URL=`"$dbUrl`""
    } else {
        $newContent += $line
    }
}
$newContent | Set-Content .env -Encoding UTF8
Write-Host ".env file updated!" -ForegroundColor Green

Write-Host "`nNow you can run:" -ForegroundColor Green
Write-Host "  npm run db:push" -ForegroundColor Cyan







