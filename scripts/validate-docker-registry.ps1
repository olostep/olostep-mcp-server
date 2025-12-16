#!/usr/bin/env pwsh
# Quick validation and catalog test for Olostep MCP Server entry

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Olostep MCP Server - Docker Registry Validation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$registryPath = "d:\Projects\orbit\docker-mcp-registry-fork"
$serverName = "olostep"

if (-not (Test-Path $registryPath)) {
    Write-Host "❌ Error: Docker MCP Registry fork not found at $registryPath" -ForegroundColor Red
    exit 1
}

Set-Location $registryPath

Write-Host "[Step 1/4] Validating server definition..." -ForegroundColor Yellow
try {
    task validate -- --name $serverName
    Write-Host "✓ Server definition is valid" -ForegroundColor Green
} catch {
    Write-Host "✗ Validation failed" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}
Write-Host ""

Write-Host "[Step 2/4] Building tools catalog..." -ForegroundColor Yellow
try {
    task build -- --tools $serverName
    Write-Host "✓ Tools catalog built successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Build failed" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}
Write-Host ""

Write-Host "[Step 3/4] Generating local catalog..." -ForegroundColor Yellow
try {
    task catalog -- $serverName
    Write-Host "✓ Local catalog generated" -ForegroundColor Green
} catch {
    Write-Host "✗ Catalog generation failed" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}
Write-Host ""

Write-Host "[Step 4/4] Testing catalog import..." -ForegroundColor Yellow
$catalogPath = Join-Path $PWD "catalogs\$serverName\catalog.yaml"
if (-not (Test-Path $catalogPath)) {
    Write-Host "✗ Catalog file not found at $catalogPath" -ForegroundColor Red
    exit 1
}

Write-Host "  Importing to Docker MCP: $catalogPath" -ForegroundColor Gray
try {
    docker mcp catalog import $catalogPath
    Write-Host "✓ Successfully imported to Docker MCP catalog" -ForegroundColor Green
} catch {
    Write-Host "✗ Import failed" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✨ All validations passed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open Docker Desktop → MCP Toolkit" -ForegroundColor White
Write-Host "2. Search for 'Olostep' to see the imported server" -ForegroundColor White
Write-Host "3. Configure it with your OLOSTEP_API_KEY" -ForegroundColor White
Write-Host "4. Test it with a connected AI client" -ForegroundColor White
Write-Host ""
Write-Host "To reset catalog: docker mcp catalog reset" -ForegroundColor Gray
Write-Host ""
Write-Host "Ready to submit to official Docker MCP Registry?" -ForegroundColor Cyan
Write-Host "See DOCKER_PUBLICATION_GUIDE.md for PR instructions" -ForegroundColor Gray
