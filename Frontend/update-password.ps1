# Update PostgreSQL password in .env file

Write-Host "Update PostgreSQL password in .env file" -ForegroundColor Cyan
Write-Host ""

$password = Read-Host "Enter your PostgreSQL password for user 'postgres'"

if ([string]::IsNullOrWhiteSpace($password)) {
    Write-Host "Password cannot be empty!" -ForegroundColor Red
    exit 1
}

$dbUrl = "postgresql://postgres:$password@localhost:5432/resort_info?schema=public"

# Read current .env
$envContent = Get-Content .env
$newContent = @()

foreach ($line in $envContent) {
    if ($line -match "^DATABASE_URL=") {
        $newContent += "DATABASE_URL=`"$dbUrl`""
    } else {
        $newContent += $line
    }
}

# Write back to .env with proper line breaks
$newContent | Out-File -FilePath .env -Encoding utf8 -NoNewline
# Add newline at end
Add-Content .env -Value "" -NoNewline

Write-Host ""
Write-Host "✅ .env file updated!" -ForegroundColor Green
Write-Host "DATABASE_URL has been set to use your password." -ForegroundColor Green
Write-Host ""
Write-Host "Now you can run:" -ForegroundColor Yellow
Write-Host "  npm run db:push" -ForegroundColor Cyan







