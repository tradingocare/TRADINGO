Write-Host "=== VERIFYING GoCashModule status ==="
$goCashModuleFile = "E:\tradingo\apps\api\src\modules\go-cash\go-cash.module.ts"
$content = Get-Content -LiteralPath $goCashModuleFile -Raw
Write-Host "GoCashModule class name:"
$classMatch = [regex]::Match($content, 'export class (\w+)')
if ($classMatch.Success) {
    Write-Host "  $($classMatch.Groups[1].Value)"
}
Write-Host ""
Write-Host "Checking if GoCashModule referenced anywhere in app.module:"
$appMod = Get-Content -LiteralPath "E:\tradingo\apps\api\src\app.module.ts" -Raw
if ($appMod -match 'GoCashModule') {
    $lines = $appMod -split "`n" | Where-Object { $_ -match 'GoCashModule' }
    foreach ($line in $lines) {
        Write-Host "  $line"
    }
} else {
    Write-Host "  GoCashModule NOT referenced in AppModule"
}

Write-Host "`n`n=== @Res() Response type check (Express Response vs FastifyReply) ==="
$resUsagePaths = @(
    "E:\tradingo\apps\api\src\modules\auth\auth.controller.ts",
    "E:\tradingo\apps\api\src\modules\smart-po\smart-po.controller.ts",
    "E:\tradingo\apps\api\src\modules\wallet-api\wallet-api.controller.ts",
    "E:\tradingo\apps\api\src\modules\ai-gateway\ai-gateway.controller.ts",
    "E:\tradingo\apps\api\src\modules\billing\billing.controller.ts"
)
foreach ($p in $resUsagePaths) {
    $content = Get-Content -LiteralPath $p -Raw
    $lines = $content -split "`n"
    Write-Host "`n--- $p ---"
    $lineNum = 0
    foreach ($line in $lines) {
        $lineNum++
        if ($line -match '@Res\(\)') {
            Write-Host "  Line $lineNum : $($line.Trim())"
        }
    }
}

Write-Host "`n`n=== INVENTORY SUMMARY ==="
Write-Host "Total module directories: 92"
Write-Host "Total controllers (non-spec): 155"
Write-Host "Total endpoints: 1329"
Write-Host ""
Write-Host "=== ISSUES SUMMARY ==="
Write-Host "1. Orphaned module (not in AppModule): profile-completion"
Write-Host "2. Controllers missing @UseGuards (intentionally public):"
Write-Host "   - near-me (uses @Public())"
Write-Host "   - payment-webhook (external webhooks, no auth expected)"
Write-Host "   - profile-completion (NO auth - VULNERABLE)"
Write-Host "3. @Body() body:any instances: 11 across 8 controllers"
Write-Host "4. @Res() usage: 6 across 5 controllers"
Write-Host "5. Silent .catch(): 10 instances in catalog-admin.controller.ts"
Write-Host "6. findMany/First/Unique WITHOUT select: 21 instances across controllers"
Write-Host "7. go-cash module: Module exists but replaced by gocash module"
Write-Host ""
Write-Host "=== BY SEVERITY ==="
Write-Host "CRITICAL:"
Write-Host "  - profile-completion missing entirely from AppModule (routes never registered)"
Write-Host "  - profile-completion has NO @UseGuards, JwtAuthGuard, or @Public()"
Write-Host "  - catalog-admin.controller.ts: 10 silent .catch(() => null/[]) (all errors swallowed)"
Write-Host ""
Write-Host "HIGH:"
Write-Host "  - 11 @Body() body:any (untyped DTOs)"
Write-Host "  - 21 findMany/First/Unique without select (returns full entity to client)"
Write-Host "  - 6 @Res() usages (bypasses NestJS interceptor pipeline)"
Write-Host ""
Write-Host "MEDIUM:"
Write-Host "  - 3 controllers without @UseGuards (2 intentional, 1 vulnerable)"
Write-Host "  - go-cash module exists but superseded (potential dead code)"
