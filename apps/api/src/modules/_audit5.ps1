Write-Host "=== PRODUCT-CLAIMS CONTROLLER (empty route) ==="
$p = "E:\tradingo\apps\api\src\modules\product-claims\product-claims.controller.ts"
$content = Get-Content -LiteralPath $p -Raw
Write-Host $content

Write-Host "`n`n=== TRADFIND CONTROLLER (empty route) ==="
$p2 = "E:\tradingo\apps\api\src\modules\tradfind\tradfind.controller.ts"
$content2 = Get-Content -LiteralPath $p2 -Raw
Write-Host $content2.Substring(0, [Math]::Min(1000, $content2.Length))

Write-Host "`n`n=== AppModule imports check ==="
$appMod = "E:\tradingo\apps\api\src\app.module.ts"
$content3 = Get-Content -LiteralPath $appMod -Raw
Write-Host $content3
