$modules = @()
$controllers = @()
$totalEndpoints = 0
$issues = @()

Get-ChildItem -LiteralPath "E:\tradingo\apps\api\src\modules" -Recurse -Filter "*controller.ts" -File | Where-Object { $_.Name -notmatch '\.spec\.' } | ForEach-Object {
    $ctrlPath = $_.FullName
    $content = Get-Content -LiteralPath $ctrlPath -Raw
    $moduleName = $_.Directory.Name
    $ctrlName = $_.Name

    # Count endpoints
    $endpointCount = 0
    $endpointMatches = [regex]::Matches($content, '@(Get|Post|Put|Patch|Delete|Head|Options)\(')
    $endpointCount = $endpointMatches.Count
    $totalEndpoints += $endpointCount

    # Check for @UseGuards
    $hasUseGuards = $content -match '@UseGuards'
    
    # Check for @Body() body: any
    $bodyAnyCount = 0
    $bodyAnyMatches = [regex]::Matches($content, '@Body\(\)\s*\w+\s*:\s*any')
    $bodyAnyCount = $bodyAnyMatches.Count
    
    # Check for @Res() usage
    $resCount = 0
    $resMatches = [regex]::Matches($content, '@Res\(\)')
    $resCount = $resMatches.Count
    
    # Check for silent .catch patterns
    $silentCount = 0
    $catchNull = [regex]::Matches($content, '\.catch\s*\(\s*\(\s*\)\s*=>\s*null\s*\)')
    $catchEmpty = [regex]::Matches($content, '\.catch\s*\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)')
    $catchUndefined = [regex]::Matches($content, '\.catch\s*\(\s*\(\s*\)\s*=>\s*undefined\s*\)')
    $silentCount = $catchNull.Count + $catchEmpty.Count + $catchUndefined.Count

    # Extract route prefix
    $routePrefix = "??"
    $ctrlMatch = [regex]::Match($content, '@Controller\(\s*''([^'']+)''')
    if ($ctrlMatch.Success) {
        $routePrefix = $ctrlMatch.Groups[1].Value
    }
    $ctrlMatch2 = [regex]::Match($content, '@Controller\(\s*"([^"]+)"')
    if ($ctrlMatch2.Success) {
        $routePrefix = $ctrlMatch2.Groups[1].Value
    }
    if ($routePrefix -eq "??") {
        $routePrefix = "(empty)"
    }

    $controllers += [PSCustomObject]@{
        Module = $moduleName
        Controller = $ctrlName
        Path = $ctrlPath
        Endpoints = $endpointCount
        HasUseGuards = $hasUseGuards
        BodyAny = $bodyAnyCount
        ResUsage = $resCount
        SilentCatch = $silentCount
        RoutePrefix = $routePrefix
    }
}

Write-Host "========== COMPREHENSIVE API MODULE AUDIT =========="
Write-Host ""
Write-Host "=== OVERVIEW ==="
Write-Host "Total Controllers (non-spec): $($controllers.Count)"
Write-Host "Total Endpoints: $totalEndpoints"
Write-Host ""

Write-Host "=== MODULES WITH @Body() body: any (Untyped DTOs) ==="
$controllers | Where-Object { $_.BodyAny -gt 0 } | Sort-Object BodyAny -Descending | Select-Object Module, Controller, BodyAny | Format-Table -AutoSize
Write-Host ""

Write-Host "=== MODULES WITH @Res() usage (Bypasses NestJS response handling) ==="
$controllers | Where-Object { $_.ResUsage -gt 0 } | Sort-Object ResUsage -Descending | Select-Object Module, Controller, ResUsage | Format-Table -AutoSize
Write-Host ""

Write-Host "=== MODULES WITH SILENT .catch(() => null/{}) (No logging) ==="
$controllers | Where-Object { $_.SilentCatch -gt 0 } | Sort-Object SilentCatch -Descending | Select-Object Module, Controller, SilentCatch | Format-Table -AutoSize
Write-Host ""

Write-Host "=== MODULES MISSING @UseGuards (No auth guards on any endpoint) ==="
$controllers | Where-Object { -not $_.HasUseGuards } | Sort-Object Module | Select-Object Module, Controller, Endpoints, RoutePrefix | Format-Table -AutoSize
Write-Host ""

Write-Host "=== COMPLETE CONTROLLER LIST ==="
$controllers | Sort-Object Module | Select-Object Module, Controller, Endpoints, RoutePrefix, HasUseGuards, BodyAny, ResUsage, SilentCatch | Format-Table -AutoSize
Write-Host ""

Write-Host "=== MODULE DIRECTORY COUNT ==="
$dirCount = (Get-ChildItem -LiteralPath "E:\tradingo\apps\api\src\modules" -Directory).Count
Write-Host "Module directories: $dirCount"

# Summary
$missingGuards = $controllers | Where-Object { -not $_.HasUseGuards }
$bodyAnyTotal = ($controllers | Measure-Object -Property BodyAny -Sum).Sum
$resTotal = ($controllers | Measure-Object -Property ResUsage -Sum).Sum
$silentTotal = ($controllers | Measure-Object -Property SilentCatch -Sum).Sum

Write-Host ""
Write-Host "=== SUMMARY STATS ==="
Write-Host "Total module directories: $dirCount"
Write-Host "Total controllers: $($controllers.Count)"
Write-Host "Total endpoints: $totalEndpoints"
Write-Host "Controllers missing @UseGuards: $($missingGuards.Count)"
Write-Host "Total @Body() body:any instances: $bodyAnyTotal"
Write-Host "Total @Res() usages: $resTotal"
Write-Host "Total silent .catch() instances: $silentTotal"
