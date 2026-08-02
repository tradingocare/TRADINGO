Write-Host "=== VERIFYING GoCashModule import in AppModule ==="
$appMod = Get-Content -LiteralPath "E:\tradingo\apps\api\src\app.module.ts" -Raw
$goCashLines = $appMod -split "`n" | Where-Object { $_ -match '[Gg][Oo][Cc][Aa][Ss][Hh]' }
foreach ($line in $goCashLines) {
    Write-Host "  $line"
}
Write-Host ""

Write-Host "=== CHECKING profile-completion controller details ==="
$p = "E:\tradingo\apps\api\src\modules\profile-completion\profile-completion.service.ts"
if (Test-Path $p) {
    $content = Get-Content -LiteralPath $p -Raw
    Write-Host ($content.Substring(0, [Math]::Min(800, $content.Length)))
}

Write-Host "`n`n=== CHECKING ALL findMany with select in controllers ===`n"
# Find patterns where findMany is called WITHOUT select
Get-ChildItem -LiteralPath "E:\tradingo\apps\api\src\modules" -Recurse -Filter "*controller.ts" -File | Where-Object { $_.Name -notmatch '\.spec\.' } | ForEach-Object {
    $content = Get-Content -LiteralPath $_.FullName -Raw
    $lines = $content -split "`n"
    $lineNum = 0
    foreach ($line in $lines) {
        $lineNum++
        if ($line -match '\.(findMany|findFirst|findUnique)\(') {
            $method = $matches[1]
            # Check if select is on the same line or next few lines
            $idx = [Math]::Max(0, $lineNum-1)
            $block = ""
            for ($i = $idx; $i -lt [Math]::Min($idx+6, $lines.Count); $i++) {
                $block += $lines[$i] + "`n"
            }
            $hasSelect = $block -match 'select\s*:'
            if (-not $hasSelect) {
                Write-Host "  $($_.Directory.Name)/$($_.Name) Line $lineNum : $method() WITHOUT select"
            }
        }
    }
}
