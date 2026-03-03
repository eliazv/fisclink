# FiscLink - Avvio completo dev (Docker + App + Workers)
# Uso: .\scripts\dev-start.ps1
# Ctrl+C per fermare tutto

Write-Host ""
Write-Host "=======================================" -ForegroundColor Blue
Write-Host "  FiscLink - Dev Environment" -ForegroundColor Blue
Write-Host "=======================================" -ForegroundColor Blue
Write-Host ""

# 1. Docker
Write-Host "[1/4] Avvio PostgreSQL + Redis..." -ForegroundColor Cyan
docker compose up -d
Start-Sleep -Seconds 3

# 2. Migrazioni
Write-Host "[2/4] Migrazioni database..." -ForegroundColor Cyan
npx prisma migrate deploy 2>$null
if ($LASTEXITCODE -ne 0) {
    npx prisma migrate dev --name init
}
npx prisma generate

# 3. Next.js + Workers in parallelo
Write-Host "[3/4] Avvio Next.js..." -ForegroundColor Cyan
$nextJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run dev 2>&1
}

Start-Sleep -Seconds 2
Write-Host "[4/4] Avvio Workers BullMQ..." -ForegroundColor Cyan
$workerJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run worker 2>&1
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Green
Write-Host "  Tutto attivo!" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""
Write-Host "  App:       http://localhost:3000" -ForegroundColor Blue
Write-Host "  Dashboard: http://localhost:3000/dashboard" -ForegroundColor Blue
Write-Host "  DB Studio: npm run db:studio" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Ctrl+C per fermare" -ForegroundColor Yellow
Write-Host ""

# Stream dei log in tempo reale
try {
    while ($true) {
        # Log Next.js
        Receive-Job -Job $nextJob -ErrorAction SilentlyContinue | ForEach-Object {
            Write-Host "[APP] $_" -ForegroundColor White
        }
        # Log Workers
        Receive-Job -Job $workerJob -ErrorAction SilentlyContinue | ForEach-Object {
            Write-Host "[WRK] $_" -ForegroundColor DarkCyan
        }
        Start-Sleep -Milliseconds 500
    }
}
finally {
    Write-Host ""
    Write-Host "Spegnimento..." -ForegroundColor Yellow
    Stop-Job -Job $nextJob, $workerJob -ErrorAction SilentlyContinue
    Remove-Job -Job $nextJob, $workerJob -Force -ErrorAction SilentlyContinue
    Write-Host "Processi fermati. Docker resta attivo." -ForegroundColor Green
    Write-Host "Per fermare Docker: docker compose down" -ForegroundColor Cyan
}
