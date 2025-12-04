# Script to check and update .env file for PostgreSQL

Write-Host "Checking .env file..." -ForegroundColor Cyan

if (Test-Path .env) {
    $envContent = Get-Content .env
    $hasDbUrl = $false
    $dbUrlLine = ""
    
    foreach ($line in $envContent) {
        if ($line -match "^DATABASE_URL=") {
            $hasDbUrl = $true
            $dbUrlLine = $line
            break
        }
    }
    
    if ($hasDbUrl) {
        Write-Host "Current DATABASE_URL found:" -ForegroundColor Yellow
        Write-Host $dbUrlLine -ForegroundColor Gray
        
        if ($dbUrlLine -match "^DATABASE_URL=`"file:") {
            Write-Host "`nERROR: DATABASE_URL is set for SQLite!" -ForegroundColor Red
            Write-Host "You need to update it for PostgreSQL." -ForegroundColor Red
            Write-Host "`nExample PostgreSQL connection string:" -ForegroundColor Green
            Write-Host 'DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/resort_info?schema=public"' -ForegroundColor Cyan
        } elseif ($dbUrlLine -match "^DATABASE_URL=`"postgresql://" -or $dbUrlLine -match "^DATABASE_URL=`"postgres://") {
            Write-Host "`nDATABASE_URL format looks correct for PostgreSQL!" -ForegroundColor Green
        } else {
            Write-Host "`nWARNING: DATABASE_URL format may be incorrect." -ForegroundColor Yellow
            Write-Host "It should start with 'postgresql://' or 'postgres://'" -ForegroundColor Yellow
        }
    } else {
        Write-Host "DATABASE_URL not found in .env file!" -ForegroundColor Red
        Write-Host "`nAdd this line to your .env file:" -ForegroundColor Green
        Write-Host 'DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/resort_info?schema=public"' -ForegroundColor Cyan
    }
} else {
    Write-Host ".env file not found!" -ForegroundColor Red
    Write-Host "Creating .env file with PostgreSQL template..." -ForegroundColor Yellow
    
    @"
# Database
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/resort_info?schema=public"

# Admin Password
ADMIN_PASSWORD="admin123"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
"@ | Out-File -FilePath .env -Encoding utf8
    
    Write-Host ".env file created! Please update DATABASE_URL with your PostgreSQL credentials." -ForegroundColor Green
}

Write-Host "`nPress any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")










