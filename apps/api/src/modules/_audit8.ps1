Write-Host "=== VERIFYING GoCashModule false positive ==="
Write-Host "Searching for actual 'GoCashModule' (not 'GocashModule'):"
$appMod = Get-Content -LiteralPath "E:\tradingo\apps\api\src\app.module.ts" -Raw
# Search for GoCashModule with exact casing
$matches = [regex]::Matches($appMod, 'GoCashModule')
foreach ($m in $matches) {
    $idx = $m.Index
    $start = [Math]::Max(0, $idx - 50)
    $len = [Math]::Min(100, $appMod.Length - $start)
    Write-Host "  ...$($appMod.Substring($start, $len))..."
}
Write-Host ""
Write-Host "Note: Only in comment - GoCashModule from 'go-cash' directory is DEFINITELY orphaned"

Write-Host "`n=== FULL CATALOG-ADMIN CONTROLLER (for context on silent catches) ==="
$p = "E:\tradingo\apps\api\src\modules\ai\catalog-admin.controller.ts"
$content = Get-Content -LiteralPath $p -Raw
Write-Host $content

Write-Host "`n`n=== TRADESERV CONTROLLER (findMany without select) ==="
$p2 = "E:\tradingo\apps\api\src\modules\tradeserv\tradeserv.controller.ts"
$content2 = Get-Content -LiteralPath $p2 -Raw
Write-Host $content2
