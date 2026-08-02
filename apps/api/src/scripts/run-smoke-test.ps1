param(
  [string]$ApiUrl = "http://localhost:3001",
  [int]$StartupTimeoutSeconds = 60,
  [int]$HealthRetrySeconds = 5
)

Write-Host "=== TRADINGO Smoke Test Runner ===" -ForegroundColor Cyan
Write-Host "API URL: $ApiUrl"
Write-Host ""

# Check if API is already running
$apiRunning = $false
try {
  $response = Invoke-WebRequest -Uri "$ApiUrl/live" -TimeoutSec 5 -ErrorAction Stop
  if ($response.StatusCode -eq 200) {
    $apiRunning = $true
    Write-Host "API already running at $ApiUrl" -ForegroundColor Green
  }
} catch {
  Write-Host "API not detected at $ApiUrl" -ForegroundColor Yellow
}

if (-not $apiRunning) {
  Write-Host "Starting API server..." -ForegroundColor Yellow

  # Start the API in the background
  $apiProcess = Start-Process -FilePath "npx" -ArgumentList "nest start --watch" `
    -WorkingDirectory (Join-Path $PSScriptRoot "..\..\..") `
    -NoNewWindow -PassThru -RedirectStandardOutput "NUL" -RedirectStandardError "NUL"

  Write-Host "Waiting for API health endpoint..." -ForegroundColor Yellow

  $elapsed = 0
  $healthy = $false
  while ($elapsed -lt $StartupTimeoutSeconds) {
    Start-Sleep -Seconds $HealthRetrySeconds
    $elapsed += $HealthRetrySeconds
    try {
      $response = Invoke-WebRequest -Uri "$ApiUrl/live" -TimeoutSec 3 -ErrorAction Stop
      if ($response.StatusCode -eq 200) {
        $healthy = $true
        Write-Host "API is healthy after ${elapsed}s" -ForegroundColor Green
        break
      }
    } catch {
      Write-Host "  Waiting... (${elapsed}s)" -ForegroundColor DarkYellow
    }
  }

  if (-not $healthy) {
    Write-Host "ERROR: API failed to start within ${StartupTimeoutSeconds}s" -ForegroundColor Red
    if ($apiProcess -and -not $apiProcess.HasExited) {
      Stop-Process -Id $apiProcess.Id -Force
    }
    exit 1
  }
}

Write-Host ""
Write-Host "Running smoke test against $ApiUrl ..." -ForegroundColor Cyan
Write-Host ""

# Run the smoke test script
$smokeScript = Join-Path $PSScriptRoot "smoke-test.ts"
$projectRoot = Join-Path $PSScriptRoot "..\..\.."

$env:API_URL = $ApiUrl

npx ts-node -P "$projectRoot/apps/api/tsconfig.json" $smokeScript

$exitCode = $LASTEXITCODE

Write-Host ""
if ($exitCode -eq 0) {
  Write-Host "=== ALL SMOKE TESTS PASSED ===" -ForegroundColor Green
} else {
  Write-Host "=== SMOKE TESTS FAILED ($exitCode) ===" -ForegroundColor Red
}

exit $exitCode
