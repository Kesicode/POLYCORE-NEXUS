# PolyCore Nexus — Windows Quick Start Script
# Run this from the project root in PowerShell

param(
    [switch]$WithMonitoring,
    [switch]$Down,
    [switch]$Clean,
    [switch]$Logs,
    [switch]$Status
)

$ErrorActionPreference = "Stop"
$rootDir = $PSScriptRoot

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          PolyCore Nexus — Windows Launcher            ║" -ForegroundColor Cyan
Write-Host "║     One Platform. Many Languages. One Ecosystem.      ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ─── Helper ───────────────────────────────────────────────────────────────────
function Check-Command([string]$cmd) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Host "✗ '$cmd' not found — please install it first" -ForegroundColor Red
        return $false
    }
    Write-Host "✓ $cmd found" -ForegroundColor Green
    return $true
}

# ─── Status / Info ────────────────────────────────────────────────────────────
if ($Status) {
    docker compose ps
    exit 0
}

# ─── Logs ─────────────────────────────────────────────────────────────────────
if ($Logs) {
    docker compose logs -f
    exit 0
}

# ─── Teardown ─────────────────────────────────────────────────────────────────
if ($Down) {
    Write-Host "Stopping PolyCore Nexus..." -ForegroundColor Yellow
    docker compose down
    Write-Host "Done." -ForegroundColor Green
    exit 0
}

if ($Clean) {
    Write-Host "Removing all containers, volumes, and images..." -ForegroundColor Yellow
    docker compose down -v --remove-orphans
    Write-Host "Done." -ForegroundColor Green
    exit 0
}

# ─── Prerequisites ────────────────────────────────────────────────────────────
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
$ok = $true
$ok = (Check-Command "docker") -and $ok
$ok = (Check-Command "docker") -and $ok   # compose is a docker plugin

if (-not $ok) {
    Write-Host ""
    Write-Host "Please install Docker Desktop: https://docs.docker.com/desktop/windows/" -ForegroundColor Red
    exit 1
}

# Test docker compose
try {
    docker compose version | Out-Null
    Write-Host "✓ docker compose available" -ForegroundColor Green
} catch {
    Write-Host "✗ docker compose not available (requires Docker Desktop >= 2.0)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ─── Env file ─────────────────────────────────────────────────────────────────
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "⚠ Please review and edit .env before running in production!" -ForegroundColor Yellow
}

# ─── Build & Start ────────────────────────────────────────────────────────────
Write-Host "Building and starting PolyCore Nexus..." -ForegroundColor Cyan
Write-Host "(First build may take 5–10 minutes)" -ForegroundColor Gray
Write-Host ""

if ($WithMonitoring) {
    docker compose --profile monitoring up --build -d
} else {
    docker compose up --build -d
}

Write-Host ""
Write-Host "Waiting for services to become healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Health checks
$services = @(
    @{ name = "API Gateway";       url = "http://localhost:8080/health" }
    @{ name = "AI Service";        url = "http://localhost:8001/health" }
    @{ name = "IoT Service";       url = "http://localhost:8005/health" }
    @{ name = "Frontend";          url = "http://localhost:3000" }
)

foreach ($svc in $services) {
    try {
        $resp = Invoke-WebRequest -Uri $svc.url -TimeoutSec 5 -UseBasicParsing
        if ($resp.StatusCode -eq 200) {
            Write-Host "✓ $($svc.name) is healthy" -ForegroundColor Green
        } else {
            Write-Host "⚠ $($svc.name) returned $($resp.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠ $($svc.name) not yet ready (still starting up)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  PolyCore Nexus is running!" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend:      http://localhost:3000" -ForegroundColor White
Write-Host "  API Gateway:   http://localhost:8080" -ForegroundColor White
Write-Host "  AI Service:    http://localhost:8001/docs" -ForegroundColor White
Write-Host "  IoT Service:   http://localhost:8005" -ForegroundColor White
if ($WithMonitoring) {
    Write-Host "  Prometheus:    http://localhost:9090" -ForegroundColor White
    Write-Host "  Grafana:       http://localhost:3001  (admin/admin)" -ForegroundColor White
}
Write-Host ""
Write-Host "  Demo login:    admin@polycore.dev / PolyCoreAdmin2024!" -ForegroundColor Gray
Write-Host ""
Write-Host "  Useful commands:" -ForegroundColor Gray
Write-Host "    .\scripts\start.ps1 -Logs     — tail all logs" -ForegroundColor Gray
Write-Host "    .\scripts\start.ps1 -Status   — show container status" -ForegroundColor Gray
Write-Host "    .\scripts\start.ps1 -Down     — stop all services" -ForegroundColor Gray
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
