param(
  [string]$ApiKey = $env:OLOSTEP_API_KEY,
  [string]$Image = "olostep/mcp-server:local"
)

$ErrorActionPreference = "Stop"

if (-not $ApiKey) {
  Write-Host "ERROR: OLOSTEP_API_KEY not provided. Pass as -ApiKey or set `$env:OLOSTEP_API_KEY" -ForegroundColor Red
  exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Olostep MCP Server - Real API Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Initialize + Tools List
Write-Host "[Test 1/4] Initialize + List Tools..." -ForegroundColor Yellow
$init = '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"real-test","version":"1.0.0"}}}'
$initialized = '{"jsonrpc":"2.0","method":"notifications/initialized","params":{}}'
$toolsList = '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'

$result1 = ($init, $initialized, $toolsList -join "`n") | docker run -i --rm -e OLOSTEP_API_KEY="$ApiKey" $Image
Write-Host "✓ Server initialized and returned tools list" -ForegroundColor Green
Write-Host ""

# Test 2: Scrape a real website
Write-Host "[Test 2/4] Scraping example.com..." -ForegroundColor Yellow
$scrapeTest = @(
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"scrape-test","version":"1.0.0"}}}',
  '{"jsonrpc":"2.0","method":"notifications/initialized","params":{}}',
  '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"scrape_website","arguments":{"url_to_scrape":"https://example.com","output_format":"text"}}}'
)

$result2 = ($scrapeTest -join "`n") | docker run -i --rm -e OLOSTEP_API_KEY="$ApiKey" $Image
if ($result2 -match '"isError":\s*true') {
  Write-Host "✗ Scrape failed - check output below" -ForegroundColor Red
  Write-Host $result2
} else {
  Write-Host "✓ Successfully scraped example.com" -ForegroundColor Green
  # Extract content preview
  if ($result2 -match '"text":"([^"]{0,100})') {
    Write-Host "  Preview: $($matches[1])..." -ForegroundColor Gray
  }
}
Write-Host ""

# Test 3: Search the web
Write-Host "[Test 3/4] Searching web for 'MCP protocol'..." -ForegroundColor Yellow
$searchTest = @(
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"search-test","version":"1.0.0"}}}',
  '{"jsonrpc":"2.0","method":"notifications/initialized","params":{}}',
  '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search_web","arguments":{"query":"MCP protocol"}}}'
)

$result3 = ($searchTest -join "`n") | docker run -i --rm -e OLOSTEP_API_KEY="$ApiKey" $Image
if ($result3 -match '"isError":\s*true') {
  Write-Host "✗ Search failed - check output below" -ForegroundColor Red
  Write-Host $result3
} else {
  Write-Host "✓ Successfully searched web" -ForegroundColor Green
  # Count results
  $resultCount = ([regex]::Matches($result3, '"title"')).Count
  Write-Host "  Found $resultCount search results" -ForegroundColor Gray
}
Write-Host ""

# Test 4: AI Answers
Write-Host "[Test 4/4] Getting AI answer for 'What is Docker?'..." -ForegroundColor Yellow
$answersTest = @(
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"answers-test","version":"1.0.0"}}}',
  '{"jsonrpc":"2.0","method":"notifications/initialized","params":{}}',
  '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"answers","arguments":{"task":"What is Docker in one sentence?"}}}'
)

$result4 = ($answersTest -join "`n") | docker run -i --rm -e OLOSTEP_API_KEY="$ApiKey" $Image
if ($result4 -match '"isError":\s*true') {
  Write-Host "✗ Answers failed - check output below" -ForegroundColor Red
  Write-Host $result4
} else {
  Write-Host "✓ Successfully got AI answer" -ForegroundColor Green
  if ($result4 -match '"text":"([^"]{0,150})') {
    Write-Host "  Answer: $($matches[1])..." -ForegroundColor Gray
  }
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All tests complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
