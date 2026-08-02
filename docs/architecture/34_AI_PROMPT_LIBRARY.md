# TRADINGO AI Prompt Library

> Registry of all AI prompts auto-seeded by each domain module. Prompts are stored in the `AiPrompt` Prisma model with versioning.

## Prompt Storage

```prisma
model AiPrompt {
  id          String   @id @default(uuid())
  taskType    TaskType
  version     Int      @default(1)
  name        String
  systemPrompt String  @db.Text
  userPrompt  String?  @db.Text
  variables   String[] // Template variables {{varName}}
  temperature Float?   @default(0.3)
  maxTokens   Int?     @default(4096)
  isActive    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([taskType, version])
  @@index([taskType, isActive])
}
```

## TaskType → Prompt Summary

| TaskType | Prompt Name | Temperature | MaxTokens | Variables |
|----------|-------------|-------------|-----------|-----------|
| PRODUCT_DESCRIPTION | Product Description Generator | 0.3 | 4096 | productName, category, features, specs |
| SEO_GENERATION | SEO Metadata Generator | 0.3 | 2048 | productName, category, description |
| TRANSLATION | Product Translation | 0.3 | 4096 | text, sourceLang, targetLang |
| SPEC_SUGGESTION | Specification Suggester | 0.3 | 2048 | productName, category |
| IMAGE_SUGGESTION | Image Type Suggester | 0.3 | 1024 | productName, category |
| QUALITY_SCORING | Catalog Quality Scorer | 0.3 | 1024 | productData |
| DUPLICATE_DETECTION | Duplicate Product Detector | 0.3 | 2048 | productData, existingProducts |
| OCR | Document OCR | 0.3 | 4096 | imageData |
| FAST_SUGGESTION | Quick Product Suggestion | 0.3 | 1024 | query, context |
| LIVE_SEARCH | Web Search | 0.3 | 2048 | query |
| WEBSITE_IMPORT | Website Product Importer | 0.3 | 4096 | url |
| RFQ_ANALYSIS | RFQ Intelligence | 0.3 | 4096 | rfqData |
| QUOTE_ANALYSIS | Quote Analysis | 0.3 | 4096 | quoteData, marketData |
| NEGOTIATION | Negotiation Intelligence | 0.3 | 4096 | negotiationData, history |
| CRM_ANALYSIS | CRM Intelligence | 0.3 | 4096 | leadData, interactions |
| FINANCE_ANALYSIS | Finance Analysis | 0.3 | 4096 | financialData |
| SEARCH_ANALYSIS | Search Intelligence | 0.3 | 2048 | query, results |
| ADMIN_INTELLIGENCE | Admin Intelligence | 0.3 | 4096 | platformData |
| GENERAL_CHAT | General Chat | 0.7 | 2048 | message, context |

## Prompt Management

- **Versioning**: Each prompt can have multiple versions, uniquely identified by `[taskType, version]`
- **Activation**: Only one version active per taskType — deactivates all others
- **Fallback**: If no prompt exists for a taskType, a generic prompt is created
- **Auto-seed**: Each AI sub-module seeds its prompt in `onModuleInit()`
- **Variables**: Templates use `{{variableName}}` syntax, rendered via `renderPrompt()`

## Example Prompt Structure

```typescript
// PRODUCT_DESCRIPTION prompt
{
  taskType: 'PRODUCT_DESCRIPTION',
  version: 1,
  name: 'Product Description Generator',
  systemPrompt: 'You are a professional B2B product description writer for TRADINGO marketplace. Generate compelling, accurate, and SEO-optimized product descriptions.',
  userPrompt: 'Product: {{productName}}\nCategory: {{category}}\nFeatures: {{features}}\nSpecifications: {{specs}}\n\nGenerate a professional product description suitable for B2B buyers.',
  variables: ['productName', 'category', 'features', 'specs'],
  temperature: 0.3,
  maxTokens: 4096,
  isActive: true
}
```

## AI Credit Costs (Per TaskType)

| TaskType | Credits | Cost Basis |
|----------|---------|------------|
| PRODUCT_DESCRIPTION | 10 | Complex generation |
| SEO_GENERATION | 5 | Medium generation |
| TRANSLATION | 8 | Multi-language |
| SPEC_SUGGESTION | 3 | Quick suggestion |
| IMAGE_SUGGESTION | 3 | Quick suggestion |
| QUALITY_SCORING | 2 | Simple scoring |
| DUPLICATE_DETECTION | 5 | Comparison |
| OCR | 10 | Vision processing |
| FAST_SUGGESTION | 1 | Ultra-fast |
| LIVE_SEARCH | 2 | External API |
| WEBSITE_IMPORT | 15 | Complex scraping |
| RFQ_ANALYSIS | 15 | Complex analysis |
| QUOTE_ANALYSIS | 15 | Complex analysis |
| NEGOTIATION | 20 | Most complex |
| CRM_ANALYSIS | 5 | Medium analysis |
| FINANCE_ANALYSIS | 10 | Complex analysis |
| SEARCH_ANALYSIS | 5 | Medium analysis |
| ADMIN_INTELLIGENCE | 10 | Complex analysis |
| GENERAL_CHAT | 1 | Simple chat |
