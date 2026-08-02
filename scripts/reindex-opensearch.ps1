param(
  [string]$OpenSearchUrl = "http://localhost:9200",
  [switch]$SkipCreate,
  [switch]$SkipReindex
)

$ErrorActionPreference = "Stop"

# ─── Helper: Invoke OpenSearch API ─────────────────────────────────────────
function Invoke-OpenSearch {
  param([string]$Method, [string]$Path, [string]$BodyFile)
  $url = "$OpenSearchUrl/$Path"
  $args = @("-s", "-X", $Method, $url, "-H", "Content-Type: application/json")
  if ($BodyFile) {
    $args += "-d", "@$BodyFile"
  }
  $result = & curl.exe @args 2>&1
  if ($LASTEXITCODE -ne 0) { throw "curl failed: $result" }
  return $result
}

# ─── 1. Create temp directory for mapping bodies ──────────────────────────
$tmpDir = Join-Path $env:TEMP "opensearch-reindex-$(Get-Random)"
New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null

# ─── 2. INDICES TO CREATE ─────────────────────────────────────────────────

# These JSON bodies are extracted from apps/api/src/modules/tradfind/tradfind.config.ts

# ── products ───────────────────────────────────────────────────────────────
@"
{
  "settings": {
    "index": {
      "number_of_shards": 2,
      "number_of_replicas": 1,
      "analysis": {
        "analyzer": {
          "tradingo_analyzer": {
            "type": "custom",
            "tokenizer": "standard",
            "filter": ["lowercase", "asciifolding", "edge_ngram_filter", "stop", "snowball"]
          },
          "autocomplete_analyzer": {
            "type": "custom",
            "tokenizer": "edge_ngram_tokenizer",
            "filter": ["lowercase", "asciifolding"]
          }
        },
        "tokenizer": {
          "edge_ngram_tokenizer": {
            "type": "edge_ngram",
            "min_gram": 2,
            "max_gram": 20,
            "token_chars": ["letter", "digit"]
          }
        },
        "filter": {
          "edge_ngram_filter": {
            "type": "edge_ngram",
            "min_gram": 2,
            "max_gram": 20
          },
          "snowball": {
            "type": "snowball",
            "language": "English"
          }
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "name": {
        "type": "text",
        "analyzer": "tradingo_analyzer",
        "fields": {
          "keyword": { "type": "keyword" },
          "autocomplete": { "type": "text", "analyzer": "autocomplete_analyzer" }
        }
      },
      "slug": { "type": "keyword" },
      "shortDescription": { "type": "text", "analyzer": "tradingo_analyzer" },
      "description": { "type": "text", "analyzer": "tradingo_analyzer" },
      "productType": { "type": "keyword" },
      "status": { "type": "keyword" },
      "brand": { "type": "text", "analyzer": "tradingo_analyzer" },
      "sku": { "type": "keyword" },
      "moq": { "type": "integer" },
      "unit": { "type": "keyword" },
      "minPrice": { "type": "float" },
      "maxPrice": { "type": "float" },
      "currency": { "type": "keyword" },
      "isFeatured": { "type": "boolean" },
      "trustScoreSnapshot": { "type": "integer" },
      "verificationLevel": { "type": "keyword" },
      "companyId": { "type": "keyword" },
      "companyName": { "type": "text", "analyzer": "tradingo_analyzer" },
      "companySlug": { "type": "keyword" },
      "businessType": { "type": "keyword" },
      "categoryId": { "type": "keyword" },
      "categoryName": { "type": "keyword" },
      "industryId": { "type": "keyword" },
      "industryName": { "type": "keyword" },
      "location": { "type": "geo_point" },
      "city": { "type": "keyword" },
      "state": { "type": "keyword" },
      "country": { "type": "keyword" },
      "createdAt": { "type": "date" },
      "updatedAt": { "type": "date" },
      "media": {
        "type": "nested",
        "properties": {
          "type": { "type": "keyword" },
          "url": { "type": "keyword" }
        }
      },
      "name_suggest": {
        "type": "completion",
        "analyzer": "simple",
        "search_analyzer": "simple"
      }
    }
  }
}
"@ | Out-File -FilePath "$tmpDir\products.json" -Encoding utf8

# ── companies ──────────────────────────────────────────────────────────────
@"
{
  "settings": {
    "index": {
      "number_of_shards": 2,
      "number_of_replicas": 1,
      "analysis": {
        "analyzer": {
          "tradingo_analyzer": {
            "type": "custom",
            "tokenizer": "standard",
            "filter": ["lowercase", "asciifolding", "edge_ngram_filter", "stop", "snowball"]
          }
        },
        "tokenizer": {
          "edge_ngram_tokenizer": {
            "type": "edge_ngram",
            "min_gram": 2,
            "max_gram": 20,
            "token_chars": ["letter", "digit"]
          }
        },
        "filter": {
          "edge_ngram_filter": {
            "type": "edge_ngram",
            "min_gram": 2,
            "max_gram": 20
          },
          "snowball": {
            "type": "snowball",
            "language": "English"
          }
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "name": {
        "type": "text",
        "analyzer": "tradingo_analyzer",
        "fields": {
          "keyword": { "type": "keyword" }
        }
      },
      "slug": { "type": "keyword" },
      "description": { "type": "text", "analyzer": "tradingo_analyzer" },
      "logo": { "type": "keyword" },
      "banner": { "type": "keyword" },
      "businessType": { "type": "keyword" },
      "geographicReach": { "type": "keyword" },
      "trustScore": { "type": "integer" },
      "verificationLevel": { "type": "keyword" },
      "status": { "type": "keyword" },
      "totalProducts": { "type": "integer" },
      "responseRate": { "type": "float" },
      "categoryIds": { "type": "keyword" },
      "categoryNames": { "type": "keyword" },
      "industryIds": { "type": "keyword" },
      "industryNames": { "type": "keyword" },
      "location": { "type": "geo_point" },
      "city": { "type": "keyword" },
      "state": { "type": "keyword" },
      "country": { "type": "keyword" },
      "createdAt": { "type": "date" },
      "updatedAt": { "type": "date" },
      "isGstVerified": { "type": "boolean" },
      "isBankVerified": { "type": "boolean" },
      "vendorCode": { "type": "keyword" },
      "subscriptionStatus": { "type": "keyword" },
      "goCashBalance": { "type": "integer" },
      "profileCompletionPercentage": { "type": "integer" },
      "name_suggest": {
        "type": "completion",
        "analyzer": "simple",
        "search_analyzer": "simple"
      }
    }
  }
}
"@ | Out-File -FilePath "$tmpDir\companies.json" -Encoding utf8

# ── categories ─────────────────────────────────────────────────────────────
@"
{
  "settings": {
    "index": {
      "number_of_shards": 1,
      "number_of_replicas": 1,
      "analysis": {
        "analyzer": {
          "tradingo_analyzer": {
            "type": "custom",
            "tokenizer": "standard",
            "filter": ["lowercase", "asciifolding"]
          }
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "name": {
        "type": "text",
        "analyzer": "tradingo_analyzer",
        "fields": {
          "keyword": { "type": "keyword" }
        }
      },
      "slug": { "type": "keyword" },
      "description": { "type": "text", "analyzer": "tradingo_analyzer" },
      "icon": { "type": "keyword" },
      "image": { "type": "keyword" },
      "parentId": { "type": "keyword" },
      "isActive": { "type": "boolean" },
      "sortOrder": { "type": "integer" },
      "productCount": { "type": "integer" },
      "createdAt": { "type": "date" },
      "name_suggest": {
        "type": "completion",
        "analyzer": "simple",
        "search_analyzer": "simple"
      }
    }
  }
}
"@ | Out-File -FilePath "$tmpDir\categories.json" -Encoding utf8

# ── industries ─────────────────────────────────────────────────────────────
@"
{
  "settings": {
    "index": {
      "number_of_shards": 1,
      "number_of_replicas": 1,
      "analysis": {
        "analyzer": {
          "tradingo_analyzer": {
            "type": "custom",
            "tokenizer": "standard",
            "filter": ["lowercase", "asciifolding"]
          }
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "name": {
        "type": "text",
        "analyzer": "tradingo_analyzer",
        "fields": {
          "keyword": { "type": "keyword" }
        }
      },
      "slug": { "type": "keyword" },
      "description": { "type": "text", "analyzer": "tradingo_analyzer" },
      "icon": { "type": "keyword" },
      "productCount": { "type": "integer" },
      "createdAt": { "type": "date" },
      "name_suggest": {
        "type": "completion",
        "analyzer": "simple",
        "search_analyzer": "simple"
      }
    }
  }
}
"@ | Out-File -FilePath "$tmpDir\industries.json" -Encoding utf8

# ─── 3. Create indices via OpenSearch API ──────────────────────────────────
Write-Host "=== Creating OpenSearch indices ===" -ForegroundColor Cyan

if (-not $SkipCreate) {
  $indices = @(
    @{ Name = "products";    File = "$tmpDir\products.json" },
    @{ Name = "companies";   File = "$tmpDir\companies.json" },
    @{ Name = "categories";  File = "$tmpDir\categories.json" },
    @{ Name = "industries";  File = "$tmpDir\industries.json" }
  )

  foreach ($idx in $indices) {
    Write-Host "Creating index: $($idx.Name) ..." -NoNewline
    try {
      $response = Invoke-OpenSearch -Method "PUT" -Path $idx.Name -BodyFile $idx.File
      $parsed = $response | ConvertFrom-Json
      if ($parsed.acknowledged -eq $true) {
        Write-Host " OK ($($parsed.index))" -ForegroundColor Green
      } else {
        Write-Host " FAILED: $response" -ForegroundColor Red
      }
    } catch {
      Write-Host " ERROR: $_" -ForegroundColor Red
    }
  }
} else {
  Write-Host "Skipping index creation (SkipCreate flag)" -ForegroundColor Yellow
}

# ─── 4. Reindex data from Prisma database ──────────────────────────────────
if (-not $SkipReindex) {
  Write-Host "`n=== Reindexing products ===" -ForegroundColor Cyan
  Write-Host "This step requires the NestJS API to be running with the reindex endpoint."
  Write-Host "Run: curl.exe -s -X POST http://localhost:3001/tradfind/reindex"
  Write-Host "`nOr run Prisma queries directly via node to export + bulk index."
  Write-Host "`nSkipping data reindex — run the API reindex endpoint separately." -ForegroundColor Yellow
} else {
  Write-Host "Skipping reindex (SkipReindex flag)" -ForegroundColor Yellow
}

# ─── 5. Verify ──────────────────────────────────────────────────────────────
Write-Host "`n=== Verifying indices ===" -ForegroundColor Cyan
$catResponse = & curl.exe -s "$OpenSearchUrl/_cat/indices?v" 2>&1
Write-Host "$catResponse"

# ─── 6. Cleanup ─────────────────────────────────────────────────────────────
Remove-Item -Path $tmpDir -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "`nDone." -ForegroundColor Green
