param(
    [string]$BuyerEmail = "newtest@tradingo.com",
    [string]$SellerEmail = "seller2@tradingo.com",
    [string]$Password = "Test@1234",
    [string]$ApiBase = "http://localhost:3001/api/v1"
)

$ErrorActionPreference = "Stop"
$results = @()

function Write-Result {
    param($Flow, $Status, $Detail, $StatusCode = $null)
    $obj = [PSCustomObject]@{ Flow = $Flow; Status = $Status; StatusCode = $StatusCode; Detail = $Detail }
    $results += $obj
    Write-Host "[$Status] Flow $Flow : $Detail" -ForegroundColor $(if ($Status -eq "PASS") { "Green" } elseif ($Status -eq "FAIL") { "Red" } else { "Yellow" })
}

function Invoke-Api {
    param($Method, $Uri, $Token, $BodyFile, $ExpectedCode = 200)
    $headers = @{ "Content-Type" = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    $params = @{ Method = $Method; Uri = $Uri; Headers = $headers; UseBasicParsing = $true }
    if ($BodyFile) { $params["InFile"] = $BodyFile }
    try {
        $r = Invoke-RestMethod @params -TimeoutSec 10 -SkipCertificateCheck
        return $r
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $body = $reader.ReadToEnd() | ConvertFrom-Json
        if ($ExpectedCode -and $statusCode -eq $ExpectedCode) { return $body }
        throw "HTTP $statusCode : $($body.message -join '; ')"
    }
}

# ============ LOGIN ============
Write-Host "`n====== LOGGING IN ======" -ForegroundColor Cyan
try {
    $body = "{`"identifier`":`"$BuyerEmail`",`"password`":`"$Password`"}"
    $body | Out-File -FilePath "$env:TEMP\buyer_login.json" -Encoding utf8
    $buyerResp = Invoke-Api -Method Post -Uri "$ApiBase/auth/login" -BodyFile "$env:TEMP\buyer_login.json"
    $buyerToken = $buyerResp.data.accessToken
    $buyerUserId = $buyerResp.data.user.id
    Write-Host "Buyer logged in: $buyerUserId" -ForegroundColor Green
} catch { Write-Result "LOGIN" "FAIL" "Buyer login failed: $_"; exit 1 }

try {
    $body = "{`"identifier`":`"$SellerEmail`",`"password`":`"$Password`"}"
    $body | Out-File -FilePath "$env:TEMP\seller_login.json" -Encoding utf8
    $sellerResp = Invoke-Api -Method Post -Uri "$ApiBase/auth/login" -BodyFile "$env:TEMP\seller_login.json"
    $sellerToken = $sellerResp.data.accessToken
    $sellerUserId = $sellerResp.data.user.id
    Write-Host "Seller logged in: $sellerUserId" -ForegroundColor Green
} catch { Write-Result "LOGIN" "FAIL" "Seller login failed: $_"; exit 1 }

# ============ FLOW 3: COMPANY PROFILE ============
Write-Host "`n====== FLOW 3: COMPANY PROFILE ======" -ForegroundColor Cyan
try {
    $myCompany = Invoke-Api -Method Get -Uri "$ApiBase/companies/my-company" -Token $sellerToken
    $companyId = $myCompany.data.id
    $companyName = $myCompany.data.name
    Write-Result "3a" "PASS" "GET /companies/my-company: $companyName ($companyId)" -StatusCode 200
} catch { Write-Result "3a" "FAIL" "GET /companies/my-company: $_"; $companyId = $null }

if ($companyId) {
    try {
        $patchBody = "{`"description`":`"Test company description`"}"
        $patchBody | Out-File -FilePath "$env:TEMP\patch_company.json" -Encoding utf8
        $headers = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $sellerToken" }
        $r = Invoke-RestMethod -Method Patch -Uri "$ApiBase/companies/my-company" -Headers $headers -InFile "$env:TEMP\patch_company.json" -UseBasicParsing -TimeoutSec 10 -SkipCertificateCheck
        Write-Result "3b" "PASS" "PATCH /companies/my-company: description updated" -StatusCode 200
    } catch { Write-Result "3b" "FAIL" "PATCH /companies/my-company: $_" }
}

# ============ FLOW 4: KYC ============
Write-Host "`n====== FLOW 4: KYC ======" -ForegroundColor Cyan
try {
    $kycBody = "{`"companyId`":`"$companyId`",`"level`":`"LEVEL_1`",`"documents`":[{`"documentType`":`"GST_CERTIFICATE`",`"documentUrl`":`"https://example.com/gst.pdf`"}]}"
    $kycBody | Out-File -FilePath "$env:TEMP\kyc.json" -Encoding utf8
    $headers = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $sellerToken" }
    $r = Invoke-RestMethod -Method Post -Uri "$ApiBase/company-verifications" -Headers $headers -InFile "$env:TEMP\kyc.json" -UseBasicParsing -TimeoutSec 10 -SkipCertificateCheck
    Write-Result "4a" "PASS" "POST /company-verifications: KYC submitted" -StatusCode 201
} catch { Write-Result "4a" "FAIL" "POST /company-verifications: $_" }

try {
    $headers = @{ "Authorization" = "Bearer $sellerToken" }
    $r = Invoke-RestMethod -Method Get -Uri "$ApiBase/company-verifications/my" -Headers $headers -UseBasicParsing -TimeoutSec 10 -SkipCertificateCheck
    Write-Result "4b" "PASS" "GET /company-verifications/my: KYC status retrieved" -StatusCode 200
} catch { Write-Result "4b" "FAIL" "GET /company-verifications/my: $_" }

# ============ FLOW 5: PRODUCT CREATION ============
Write-Host "`n====== FLOW 5: PRODUCT CREATION ======" -ForegroundColor Cyan
try {
    $headers = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $sellerToken" }
    $r = Invoke-RestMethod -Method Get -Uri "$ApiBase/categories/tree" -Headers $headers -UseBasicParsing -TimeoutSec 10 -SkipCertificateCheck
    $catId = $r.data[0].id
    Write-Host "  Got category: $catId" -ForegroundColor Gray
} catch { Write-Result "5a" "WARN" "GET /categories/tree failed, using placeholder"; $catId = "cat-electronics-001" }

try {
    $productBody = "{`"name`":`"Test PCB Board`",`"description`":`"A test printed circuit board for validation`",`"shortDescription`":`"Test PCB`",`"categoryId`":`"$catId`",`"type`":`"PHYSICAL`",`"condition`":`"NEW`",`"status`":`"ACTIVE`",`"images`":[],`"metadata`":{}}"
    $productBody | Out-File -FilePath "$env:TEMP\product.json" -Encoding utf8
    $headers = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $sellerToken" }
    $r = Invoke-RestMethod -Method Post -Uri "$ApiBase/seller/products" -Headers $headers -InFile "$env:TEMP\product.json" -UseBasicParsing -TimeoutSec 10 -SkipCertificateCheck
    $productId = $r.data.id
    Write-Result "5a" "PASS" "POST /seller/products: $productId" -StatusCode 201
} catch { Write-Result "5a" "FAIL" "POST /seller/products: $_"; $productId = $null }

# ============ FLOW 6: PRODUCT SEARCH ============
Write-Host "`n====== FLOW 6: PRODUCT SEARCH ======" -ForegroundColor Cyan
try {
    $r = Invoke-RestMethod -Method Get -Uri "$ApiBase/search/products?q=PCB&page=1&limit=10" -UseBasicParsing -TimeoutSec 10 -SkipCertificateCheck
    Write-Result "6a" "PASS" "GET /search/products?q=PCB: found $($r.data.meta.total) results" -StatusCode 200
} catch { Write-Result "6a" "FAIL" "GET /search/products: $_" }

try {
    $r = Invoke-RestMethod -Method Get -Uri "$ApiBase/search/products?page=1&limit=10" -UseBasicParsing -TimeoutSec 10 -SkipCertificateCheck
    Write-Result "6b" "PASS" "GET /search/products (no query): found $($r.data.meta.total) results" -StatusCode 200
} catch { Write-Result "6b" "FAIL" "GET /search/products (no query): $_" }

# ============ FLOW 7: SAVED PRODUCTS ============
Write-Host "`n====== FLOW 7: SAVED PRODUCTS ======" -ForegroundColor Cyan
try {
    $headers = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $buyerToken" }
    $r = Invoke-RestMethod -Method Post -Uri "$ApiBase/buyer/saved-products/$productId" -Headers $headers -UseBasicParsing -TimeoutSec 10 -SkipCertificateCheck
    Write-Result "7a" "PASS" "POST /buyer/saved-products: saved product" -StatusCode 201
} catch { Write-Result "7a" "FAIL" "POST /buyer/saved-products: $_" }

try {
    $headers = @{ "Authorization" = "Bearer $buyerToken" }
    $r = Invoke-RestMethod -Method Get -Uri "$ApiBase/buyer/saved-products" -Headers $headers -UseBasicParsing -TimeoutSec 10 -SkipCertificateCheck
    Write-Result "7b" "PASS" "GET /buyer/saved-products: retrieved list" -StatusCode 200
} catch { Write-Result "7b" "FAIL" "GET /buyer/saved-products: $_" }

# ============ FLOW 8: RFQ ============
Write-Host "`n====== FLOW 8: RFQ ======" -ForegroundColor Cyan
try {
    $rfqBody = "{`"title`":`"Need PCB Boards`",`"description`":`"Looking for 1000 PCB boards`",`"categoryId`":`"$catId`",`"expectedPrice`":5000,`"quantity`":1000,`"unit`":`"pieces`",`"rfqType`":`"RFQ`",`"source`":`"BUYER`",`"productItems`":[{`"name`":`"PCB Board`",`"quantity`":1000,`"unit`":`"pieces`"}]}"
    $rfqBody | Out-File -FilePath "$env:TEMP\rfq.json" -Encoding utf8
    $headers = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $buyerToken" }
    $r = Invoke-RestMethod -Method Post -Uri "$ApiBase/smart-rfq" -Headers $headers -InFile "$env:TEMP\rfq.json" -UseBasicParsing -TimeoutSec 10 -SkipCertificateCheck
    $rfqId = $r.data.id
    Write-Result "8a" "PASS" "POST /smart-rfq: $rfqId" -StatusCode 201
} catch { Write-Result "8a" "FAIL" "POST /smart-rfq: $_"; $rfqId = $null }

# ============ FLOW 9: QUOTE ============
Write-Host "`n====== FLOW 9: QUOTE ======" -ForegroundColor Cyan
if ($rfqId) {
    try {
        $quoteBody = "{`"items`":[{`"productName`":`"PCB Board`",`"quantity`":1000,`"unitPrice`":4.5,`"totalPrice`":4500}],`"validUntil`":`"2026-08-20T00:00:00Z`",`"notes`":`"Bulk discount applied`"}"
        $quoteBody | Out-File -FilePath "$env:TEMP\quote.json" -Encoding utf8
        $headers = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $sellerToken" }
        $r = Invoke-RestMethod -Method Post -Uri "$ApiBase/companies/$companyId/rfq/$rfqId/quotes" -Headers $headers -InFile "$env:TEMP\quote.json" -UseBasicParsing -TimeoutSec 10 -SkipCertificateCheck
        $quoteId = $r.data.id
        Write-Result "9a" "PASS" "POST quotes: $quoteId" -StatusCode 201
    } catch { Write-Result "9a" "FAIL" "POST quotes: $_"; $quoteId = $null }
}

# ============ FLOW 10: NEGOTIATION ============
Write-Host "`n====== FLOW 10: NEGOTIATION ======" -ForegroundColor Cyan
if ($rfqId) {
    try {
        $headers = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $buyerToken" }
        $r = Invoke-RestMethod -Method Post -Uri "$ApiBase/smart-rfq/$rfqId/accept-quote/$quoteId" -Headers $headers -UseBasicParsing -TimeoutSec 10 -SkipCertificateCheck
        Write-Result "10a" "PASS" "POST accept-quote: quote accepted" -StatusCode 201
    } catch { Write-Result "10a" "FAIL" "POST accept-quote: $_" }
}

# ============ FLOW 11: PURCHASE ORDER ============
Write-Host "`n====== FLOW 11: PO ======" -ForegroundColor Cyan
try {
    $poBody = "{`"companyId`":`"$companyId`",`"items`":[{`"productName`":`"PCB Board`",`"quantity`":1000,`"unitPrice`":4.5,`"totalPrice`":4500}]}"
    $poBody | Out-File -FilePath "$env:TEMP\po.json" -Encoding utf8
    $headers = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $buyerToken" }
    $r = Invoke-RestMethod -Method Post -Uri "$ApiBase/smart-po" -Headers $headers -InFile "$env:TEMP\po.json" -UseBasicParsing -TimeoutSec 10 -SkipCertificateCheck
    $poId = $r.data.id
    Write-Result "11a" "PASS" "POST /smart-po: $poId" -StatusCode 201
} catch { Write-Result "11a" "FAIL" "POST /smart-po: $_"; $poId = $null }

# ============ FLOW 12: PAYMENT ============
Write-Host "`n====== FLOW 12: PAYMENT ======" -ForegroundColor Cyan
if ($poId -and $companyId) {
    try {
        $headers = @{ "Authorization" = "Bearer $buyerToken" }
        $r = Invoke-RestMethod -Method Get -Uri "$ApiBase/companies/$companyId/payments" -Headers $headers -UseBasicParsing -TimeoutSec 10 -SkipCertificateCheck
        Write-Result "12a" "PASS" "GET payments: payments list" -StatusCode 200
    } catch { Write-Result "12a" "FAIL" "GET payments: $_" }
}

# ============ FLOW 15: ORDER LIFECYCLE ============
Write-Host "`n====== FLOW 15: ORDER ======" -ForegroundColor Cyan
if ($companyId) {
    try {
        $headers = @{ "Authorization" = "Bearer $sellerToken" }
        $r = Invoke-RestMethod -Method Get -Uri "$ApiBase/companies/$companyId/orders" -Headers $headers -UseBasicParsing -TimeoutSec 10 -SkipCertificateCheck
        Write-Result "15a" "PASS" "GET orders: orders list" -StatusCode 200
    } catch { Write-Result "15a" "FAIL" "GET orders: $_" }
}

# ============ FLOW 17: ANALYTICS ============
Write-Host "`n====== FLOW 17: ANALYTICS ======" -ForegroundColor Cyan
try {
    $headers = @{ "Authorization" = "Bearer $sellerToken" }
    $r = Invoke-RestMethod -Method Get -Uri "$ApiBase/seller/analytics/overview" -Headers $headers -UseBasicParsing -TimeoutSec 10 -SkipCertificateCheck
    Write-Result "17a" "PASS" "GET seller/analytics/overview: analytics retrieved" -StatusCode 200
} catch { Write-Result "17a" "FAIL" "GET seller/analytics/overview: $_" }

# ============ FLOW 18: DASHBOARD ============
Write-Host "`n====== FLOW 18: DASHBOARD ======" -ForegroundColor Cyan
try {
    $headers = @{ "Authorization" = "Bearer $buyerToken" }
    $r = Invoke-RestMethod -Method Get -Uri "$ApiBase/buyer/dashboard" -Headers $headers -UseBasicParsing -TimeoutSec 10 -SkipCertificateCheck
    Write-Result "18a" "PASS" "GET buyer/dashboard: dashboard data" -StatusCode 200
} catch { Write-Result "18a" "FAIL" "GET buyer/dashboard: $_" }

# ============ FLOW 19: MEMBERSHIP ============
Write-Host "`n====== FLOW 19: MEMBERSHIP ======" -ForegroundColor Cyan
try {
    $headers = @{ "Authorization" = "Bearer $sellerToken" }
    $r = Invoke-RestMethod -Method Get -Uri "$ApiBase/membership/current" -Headers $headers -UseBasicParsing -TimeoutSec 10 -SkipCertificateCheck
    Write-Result "19a" "PASS" "GET membership/current: membership data" -StatusCode 200
} catch { Write-Result "19a" "FAIL" "GET membership/current: $_" }

# ============ FLOW 20: NOTIFICATIONS ============
Write-Host "`n====== FLOW 20: NOTIFICATIONS ======" -ForegroundColor Cyan
if ($companyId) {
    try {
        $headers = @{ "Authorization" = "Bearer $sellerToken" }
        $r = Invoke-RestMethod -Method Get -Uri "$ApiBase/companies/$companyId/notifications" -Headers $headers -UseBasicParsing -TimeoutSec 10 -SkipCertificateCheck
        Write-Result "20a" "PASS" "GET notifications: notifications list" -StatusCode 200
    } catch { Write-Result "20a" "FAIL" "GET notifications: $_" }
}

# ============ FLOW 21: GOCASH ============
Write-Host "`n====== FLOW 21: GOCASH ======" -ForegroundColor Cyan
try {
    $headers = @{ "Authorization" = "Bearer $buyerToken" }
    $r = Invoke-RestMethod -Method Get -Uri "$ApiBase/wallet/buyer/summary" -Headers $headers -UseBasicParsing -TimeoutSec 10 -SkipCertificateCheck
    Write-Result "21a" "PASS" "GET wallet/buyer/summary: GOCASH wallet" -StatusCode 200
} catch { Write-Result "21a" "FAIL" "GET wallet/buyer/summary: $_" }

# ============ SUMMARY ============
Write-Host "`n`n========== TEST SUMMARY ==========" -ForegroundColor Cyan
$pass = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$fail = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
$warn = ($results | Where-Object { $_.Status -eq "WARN" }).Count
Write-Host "PASS: $pass | FAIL: $fail | WARN: $warn | TOTAL: $($results.Count)" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })
$results | Format-Table Flow, Status, StatusCode, Detail -AutoSize
$results | ConvertTo-Json
