# Fix .env file - Remove spaces and ensure correct format

Write-Host "Fixing .env file..." -ForegroundColor Cyan

$envFile = ".env"

if (Test-Path $envFile) {
    $content = Get-Content $envFile
    $newContent = @()
    $fixed = $false
    
    foreach ($line in $content) {
        if ($line -match "^DATABASE_URL=") {
            # Remove spaces and fix the URL
            $url = $line -replace 'DATABASE_URL="', '' -replace '"', ''
            
            # Remove spaces around colon
            $url = $url -replace ':\s+', ':'
            $url = $url -replace '\s+', ''
            
            # Ensure it starts with postgresql://
            if (-not $url.StartsWith("postgresql://") -and -not $url.StartsWith("postgres://")) {
                Write-Host "WARNING: URL doesn't start with postgresql:// or postgres://" -ForegroundColor Yellow
            }
            
            # Ensure complete database name
            if ($url -notmatch "resort_info") {
                $url = $url -replace "resort_i[^n]?", "resort_info"
            }
            
            $newContent += "DATABASE_URL=`"$url`""
            $fixed = $true
            Write-Host "Fixed DATABASE_URL:" -ForegroundColor Green
            Write-Host "  $url" -ForegroundColor Cyan
        } else {
            $newContent += $line
        }
    }
    
    if ($fixed) {
        $newContent | Out-File -FilePath $envFile -Encoding utf8 -NoNewline
        Write-Host "`n.env file has been fixed!" -ForegroundColor Green
    } else {
        Write-Host "DATABASE_URL not found. Adding correct one..." -ForegroundColor Yellow
        $newContent += 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/resort_info?schema=public"'
        $newContent | Out-File -FilePath $envFile -Encoding utf8 -NoNewline
        Write-Host "Added DATABASE_URL to .env file" -ForegroundColor Green
    }
} else {
    Write-Host ".env file not found. Creating new one..." -ForegroundColor Yellow
    @"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/resort_info?schema=public"
ADMIN_PASSWORD="admin123"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
"@ | Out-File -FilePath $envFile -Encoding utf8
    Write-Host ".env file created!" -ForegroundColor Green
}

Write-Host "`nPlease verify the DATABASE_URL in .env file:" -ForegroundColor Yellow
Write-Host "It should be exactly:" -ForegroundColor Yellow
Write-Host 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/resort_info?schema=public"' -ForegroundColor Cyan
Write-Host "`n(Replace 'postgres' password with your actual PostgreSQL password)" -ForegroundColor Gray







