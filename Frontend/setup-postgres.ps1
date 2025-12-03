# Quick PostgreSQL setup with Docker

Write-Host "Setting up PostgreSQL with Docker..." -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
$dockerRunning = docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker is not running or not installed!" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

Write-Host "Docker is running. Creating PostgreSQL container..." -ForegroundColor Green

# Stop and remove existing container if exists
docker stop postgres-resort 2>&1 | Out-Null
docker rm postgres-resort 2>&1 | Out-Null

# Create new PostgreSQL container
$password = Read-Host "Enter PostgreSQL password (default: postgres)"
if ([string]::IsNullOrWhiteSpace($password)) {
    $password = "postgres"
}

docker run --name postgres-resort `
    -e POSTGRES_PASSWORD=$password `
    -e POSTGRES_DB=resort_info `
    -p 5432:5432 `
    -d postgres:15

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "PostgreSQL container created successfully!" -ForegroundColor Green
    Write-Host "Waiting for PostgreSQL to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # Update .env file
    $envFile = ".env"
    $dbUrl = "postgresql://postgres:$password@localhost:5432/resort_info?schema=public"
    
    if (Test-Path $envFile) {
        $content = Get-Content $envFile
        $updated = $false
        
        $newContent = @()
        foreach ($line in $content) {
            if ($line -match "^DATABASE_URL=") {
                $newContent += "DATABASE_URL=`"$dbUrl`""
                $updated = $true
            } else {
                $newContent += $line
            }
        }
        
        if (-not $updated) {
            $newContent += "DATABASE_URL=`"$dbUrl`""
        }
        
        $newContent | Out-File -FilePath $envFile -Encoding utf8
        Write-Host ".env file updated with DATABASE_URL" -ForegroundColor Green
    } else {
        @"
DATABASE_URL="$dbUrl"
ADMIN_PASSWORD="admin123"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
"@ | Out-File -FilePath $envFile -Encoding utf8
        Write-Host ".env file created with DATABASE_URL" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Setup complete! You can now run:" -ForegroundColor Green
    Write-Host "  npm run db:push" -ForegroundColor Cyan
    Write-Host "  npm run db:seed" -ForegroundColor Cyan
} else {
    Write-Host "Failed to create PostgreSQL container!" -ForegroundColor Red
}







