Write-Host "=== PAGINATION AUDIT: List endpoints without pagination params ==="

$possibleListRoutes = @()
Get-ChildItem -LiteralPath "E:\tradingo\apps\api\src\modules" -Recurse -Filter "*controller.ts" -File | Where-Object { $_.Name -notmatch '\.spec\.' } | ForEach-Object {
    $content = Get-Content -LiteralPath $_.FullName -Raw
    $endpoints = [regex]::Matches($content, '@(Get|Post)\(([^)]*)\)')
    foreach ($ep in $endpoints) {
        $route = $ep.Groups[2].Value.Trim().Trim("'").Trim('"')
        # Check if it's a list endpoint (empty route or common list patterns)
        $isList = $false
        if ([string]::IsNullOrEmpty($route) -or $route -eq '/') { $isList = $true }
        elseif ($route -match '^(all|list|search|find|browse|index|saved|notifications|history|recent|active|upcoming|pending|invoices)$') { $isList = $true }
        
        if ($isList) {
            # Check if the method has pagination params
            $methodStart = $content.IndexOf(" $($ep.Groups[1].Value)(")
            if ($methodStart -ge 0) {
                $methodBlock = $content.Substring($methodStart, [Math]::Min(2000, $content.Length - $methodStart))
                $hasPagination = $methodBlock -match '(page|limit|offset|skip|take|pagination|paginated)'
                if (-not $hasPagination) {
                    # Find the method name
                    $methodNameMatch = [regex]::Match($methodBlock, 'async\s+(\w+)')
                    $methodName = if ($methodNameMatch.Success) { $methodNameMatch.Groups[1].Value } else { "??" }
                    Write-Host "  $($_.Directory.Name)/$($_.Name) -> $methodName (route: $route) - NO PAGINATION"
                }
            }
        }
    }
}

Write-Host "`n`n=== findMany() WITHOUT select/projection (returning full entities) ==="
Get-ChildItem -LiteralPath "E:\tradingo\apps\api\src\modules" -Recurse -Filter "*controller.ts" -File | Where-Object { $_.Name -notmatch '\.spec\.' } | ForEach-Object {
    $content = Get-Content -LiteralPath $_.FullName -Raw
    # Find controller methods that call findMany without select
    $lines = $content -split "`n"
    $lineNum = 0
    $inMethod = $false
    $methodName = ""
    foreach ($line in $lines) {
        $lineNum++
        if ($line -match '(async\s+)?\w+\s*\(.*\)\s*{') {
            $methodName = ($line -replace '^\s*', '') -replace '\s*\(.*', ''
        }
        if ($line -match '\.findMany\(') {
            $hasSelect = $line -match 'select\s*:'
            # Also check next few lines
            $nextLines = $lines[$lineNum..[Math]::Min($lineNum+5, $lines.Length-1)] -join "`n"
            if (-not ($hasSelect -or ($nextLines -match 'select\s*:'))) {
                Write-Host "  $($_.Directory.Name)/$($_.Name) Line $lineNum method=$methodName - findMany WITHOUT select (returns full entities)"
            }
        }
    }
}
