Write-Host "=== PROFILE-COMPLETION CONTROLLER (Missing Guards) Full Content ==="
$p = "E:\tradingo\apps\api\src\modules\profile-completion\profile-completion.controller.ts"
$content = Get-Content -LiteralPath $p -Raw
Write-Host $content

Write-Host "`n`n=== PROFILE-COMPLETION MODULE ==="
$p2 = "E:\tradingo\apps\api\src\modules\profile-completion\profile-completion.module.ts"
$content2 = Get-Content -LiteralPath $p2 -Raw
Write-Host $content2

Write-Host "`n`n=== CATEGORY-TEMPLATES CONTROLLER (has body:any) ==="
$p3 = "E:\tradingo\apps\api\src\modules\category-templates\category-templates.controller.ts"
$content3 = Get-Content -LiteralPath $p3 -Raw
Write-Host $content3

Write-Host "`n`n=== SELLER CONTROLLER (has body:any) ==="
$p4 = "E:\tradingo\apps\api\src\modules\seller\seller.controller.ts"
$content4 = Get-Content -LiteralPath $p4 -Raw
Write-Host $content4
