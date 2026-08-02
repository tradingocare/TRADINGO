# TRADINGO Process Monitor
# Captures API and Web process CPU/memory during load tests
# Usage: powershell -File monitor-process.ps1 -DurationSeconds 300 -OutputFile report.csv

param(
    [int]$DurationSeconds = 300,
    [string]$OutputFile = "process-metrics.csv"
)

$apiPid = 27804  # NestJS API PID
$webPid = 24224  # Next.js Web PID
$interval = 5    # Sample every 5 seconds
$samples = [Math]::Floor($DurationSeconds / $interval)

# CSV Header
"Timestamp,API_CPU_Pct,API_Memory_MB,API_Handles,API_Threads,Web_CPU_Pct,Web_Memory_MB,Web_Handles,Web_Threads" | Out-File -FilePath $OutputFile -Encoding UTF8

Write-Host "Monitoring processes for $DurationSeconds seconds ($samples samples)..."
Write-Host "API PID: $apiPid, Web PID: $webPid"
Write-Host "Output: $OutputFile"
Write-Host ""

for ($i = 0; $i -lt $samples; $i++) {
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    
    try {
        $apiProcess = Get-Process -Id $apiPid -ErrorAction SilentlyContinue
        $apiCpu = if ($apiProcess) { [Math]::Round($apiProcess.CPU, 1) } else { "N/A" }
        $apiMem = if ($apiProcess) { [Math]::Round($apiProcess.WorkingSet64 / 1MB, 1) } else { "N/A" }
        $apiHandles = if ($apiProcess) { $apiProcess.HandleCount } else { "N/A" }
        $apiThreads = if ($apiProcess) { $apiProcess.Threads.Count } else { "N/A" }
    } catch {
        $apiCpu = "ERR"; $apiMem = "ERR"; $apiHandles = "ERR"; $apiThreads = "ERR"
    }

    try {
        $webProcess = Get-Process -Id $webPid -ErrorAction SilentlyContinue
        $webCpu = if ($webProcess) { [Math]::Round($webProcess.CPU, 1) } else { "N/A" }
        $webMem = if ($webProcess) { [Math]::Round($webProcess.WorkingSet64 / 1MB, 1) } else { "N/A" }
        $webHandles = if ($webProcess) { $webProcess.HandleCount } else { "N/A" }
        $webThreads = if ($webProcess) { $webProcess.Threads.Count } else { "N/A" }
    } catch {
        $webCpu = "ERR"; $webMem = "ERR"; $webHandles = "ERR"; $webThreads = "ERR"
    }

    "$timestamp,$apiCpu,$apiMem,$apiHandles,$apiThreads,$webCpu,$webMem,$webHandles,$webThreads" | Out-File -FilePath $OutputFile -Encoding UTF8 -Append

    $bar = "#" * [Math]::Min(50, [Math]::Floor(($i / $samples) * 50))
    Write-Host "`r[$bar] $i/$samples | API Mem: ${apiMem}MB | Web Mem: ${webMem}MB" -NoNewline

    Start-Sleep -Seconds $interval
}

Write-Host ""
Write-Host "Monitoring complete. Output saved to $OutputFile"
