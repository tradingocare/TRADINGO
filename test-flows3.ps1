param()

$ApiBase = "http://localhost:3001/api/v1"
$TEMP = $env:TEMP

function CUrl {
    param($Method, $Uri, $Token, $Body)
    $args = @("-s", "-X", $Method, $Uri, "-m", "15")
    if ($Token) { $args += "-H"; $args += "Authorization: Bearer $Token" }
    $args += "-H"; $args += "Content-Type: application/json"
    if ($Body) { $bf = [System.IO.Path]::GetTempFileName(); $Body | Out-File -Encoding utf8 -FilePath $bf; $args += "--data"; $args += "@$bf" }
    $resp = curl.exe @args 2>&1
    $obj = $resp | ConvertFrom-Json
    if ($obj.statusCode -and $obj.statusCode -ge 400) { throw "HTTP $($obj.statusCode): $($obj.message -join '; ')" }
    return $obj
}

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

Write-Host "=== LOGIN ===" -ForegroundColor Cyan
$r1 = CUrl -Method POST -Uri "$ApiBase/auth/login" -Body '{"identifier":"newtest@tradingo.com","password":"Test@1234"}'
$buyerToken = $r1.data.accessToken
$buyerId = $r1.data.user.id
Write-Host "  Buyer: $buyerId" -ForegroundColor Green

$r2 = CUrl -Method POST -Uri "$ApiBase/auth/login" -Body '{"identifier":"seller2@tradingo.com","password":"Test@1234"}'
$sellerToken = $r2.data.accessToken
$sellerId = $r2.data.user.id
Write-Host "  Seller: $sellerId" -ForegroundColor Green

Write-Host "`n=== FLOW 3: COMPANY PROFILE ===" -ForegroundColor Cyan
Test-Flow "3a GET my-company" {
    $r = CUrl -Method GET -Uri "$ApiBase/companies/my-company" -Token $sellerToken
    $script:companyId = $r.data.id
    "$($r.data.name) ($($r.data.id))"
}
Test-Flow "3b PATCH my-company" {
    CUrl -Method PATCH -Uri "$ApiBase/companies/my-company" -Token $sellerToken -Body '{"description":"Updated desc"}'
    "ok"
}

Write-Host "`n=== FLOW 4: KYC ===" -ForegroundColor Cyan
Test-Flow "4a POST company-verifications" {
    $b = '{"companyId":"' + $companyId + '","level":"LEVEL_1","documents":[{"documentType":"GST_CERTIFICATE","documentUrl":"https://ex.com/gst.pdf"}]}'
    CUrl -Method POST -Uri "$ApiBase/company-verifications" -Token $sellerToken -Body $b
    "submitted"
}
Test-Flow "4b GET verifications/my" {
    CUrl -Method GET -Uri "$ApiBase/company-verifications/my" -Token $sellerToken
    "retrieved"
}

Write-Host "`n=== FLOW 5: PRODUCT CREATION ===" -ForegroundColor Cyan
Test-Flow "5a GET categories/tree" {
    $r = CUrl -Method GET -Uri "$ApiBase/categories/tree" -Token $sellerToken
    $script:catId = $r.data[0].id
    "category: $script:catId"
}
Test-Flow "5b POST seller/products" {
    $b = '{"name":"Test PCB Board","description":"Test PCB","shortDescription":"PCB","categoryId":"' + $catId + '","type":"PHYSICAL","condition":"NEW","status":"ACTIVE","images":[],"metadata":{}}'
    $r = CUrl -Method POST -Uri "$ApiBase/seller/products" -Token $sellerToken -Body $b
    $script:productId = $r.data.id
    "product: $script:productId"
}

Write-Host "`n=== FLOW 6: SEARCH ===" -ForegroundColor Cyan
Test-Flow "6a search products q=PCB" {
    $r = CUrl -Method GET -Uri "$ApiBase/search/products?q=PCB&page=1&limit=10"
    "found $($r.data.meta.total) results"
}
Test-Flow "6b search all" {
    $r = CUrl -Method GET -Uri "$ApiBase/search/products?page=1&limit=10"
    "found $($r.data.meta.total) total"
}

Write-Host "`n=== FLOW 7: SAVED PRODUCTS ===" -ForegroundColor Cyan
Test-Flow "7a POST saved-products" {
    CUrl -Method POST -Uri "$ApiBase/buyer/saved-products/$productId" -Token $buyerToken
    "saved"
}
Test-Flow "7b GET saved-products" {
    CUrl -Method GET -Uri "$ApiBase/buyer/saved-products" -Token $buyerToken
    "list ok"
}

Write-Host "`n=== FLOW 8: RFQ ===" -ForegroundColor Cyan
Test-Flow "8a POST smart-rfq" {
    $b = '{"title":"Need PCBs","description":"Need 1000 PCB boards","categoryId":"' + $catId + '","quantity":1000,"unit":"pieces","rfqType":"RFQ","source":"BUYER","productItems":[{"name":"PCB Board","quantity":1000,"unit":"pieces"}]}'
    $r = CUrl -Method POST -Uri "$ApiBase/smart-rfq" -Token $buyerToken -Body $b
    $script:rfqId = $r.data.id
    "RFQ: $script:rfqId"
}

Write-Host "`n=== FLOW 9: QUOTE ===" -ForegroundColor Cyan
if ($rfqId) {
    Test-Flow "9a POST quotes" {
        $b = '{"items":[{"productName":"PCB Board","quantity":1000,"unitPrice":4.5,"totalPrice":4500}],"validUntil":"2026-08-20T00:00:00Z","notes":"Bulk discount"}'
        $r = CUrl -Method POST -Uri "$ApiBase/companies/$companyId/rfq/$rfqId/quotes" -Token $sellerToken -Body $b
        $script:quoteId = $r.data.id
        "Quote: $script:quoteId"
    }
}

Write-Host "`n=== FLOW 10: ACCEPT QUOTE ===" -ForegroundColor Cyan
if ($rfqId -and $quoteId) {
    Test-Flow "10a accept-quote" {
        CUrl -Method POST -Uri "$ApiBase/smart-rfq/$rfqId/accept-quote/$quoteId" -Token $buyerToken
        "accepted"
    }
}

Write-Host "`n=== FLOW 11: PO ===" -ForegroundColor Cyan
Test-Flow "11a POST smart-po" {
    $b = '{"companyId":"' + $companyId + '","items":[{"productName":"PCB Board","quantity":1000,"unitPrice":4.5,"totalPrice":4500}]}'
    $r = CUrl -Method POST -Uri "$ApiBase/smart-po" -Token $buyerToken -Body $b
    $script:poId = $r.data.id
    "PO: $script:poId"
}

Write-Host "`n=== FLOW 12: PAYMENT ===" -ForegroundColor Cyan
Test-Flow "12a GET payments" {
    CUrl -Method GET -Uri "$ApiBase/companies/$companyId/payments" -Token $buyerToken
    "payments ok"
}

Write-Host "`n=== FLOW 13: ESCROW ===" -ForegroundColor Cyan
Test-Flow "13a GET escrow" {
    CUrl -Method GET -Uri "$ApiBase/companies/$companyId/escrow" -Token $buyerToken
    "escrow ok"
}

Write-Host "`n=== FLOW 15: ORDERS ===" -ForegroundColor Cyan
Test-Flow "15a GET orders" {
    CUrl -Method GET -Uri "$ApiBase/companies/$companyId/orders" -Token $sellerToken
    "orders ok"
}

Write-Host "`n=== FLOW 17: SELLER ANALYTICS ===" -ForegroundColor Cyan
Test-Flow "17a GET seller/analytics" {
    CUrl -Method GET -Uri "$ApiBase/seller/analytics/overview" -Token $sellerToken
    "analytics ok"
}

Write-Host "`n=== FLOW 18: BUYER DASHBOARD ===" -ForegroundColor Cyan
Test-Flow "18a GET buyer/dashboard" {
    CUrl -Method GET -Uri "$ApiBase/buyer/dashboard" -Token $buyerToken
    "dashboard ok"
}

Write-Host "`n=== FLOW 19: MEMBERSHIP ===" -ForegroundColor Cyan
Test-Flow "19a GET membership/current" {
    CUrl -Method GET -Uri "$ApiBase/membership/current" -Token $sellerToken
    "membership ok"
}

Write-Host "`n=== FLOW 20: NOTIFICATIONS ===" -ForegroundColor Cyan
Test-Flow "20a GET notifications" {
    CUrl -Method GET -Uri "$ApiBase/companies/$companyId/notifications" -Token $sellerToken
    "notifications ok"
}

Write-Host "`n=== FLOW 21: GOCASH ===" -ForegroundColor Cyan
Test-Flow "21a GET wallet/buyer/summary" {
    CUrl -Method GET -Uri "$ApiBase/wallet/buyer/summary" -Token $buyerToken
    "wallet ok"
}
Test-Flow "21b GET wallet/seller/summary" {
    CUrl -Method GET -Uri "$ApiBase/wallet/seller/summary" -Token $sellerToken
    "wallet ok"
}

Write-Host "`n=== FLOW 22: TRADETALK ===" -ForegroundColor Cyan
Test-Flow "22a GET communities" {
    CUrl -Method GET -Uri "$ApiBase/tradetalk/communities?page=1&limit=10" -Token $buyerToken
    "communities ok"
}
Test-Flow "22b GET posts" {
    CUrl -Method GET -Uri "$ApiBase/tradetalk/posts?page=1&limit=10" -Token $buyerToken
    "posts ok"
}

Write-Host "`n`n========== SUMMARY ==========" -ForegroundColor Cyan
$pass = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$fail = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
$total = $results.Count
Write-Host "PASS: $pass | FAIL: $fail | TOTAL: $total" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })
$results | Format-Table Flow, Status, Detail -AutoSize | Out-String
