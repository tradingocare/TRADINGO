$logFile = "E:\tradingo\apps\api\api-srv5.log"
Start-Job -Name ApiServer -ScriptBlock {
  Set-Location "E:\tradingo\apps\api"
  node dist/main 2>&1 | Out-File -FilePath "$using:logFile" -Encoding utf8
}
Start-Sleep -Seconds 12
$content = Get-Content "E:\tradingo\apps\api\api-srv5.log" -Tail 10 -ErrorAction SilentlyContinue
Write-Output $content
$p = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.StartTime -gt (Get-Date).AddSeconds(-20) }
if ($p) { Write-Output "API PID: $($p.Id)" } else { Write-Output "No node process found" }
