Write-Host "=== CHECKING ORPHANED MODULES ==="
Write-Host "Checking which module directories are NOT registered in AppModule..."

# Get all module directories
$moduleDirs = Get-ChildItem -LiteralPath "E:\tradingo\apps\api\src\modules" -Directory | Select-Object -ExpandProperty Name

# Read AppModule
$appModContent = Get-Content -LiteralPath "E:\tradingo\apps\api\src\app.module.ts" -Raw

# Check each module dir for its module file and if referenced in AppModule
foreach ($dir in $moduleDirs) {
    $moduleFile = Get-ChildItem -LiteralPath "E:\tradingo\apps\api\src\modules\$dir" -Filter "*module*.ts" -File | Where-Object { $_.Name -notmatch '\.spec\.' } | Select-Object -First 1
    if ($moduleFile) {
        $moduleClassName = "??"
        $modContent = Get-Content -LiteralPath $moduleFile.FullName -Raw
        $classMatch = [regex]::Match($modContent, 'export class (\w+)')
        if ($classMatch.Success) {
            $moduleClassName = $classMatch.Groups[1].Value
        }
        $isImported = $appModContent -match [regex]::Escape($moduleClassName)
        if (-not $isImported) {
            Write-Host "  ORPHANED: $dir -> $moduleClassName (module file exists but NOT imported in AppModule)"
        } else {
            Write-Host "  OK: $dir -> $moduleClassName"
        }
    } else {
        Write-Host "  WARNING: $dir has no module file"
    }
}

Write-Host "`n`n=== SILENT CATCH DETAIL ==="
$p = "E:\tradingo\apps\api\src\modules\ai\catalog-admin.controller.ts"
$content = Get-Content -LiteralPath $p -Raw
$lines = $content -split "`n"
$lineNum = 0
foreach ($line in $lines) {
    $lineNum++
    if ($line -match '\.catch') {
        Write-Host "  Line $lineNum : $($line.Trim())"
    }
}

Write-Host "`n`n=== findMany WITHOUT select - Service-Level Check ==="
$sPaths = @(
    "E:\tradingo\apps\api\src\modules\billing\billing-admin.controller.ts",
    "E:\tradingo\apps\api\src\modules\payment\payment-admin.controller.ts"
)
foreach ($p in $sPaths) {
    Write-Host "`n--- $p ---"
    $content = Get-Content -LiteralPath $p -Raw
    $lines = $content -split "`n"
    $lineNum = 0
    foreach ($line in $lines) {
        $lineNum++
        $trimmed = $line.Trim()
        if ($trimmed -match 'findMany\(') {
            Write-Host "  Line $lineNum : $trimmed"
        }
    }
}

Write-Host "`n`n=== LIST ENDPOINTS WITHOUT PAGINATION (direct return of arrays) ==="
$additionalChecks = @(
    "E:\tradingo\apps\api\src\modules\seller\seller.controller.ts",
    "E:\tradingo\apps\api\src\modules\seller-product\seller-product.controller.ts",
    "E:\tradingo\apps\api\src\modules\products\products.controller.ts",
    "E:\tradingo\apps\api\src\modules\categories\categories.controller.ts",
    "E:\tradingo\apps\api\src\modules\notification\notification.controller.ts",
    "E:\tradingo\apps\api\src\modules\order\order.controller.ts"
)
foreach ($p in $additionalChecks) {
    $content = Get-Content -LiteralPath $p -Raw
    $lines = $content -split "`n"
    Write-Host "`n--- $p ---"
    $lineNum = 0
    $inMethod = $false
    foreach ($line in $lines) {
        $lineNum++
        $trimmed = $line.Trim()
        # Find @Get or @Post endpoints that don't have pagination
        if ($trimmed -match '@(Get|Post)\([''"]?(/[^''"]*)?[''"]?\)') {
            $route = $matches[0]
            Write-Host "  Line $lineNum : $trimmed"
            # Show next 2 lines for context
            if ($lineNum -lt $lines.Count) {
                Write-Host "    +1: $($lines[$lineNum].Trim())"
            }
            if ($lineNum+1 -lt $lines.Count) {
                Write-Host "    +2: $($lines[$lineNum+1].Trim())"
            }
        }
    }
}
