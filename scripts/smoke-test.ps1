param(
  [string]$Image = "olostep/mcp-server:latest"
)

$ErrorActionPreference = "Stop"

$lines = @(
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"local-smoke","version":"0.0.0"}}}',
  '{"jsonrpc":"2.0","method":"notifications/initialized","params":{}}',
  '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
)

($lines -join "`n") | docker run -i --rm -e OLOSTEP_API_KEY="$env:OLOSTEP_API_KEY" $Image
