# Deep audit of specific issues

Write-Host "=== DEEP AUDIT: Controllers Missing @UseGuards ==="
$paths = @(
    "E:\tradingo\apps\api\src\modules\near-me\near-me.controller.ts",
    "E:\tradingo\apps\api\src\modules\payment\payment-webhook.controller.ts",
    "E:\tradingo\apps\api\src\modules\profile-completion\profile-completion.controller.ts"
)
foreach ($p in $paths) {
    Write-Host "`n--- $p ---"
    $content = Get-Content -LiteralPath $p -Raw
    Write-Host ($content.Substring(0, [Math]::Min(500, $content.Length)))
}

Write-Host "`n`n========================================="
Write-Host "=== DEEP AUDIT: @Body() body:any instances ==="

$bodyAnyPaths = @(
    "E:\tradingo\apps\api\src\modules\buyer\requirement.controller.ts",
    "E:\tradingo\apps\api\src\modules\communication\template.controller.ts",
    "E:\tradingo\apps\api\src\modules\membership\membership.controller.ts",
    "E:\tradingo\apps\api\src\modules\seller\seller.controller.ts",
    "E:\tradingo\apps\api\src\modules\communication\message.controller.ts",
    "E:\tradingo\apps\api\src\modules\category-templates\category-templates.controller.ts",
    "E:\tradingo\apps\api\src\modules\chat\chat.controller.ts",
    "E:\tradingo\apps\api\src\modules\communication\conversation.controller.ts"
)
foreach ($p in $bodyAnyPaths) {
    $content = Get-Content -LiteralPath $p -Raw
    $matches = [regex]::Matches($content, '@Body\(\)\s*\w+\s*:\s*any')
    if ($matches.Count -gt 0) {
        Write-Host "`n--- $p ---"
        foreach ($m in $matches) {
            $lineNum = 1
            foreach ($line in ($content -split "`n")) {
                if ($line -match [regex]::Escape($m.Value)) {
                    Write-Host "  Line $lineNum : $($line.Trim())"
                }
                $lineNum++
            }
        }
    }
}

Write-Host "`n`n========================================="
Write-Host "=== DEEP AUDIT: @Res() usage ==="

$resPaths = @(
    "E:\tradingo\apps\api\src\modules\auth\auth.controller.ts",
    "E:\tradingo\apps\api\src\modules\smart-po\smart-po.controller.ts",
    "E:\tradingo\apps\api\src\modules\wallet-api\wallet-api.controller.ts",
    "E:\tradingo\apps\api\src\modules\ai-gateway\ai-gateway.controller.ts",
    "E:\tradingo\apps\api\src\modules\billing\billing.controller.ts"
)
foreach ($p in $resPaths) {
    $content = Get-Content -LiteralPath $p -Raw
    $matches = [regex]::Matches($content, '@Res\(\)')
    if ($matches.Count -gt 0) {
        Write-Host "`n--- $p ---"
        $lineNum = 1
        foreach ($line in ($content -split "`n")) {
            if ($line -match '@Res\(\)') {
                Write-Host "  Line $lineNum : $($line.Trim())"
            }
            $lineNum++
        }
    }
}

Write-Host "`n`n========================================="
Write-Host "=== ORPHANED CONTROLLER CHECK ==="
$moduleFiles = @{}
Get-ChildItem -LiteralPath "E:\tradingo\apps\api\src\modules" -Recurse -Filter "*module*.ts" -File | Where-Object { $_.Name -notmatch '\.spec\.' } | ForEach-Object {
    $moduleFiles[$_.Directory.Name] = $true
}

# For each controller, check if its parent directory has a module file
$orphans = @()
Get-ChildItem -LiteralPath "E:\tradingo\apps\api\src\modules" -Recurse -Filter "*controller.ts" -File | Where-Object { $_.Name -notmatch '\.spec\.' } | ForEach-Object {
    $parentDir = $_.Directory.Name
    # Check if parent dir has a module file OR if it's inside a directory that does
    $hasModule = $false
    $dir = $_.Directory
    while ($dir.FullName -match 'modules') {
        if ($moduleFiles.ContainsKey($dir.Name)) {
            $hasModule = $true
            break
        }
        $dir = $dir.Parent
        if ($dir.Name -eq 'modules') { break }
    }
    if (-not $hasModule) {
        $orphans += $_
    }
}
Write-Host "Orphaned controllers (no module file in directory): $($orphans.Count)"
$orphans | ForEach-Object { Write-Host "  $($_.FullName)" }
