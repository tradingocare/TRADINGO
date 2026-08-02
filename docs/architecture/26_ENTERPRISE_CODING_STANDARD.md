# TRADINGO Enterprise Coding Standard

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Models | PascalCase, singular | `User`, `Company`, `GOCASH_Wallet` |
| Fields | camelCase | `firstName`, `createdAt`, `currentBalance` |
| Enums | PascalCase | `Role`, `OrderStatus`, `GOCASHTransactionType` |
| Enum values | UPPER_CASE | `ACTIVE`, `PENDING_REVIEW`, `LEVEL_0` |
| Files | kebab-case | `gocash.service.ts`, `wallet-api.controller.ts` |
| Classes | PascalCase | `GocashService`, `JwtAuthGuard` |
| Functions | camelCase | `getBalance()`, `checkCredits()` |
| Variables | camelCase | `companyId`, `walletBalance` |
| Constants | UPPER_CASE | `CREDIT_COSTS`, `PLAN_AI_CREDITS` |
| DTOs | PascalCase + suffix | `CreateWalletDto`, `LedgerQueryDto` |
| Interfaces | PascalCase | `WalletSummary`, `LedgerEntry` |

## DTO Standards

Every backend endpoint must have a typed DTO with class-validator decorators:

```typescript
import { IsString, IsOptional, IsUUID, IsEnum, Min } from 'class-validator'

export class CreditWalletDto {
  @IsNumber()
  @Min(0.01)
  amount: number

  @IsEnum(GOCASHTransactionType)
  type: GOCASHTransactionType

  @IsString()
  reason: string

  @IsOptional()
  @IsUUID()
  referenceId?: string

  @IsOptional()
  @IsString()
  idempotencyKey?: string
}
```

## Pagination Rules

Use shared pagination utilities from `common/dto/pagination.dto.ts`:

```typescript
// Request: Use PaginationDto
class MyQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string
}

// Service: Use buildPaginationQuery + buildPaginatedResult
async findAll(query: MyQueryDto) {
  const { skip, take, orderBy } = buildPaginationQuery(query)
  const [data, total] = await Promise.all([
    this.prisma.model.findMany({ skip, take, orderBy }),
    this.prisma.model.count()
  ])
  return buildPaginatedResult(data, total, query)
}
```

## Error Handling

```typescript
// Service layer - throw NestJS exceptions
if (!wallet) throw new NotFoundException('Wallet not found')
if (wallet.status !== 'ACTIVE') throw new BadRequestException('Wallet is not active')
if (amount > wallet.availableBalance) throw new BadRequestException('Insufficient balance')

// AI credit check
if (!credits.sufficient) {
  throw new HttpException(
    { message: 'Insufficient AI credits', available: credits.available, required: credits.required },
    402
  )
}

// Controller - let global filter handle it
@Post()
@Roles('ADMIN')
async create(@Body() dto: CreateWalletDto) {
  return this.service.create(dto)
}
```

## Logging

Use NestJS Logger for service-level logging:

```typescript
private readonly logger = new Logger(GocashService.name)

this.logger.log(`Credited ${amount} GOCASH to wallet ${walletId}`)
this.logger.error(`Failed to process transaction: ${error.message}`)
```

## API Response Format

All responses wrapped by `TransformInterceptor`:

```typescript
// Success
{ statusCode: 200, message: 'Success', data: { ... }, timestamp: '2026-07-04T...' }

// Error
{ statusCode: 400, message: ['Validation failed'], error: 'Bad Request', timestamp: '...', path: '/api/v1/...' }

// Pagination
{ data: [...], meta: { total: 100, page: 1, limit: 10, totalPages: 10, hasNext: true, hasPrevious: false } }
```

## Testing Conventions

- Unit tests: Jest (`.spec.ts` alongside implementation)
- E2E tests: Playwright (`playwright.config.ts` at root)
- Test files located alongside module or in `__tests__/` directory
- Mock external services (AI, payments, SMS) in tests
