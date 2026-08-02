$ApiBase = "http://localhost:3001/api/v1"
$TEMP = $env:TEMP

function Api {
    param($Method, $Uri, $Token, $Body, $Expected = 200)
    $bodyFile = if ($Body) { $f = Join-Path $TEMP "api_body_$([System.IO.Path]::GetRandomFileName()).json"; $Body | Out-File -Encoding utf8 -FilePath $f; $f } else { $null }
    $h = @("Content-Type: application/json")
    if ($Token) { $h += "Authorization: Bearer $Token" }
    $args = @("-s", "-X", $Method, $Uri, "-H", ($h -join "`, " -replace '`,','" -H "'"))
    Actually better approach:
}

# Use curl with files for body
Write-Host "=== LOGIN ===" -ForegroundColor Cyan
$body = '{"identifier":"newtest@tradingo.com","password":"Test@1234"}'
$body | Out-File -Encoding utf8 -FilePath "$TEMP\bl.json"
$buyerResp = curl.exe -s -X POST "$ApiBase/auth/login" -H "Content-Type: application/json" --data "@$TEMP\bl.json" 2>&1
$buyerToken = ($buyerResp | ConvertFrom-Json).data.accessToken
$buyerId = ($buyerResp | ConvertFrom-Json).data.user.id
Write-Host "Buyer: $buyerId" -ForegroundColor Green

$body = '{"identifier":"seller2@tradingo.com","password":"Test@1234"}'
$body | Out-File -Encoding utf8 -FilePath "$TEMP\sl.json"
$sellerResp = curl.exe -s -X POST "$ApiBase/auth/login" -H "Content-Type: application/json" --data "@$TEMP\sl.json" 2>&1
$sellerToken = ($sellerResp | ConvertFrom-Json).data.accessToken
$sellerId = ($sellerResp | ConvertFrom-Json).data.user.id
Write-Host "Seller: $sellerId" -ForegroundColor Green

$results = @()

function Test-Flow {
    param($Name, $ScriptBlock)
    try {
        $result = & $ScriptBlock
        $results += [PSCustomObject]@{ Flow = $Name; Status = "PASS"; Detail = $result }
        Write-Host "  [PASS] $Name : $result" -ForegroundColor Green
    } catch {
        $results += [PSCustomObject]@{ Flow = $Name; Status = "FAIL"; Detail = "$_" }
        Write-Host "  [FAIL] $Name : $_" -ForegroundColor Red
    }
}

function CUrl {
    param($Method, $Uri, $Token, $Body, $ExpectedCode = 200)
    $args = @("-s", "-X", $Method, $Uri, "-m", "10")
    if ($Token) { $args += "-H"; $args += "Authorization: Bearer $Token" }
    $args += "-H"; $args += "Content-Type: application/json"
    if ($Body) { $bf = Join-Path $TEMP "curl_$([System.IO.Path]::GetRandomFileName()).json"; $Body | Out-File -Encoding utf8 -FilePath $bf; $args += "--data"; $args += "@$bf" }
    $resp = curl.exe @args 2>&1
    $obj = $resp | ConvertFrom-Json
    if ($obj.statusCode -and $obj.statusCode -ne $ExpectedCode) { throw "$($obj.statusCode): $($obj.message -join '; ')" }
    return $obj
}

Write-Host "`n=== FLOW 3: COMPANY PROFILE ===" -ForegroundColor Cyan
Test-Flow "3a: GET /companies/my-company" {
    $r = CUrl -Method GET -Uri "$ApiBase/companies/my-company" -Token $sellerToken
    $script:companyId = $r.data.id
    $script:sellerCompanyId = $r.data.id
    "company: $($r.data.name) ($($r.data.id))"
}
Test-Flow "3b: PATCH /companies/my-company" {
    $r = CUrl -Method PATCH -Uri "$ApiBase/companies/my-company" -Token $sellerToken -Body '{"description":"Validated company"}'
    "description updated"
}

Write-Host "`n=== FLOW 4: KYC ===" -ForegroundColor Cyan
Test-Flow "4a: POST /company-verifications" {
    $b = "{`"companyId`":`"$companyId`",`"level`":`"LEVEL_1`",`"documents`":[{`"documentType`":`"GST_CERTIFICATE`",`"documentUrl`":`"https://ex.com/gst.pdf`"}]}"
    $r = CUrl -Method POST -Uri "$ApiBase/company-verifications" -Token $sellerToken -Body $b -ExpectedCode 201
    "submitted"
}
Test-Flow "4b: GET /company-verifications/my" {
    $r = CUrl -Method GET -Uri "$ApiBase/company-verifications/my" -Token $sellerToken
    "status retrieved"
}

Write-Host "`n=== FLOW 5: PRODUCT CREATION ===" -ForegroundColor Cyan
Test-Flow "5a: GET /categories/tree" {
    $r = CUrl -Method GET -Uri "$ApiBase/categories/tree" -Token $sellerToken
    $script:catId = $r.data[0].id
    "category: $script:catId"
}
Test-Flow "5b: POST /seller/products" {
    $b = "{`"name`":`"Test PCB Board V2`",`"description`":`"Test PCB for validation`",`"shortDescription`":`"PCB`",`"categoryId`":`"$catId`",`"type`":`"PHYSICAL`",`"condition`":`"NEW`",`"status`":`"ACTIVE`",`"images`":[],`"metadata`":{}}"
    $r = CUrl -Method POST -Uri "$ApiBase/seller/products" -Token $sellerToken -Body $b -ExpectedCode 201
    $script:productId = $r.data.id
    "product: $script:productId"
}

Write-Host "`n=== FLOW 6: SEARCH ===" -ForegroundColor Cyan
Test-Flow "6a: GET /search/products?q=PCB" {
    $r = CUrl -Method GET -Uri "$ApiBase/search/products?q=PCB&page=1&limit=10"
    "found $($r.data.meta.total) results"
}
Test-Flow "6b: GET /search/products (no query)" {
    $r = CUrl -Method GET -Uri "$ApiBase/search/products?page=1&limit=10"
    "found $($r.data.meta.total) results"
}

Write-Host "`n=== FLOW 7: SAVED PRODUCTS ===" -ForegroundColor Cyan
Test-Flow "7a: POST /buyer/saved-products/{id}" {
    $r = CUrl -Method POST -Uri "$ApiBase/buyer/saved-products/$productId" -Token $buyerToken -ExpectedCode 201
    "saved"
}
Test-Flow "7b: GET /buyer/saved-products" {
    $r = CUrl -Method GET -Uri "$ApiBase/buyer/saved-products" -Token $buyerToken
    "retrieved list"
}

Write-Host "`n=== FLOW 8: RFQ ===" -ForegroundColor Cyan
Test-Flow "8a: POST /smart-rfq" {
    $b = "{`"title`":`"Need PCB Boards`",`"description`":`"Looking for 1000 PCBs`",`"categoryId`":`"$catId`",`"quantity`":1000,`"unit`":`"pieces`",`"rfqType`":`"RFQ`",`"source`":`"BUYER`",`"productItems`":[{`"name`":`"PCB Board`",`"quantity`":1000,`"unit`":`"pieces`"}]}"
    $r = CUrl -Method POST -Uri "$ApiBase/smart-rfq" -Token $buyerToken -Body $b -ExpectedCode 201
    $script:rfqId = $r.data.id
    "RFQ: $script:rfqId"
}

Write-Host "`n=== FLOW 9: QUOTE ===" -ForegroundColor Cyan
if (-not $rfqId) { Write-Host "  SKIP (no RFQ)" -ForegroundColor Yellow } else {
    Test-Flow "9a: POST /companies/:id/rfq/:id/quotes" {
        $b = "{`"items`":[{`"productName`":`"PCB Board`",`"quantity`":1000,`"unitPrice`":4.5,`"totalPrice`":4500}],`"validUntil`":`"2026-08-20T00:00:00Z`",`"notes`":`"Bulk discount`"}"
        $r = CUrl -Method POST -Uri "$ApiBase/companies/$companyId/rfq/$rfqId/quotes" -Token $sellerToken -Body $b -ExpectedCode 201
        $script:quoteId = $r.data.id
        "Quote: $script:quoteId"
    }
}

Write-Host "`n=== FLOW 10: NEGOTIATION (accept quote) ===" -ForegroundColor Cyan
if ($rfqId -and $quoteId) {
    Test-Flow "10a: POST accept-quote" {
        $r = CUrl -Method POST -Uri "$ApiBase/smart-rfq/$rfqId/accept-quote/$quoteId" -Token $buyerToken -ExpectedCode 201
        "accepted"
    }
}

Write-Host "`n=== FLOW 11: PO ===" -ForegroundColor Cyan
Test-Flow "11a: POST /smart-po" {
    $b = "{`"companyId`":`"$companyId`",`"items`":[{`"productName`":`"PCB Board`",`"quantity`":1000,`"unitPrice`":4.5,`"totalPrice`":4500}]}"
    $r = CUrl -Method POST -Uri "$ApiBase/smart-po" -Token $buyerToken -Body $b -ExpectedCode 201
    $script:poId = $r.data.id
    "PO: $script:poId"
}

Write-Host "`n=== FLOW 12: PAYMENT ===" -ForegroundColor Cyan
Test-Flow "12a: GET /companies/:id/payments" {
    $r = CUrl -Method GET -Uri "$ApiBase/companies/$companyId/payments" -Token $buyerToken
    "payments list"
}

Write-Host "`n=== FLOW 13: ESCROW ===" -ForegroundColor Cyan
Test-Flow "13a: GET /companies/:id/escrow" {
    $r = CUrl -Method GET -Uri "$ApiBase/companies/$companyId/escrow" -Token $buyerToken
    "escrow list"
}

Write-Host "`n=== FLOW 15: ORDERS ===" -ForegroundColor Cyan
Test-Flow "15a: GET /companies/:id/orders" {
    $r = CUrl -Method GET -Uri "$ApiBase/companies/$companyId/orders" -Token $sellerToken
    "orders list"
}

Write-Host "`n=== FLOW 17: SELLER ANALYTICS ===" -ForegroundColor Cyan
Test-Flow "17a: GET /seller/analytics/overview" {
    $r = CUrl -Method GET -Uri "$ApiBase/seller/analytics/overview" -Token $sellerToken
    "analytics retrieved"
}

Write-Host "`n=== FLOW 18: BUYER DASHBOARD ===" -ForegroundColor Cyan
Test-Flow "18a: GET /buyer/dashboard" {
    $r = CUrl -Method GET -Uri "$ApiBase/buyer/dashboard" -Token $buyerToken
    "dashboard data"
}

Write-Host "`n=== FLOW 19: MEMBERSHIP ===" -ForegroundColor Cyan
Test-Flow "19a: GET /membership/current" {
    $r = CUrl -Method GET -Uri "$ApiBase/membership/current" -Token $sellerToken
    "membership data"
}

Write-Host "`n=== FLOW 20: NOTIFICATIONS ===" -ForegroundColor Cyan
Test-Flow "20a: GET /companies/:id/notifications" {
    $r = CUrl -Method GET -Uri "$ApiBase/companies/$companyId/notifications" -Token $sellerToken
    "notifications list"
}

Write-Host "`n=== FLOW 21: GOCASH WALLET ===" -ForegroundColor Cyan
Test-Flow "21a: GET /wallet/buyer/summary" {
    $r = CUrl -Method GET -Uri "$ApiBase/wallet/buyer/summary" -Token $buyerToken
    "wallet summary"
}
Test-Flow "21b: GET /wallet/seller/summary" {
    $r = CUrl -Method GET -Uri "$ApiBase/wallet/seller/summary" -Token $sellerToken
    "seller wallet"
}

Write-Host "`n=== FLOW 22: TRADETALK ===" -ForegroundColor Cyan
Test-Flow "22a: GET /tradetalk/communities" {
    $r = CUrl -Method GET -Uri "$ApiBase/tradetalk/communities?page=1&limit=10" -Token $buyerToken
    "communities list"
}
Test-Flow "22b: GET /tradetalk/posts" {
    $r = CUrl -Method GET -Uri "$ApiBase/tradetalk/posts?page=1&limit=10" -Token $buyerToken
    "posts list"
}

Write-Host "`n`n========== RESULTS ==========" -ForegroundColor Cyan
$pass = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$fail = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
Write-Host "PASS: $pass | FAIL: $fail | TOTAL: $($results.Count)" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })
$results | Format-Table Flow, Status, Detail -AutoSize | Out-String | ForEach-Object { Write-Host $_ }
