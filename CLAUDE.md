# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A production-ready web scraping platform that automates data collection from multiple sources (Shell, Castrol, Google, LinkedIn) with enterprise-grade features including crash recovery, parallel execution, and real-time monitoring. The system handles large-scale scraping operations with reliability, featuring pausable/resumable jobs, checkpoint-based recovery, and intelligent deduplication.

## Core Business Logic

### Job Lifecycle
1. **Job Creation**: Jobs can be created with optional structured input (search terms, URLs)
2. **State Management**: PENDING → RUNNING → COMPLETED/FAILED (with PAUSED/CANCELLED states)
3. **Parallel Execution**: Multiple jobs per provider can run simultaneously
4. **Progress Tracking**: Jobs track progress via processedInput/remainingInput states
5. **Resumability**: Jobs save checkpoints and can resume after crashes

### Scraping Strategy
- **One browser per job** for complete isolation
- **Provider-specific strategies** (Shell, Castrol, Google, LinkedIn)
- **Checkpoint saving** after configurable intervals
- **Browser state persistence** (cookies, localStorage, scroll position)
- **Best-effort approach** with partial results on failure

### Data Processing
- **Dual storage**: Both raw HTML and normalized data are stored permanently
- **Deduplication**: Provider-specific composite keys prevent duplicates
- **Transformation pipeline**: Raw → Validation → Transformation → Storage
- **Real-time streaming**: New items broadcast via WebSocket/GraphQL subscriptions

## Development Commands

This is a pnpm monorepo. Always use `pnpm` instead of `npm` or `yarn`.

### Setup
```bash
# Initial setup
pnpm install
docker-compose up -d  # Start PostgreSQL and Redis

# Database setup
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
cd ../..
```

### API Development (apps/api)
```bash
# Start API in development mode
pnpm dev:api

# Build API
pnpm build:api

# Start production
pnpm --filter @scraper/api start:prod

# Linting and formatting
pnpm --filter @scraper/api lint
pnpm --filter @scraper/api format
```

### Testing
```bash
# Run unit tests
pnpm --filter @scraper/api test

# Run tests in watch mode
pnpm --filter @scraper/api test:watch

# Run e2e tests
pnpm --filter @scraper/api test:e2e

# Test coverage
pnpm --filter @scraper/api test:cov
```

### Database (Prisma)
```bash
# Always run from apps/api directory
cd apps/api

# Generate Prisma client after schema changes
npx prisma generate

# Create new migration
npx prisma migrate dev --name description_of_change

# Deploy migrations to production
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

### Package Management
```bash
# Build all packages
pnpm build:all

# Build specific package
pnpm --filter @scraper/types build
pnpm --filter @scraper/scraper-core build

# Add dependency to specific app/package
pnpm --filter @scraper/api add package-name
pnpm --filter @scraper/api add -D dev-package-name
```

### Infrastructure
```bash
# Start services (PostgreSQL + Redis)
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Reset everything (including volumes)
docker-compose down -v
```

## Architecture

### Monorepo Structure
```
scraper-monorepo/
├── apps/
│   ├── api/                     # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/         # Feature modules
│   │   │   ├── common/          # Shared services
│   │   │   └── main.ts
│   │   └── prisma/
│   │       └── schema.prisma    # Database schema
│   ├── web/                     # NextJS frontend (future)
│   └── workers/                 # BullMQ workers (future)
├── packages/
│   ├── types/                   # Shared TypeScript types
│   └── scraper-core/           # Core scraping strategies
└── docker-compose.yml
```

### Module Architecture (apps/api/src/modules/)

#### Module Ownership & Responsibilities
| Module | Database Tables | Key Responsibilities |
|--------|----------------|---------------------|
| `job-manager/` | ScrapingJob | Job lifecycle, state transitions, queue management |
| `scraper-engine/` | - | Browser automation, strategy pattern, provider implementations |
| `checkpoint/` | Checkpoint | State persistence, job recovery, browser context saving |
| `data-processor/` | ScrapedItem | Deduplication, data transformation, batch processing |
| `configuration/` | ScrapingConfiguration | Provider configs, selectors, templates |
| `real-time/` | - | WebSocket gateway, GraphQL subscriptions |

### Database Schema

Uses PostgreSQL with Prisma ORM. Key entities and their relationships:

```prisma
ScrapingJob (job-manager)
  ├── status: PENDING|RUNNING|PAUSED|COMPLETED|FAILED|CANCELLED
  ├── provider: SHELL|CASTROL|GOOGLE|LINKEDIN
  ├── input/currentInput/processedInput/remainingInput (progress tracking)
  ├── checkpoints[] → Checkpoint
  ├── scrapedItems[] → ScrapedItem
  └── logs[] → ScrapingLog

Checkpoint (checkpoint)
  ├── state: JSON (browser state, scroll position, etc.)
  ├── sequenceNumber: incremental
  └── job → ScrapingJob

ScrapedItem (data-processor)
  ├── deduplicationKey: unique per provider
  ├── rawHtml: full HTML content
  ├── normalizedData: processed data
  └── job → ScrapingJob

ScrapingConfiguration (configuration)
  ├── provider: SHELL|CASTROL|GOOGLE|LINKEDIN
  ├── selectors: JSON (CSS/XPath)
  └── options: JSON (rate limits, delays)
```

### Technology Stack
- **Framework**: NestJS with TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: BullMQ with Redis
- **Browser Automation**: Playwright (headless)
- **API**: GraphQL (code-first approach)
- **Real-time**: EventEmitter2 + WebSockets
- **Architecture**: Clean Architecture, SOLID principles

### Key Dependencies
```json
{
  "@nestjs/graphql": "GraphQL API",
  "@nestjs/bull": "Queue management",
  "bullmq": "Job queue system",
  "ioredis": "Redis client",
  "playwright": "Browser automation",
  "@prisma/client": "Database ORM",
  "@nestjs/event-emitter": "Event-driven architecture",
  "graphql-type-json": "JSON scalar for GraphQL"
}
```

## Development Guidelines

### Module Development Rules
1. **Repository Pattern**: Each module owns its database tables
2. **Service Layer**: Business logic in services, not resolvers
3. **Event-Driven**: Modules communicate via events
4. **Clean Boundaries**: No direct cross-module database access
5. **GraphQL Code-First**: Use decorators, not schema files

### Code Organization
```typescript
// Each module follows this structure:
module-name/
├── module-name.module.ts      // Module definition
├── services/                   // Business logic
│   └── service.ts
├── repositories/              // Database access (only for owned tables)
│   └── repository.ts
├── resolvers/                 // GraphQL resolvers
│   └── resolver.ts
├── dto/                       // Input/output types
│   └── create-input.ts
├── entities/                  // GraphQL object types
│   └── entity.ts
├── processors/                // Queue processors (if needed)
│   └── processor.ts
└── interfaces/                // Internal interfaces
    └── interface.ts
```

### GraphQL Conventions
```typescript
// Use code-first approach with decorators
@ObjectType('Job')
export class JobEntity {
  @Field(() => ID)
  id: string;
  
  @Field(() => ScrapingProvider)
  provider: ScrapingProvider;
}

// Input types for mutations
@InputType()
export class CreateJobInput {
  @Field(() => ScrapingProvider)
  provider: ScrapingProvider;
  
  @Field(() => GraphQLJSON, { nullable: true })
  input?: Record<string, any>;
}
```

### Error Handling
```typescript
// Use NestJS built-in exceptions
throw new NotFoundException(`Job ${id} not found`);
throw new BadRequestException(`Invalid state transition`);

// Log errors with context
this.logger.error('Job processing failed', error.stack, 'JobProcessor');
```

### Testing Strategy
```typescript
// Unit tests: Mock dependencies
// Integration tests: Use test database
// E2E tests: Full flow with real browser

// Test file naming
service.spec.ts       // Unit tests
service.e2e-spec.ts   // E2E tests
```

## Environment Configuration

### Required Environment Variables (.env)
```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/scraper_db"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Application
PORT=3000
NODE_ENV=development

# Browser
HEADLESS_BROWSER=true
BROWSER_TIMEOUT=30000

# Queue
MAX_CONCURRENT_JOBS_PER_PROVIDER=3
CHECKPOINT_INTERVAL=10
```

### Docker Services
```yaml
# PostgreSQL: Port 5432
# Redis: Port 6379
# Volumes persist data between restarts
```

## Common Tasks

### Adding a New Provider
1. Add to `ScrapingProvider` enum in Prisma schema
2. Create strategy class in `scraper-engine/strategies/`
3. Add provider-specific deduplication in `data-processor/`
4. Create configuration template in `configuration/`
5. Run `npx prisma generate` and migrate

### Implementing a New Module
1. Create module directory structure
2. Define repository for owned tables only
3. Implement service with business logic
4. Add GraphQL resolver with code-first decorators
5. Register module in `app.module.ts`
6. Emit events for cross-module communication

### Debugging Tips
```bash
# View database content
npx prisma studio

# Monitor Redis queues
redis-cli
> KEYS bull:*
> LLEN bull:scraper:wait

# Check GraphQL playground
http://localhost:3000/graphql

# View real-time logs
docker-compose logs -f
```

## Performance Considerations

1. **Batch Operations**: Process items in batches of 100-1000
2. **Indexes**: Ensure proper database indexes for queries
3. **Connection Pooling**: Prisma handles this automatically
4. **Browser Pool**: Limit concurrent browsers (memory usage)
5. **Queue Concurrency**: Configure per provider limits

## Security Guidelines

1. **Input Validation**: Use class-validator on all DTOs
2. **SQL Injection**: Prisma prevents this by default
3. **Rate Limiting**: Implement per-provider limits
4. **Sanitization**: Clean scraped HTML before storage
5. **Environment Variables**: Never commit .env files

## Troubleshooting

### Common Issues
```bash
# Prisma client out of sync
npx prisma generate

# Migration issues
npx prisma migrate reset  # WARNING: Deletes data

# Port already in use
lsof -i :3000  # Find process
kill -9 PID    # Kill process

# Redis connection failed
docker-compose restart redis

# Out of memory (browser issues)
# Reduce MAX_CONCURRENT_JOBS_PER_PROVIDER
```

## Project Status

### Completed Phases
- ✅ Monorepo setup
- ✅ Database schema design
- ✅ Basic infrastructure

### Current Phase
- 🔄 Phase 1: Job Manager Module implementation

### Upcoming Phases
- Phase 2: Scraper Engine Module
- Phase 3: Checkpoint System
- Phase 4: Data Processor
- Phase 5: Real-time Updates
- Phase 6: Configuration Module
- Phase 7: Additional Providers
- Phase 8: Frontend Application
- Phase 9: Advanced Features
- Phase 10: Production Readiness

## Important Notes

1. **Always use pnpm** for package management
2. **Module ownership**: Modules only write to their own tables
3. **Event-driven**: Use events for cross-module communication
4. **Code-first GraphQL**: Use decorators, not schema files
5. **Clean Architecture**: Maintain clear separation of concerns
6. **Progress tracking**: Jobs with input track processedInput/remainingInput
7. **Parallel execution**: Multiple jobs per provider allowed
8. **Browser isolation**: One browser per job for safety