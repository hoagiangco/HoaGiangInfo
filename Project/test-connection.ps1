# Test PostgreSQL connection with different passwords

Write-Host "Testing PostgreSQL connection..." -ForegroundColor Cyan
Write-Host ""

$passwords = @("postgres", "admin", "root", "123456", "")

foreach ($pwd in $passwords) {
    Write-Host "Trying password: '$pwd'..." -ForegroundColor Yellow
    $env:PGPASSWORD = $pwd
    
    $result = & psql -U postgres -h localhost -d postgres -c "SELECT version();" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SUCCESS! Password is: '$pwd'" -ForegroundColor Green
        Write-Host ""
        Write-Host "Updating .env.local with correct password..." -ForegroundColor Cyan
        
        $dbUrl = "postgresql://postgres:$pwd@localhost:5432/resort_info?schema=public"
        $content = @(
            "DATABASE_URL=`"$dbUrl`"",
            'ADMIN_PASSWORD="admin123"',
            'NEXT_PUBLIC_APP_URL=""'
        )
        $content | Out-File -FilePath .env.local -Encoding utf8
        
        Write-Host "✅ .env.local updated!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Now run: npm run db:push" -ForegroundColor Cyan
        exit 0
    } else {
        Write-Host "❌ Failed" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Could not connect with common passwords." -ForegroundColor Yellow
Write-Host "Please run this to update .env.local manually:" -ForegroundColor Yellow
Write-Host "  powershell -ExecutionPolicy Bypass -File update-password.ps1" -ForegroundColor Cyan










