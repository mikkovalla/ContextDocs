# Architecture Overview

## Project Structure

```
nest-crud-app/
├── src/
│   ├── config/                 # Configuration classes
│   │   ├── config.service.ts   # Environment & app config
│   │   └── database.config.ts  # Database configuration
│   ├── common/                 # Shared utilities
│   │   ├── filters/            # Exception filters
│   │   ├── middlewares/        # HTTP middlewares
│   │   └── helpers/            # Helper utilities
│   ├── users/                  # Users feature module
│   │   ├── dto/                # Data Transfer Objects
│   │   ├── entities/           # TypeORM entities
│   │   ├── users.controller.ts # Route handlers
│   │   ├── users.service.ts    # Business logic
│   │   └── users.module.ts     # Feature module
│   ├── migrations/             # Database migrations
│   ├── app.module.ts           # Root module
│   └── main.ts                 # Application entry point
├── test/                       # End-to-end tests
├── docker-compose.yml          # Docker services
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
└── README.md                   # Documentation
```

## Design Patterns

### 1. **Layered Architecture**

```
Request → Controller → Service → Repository → Database
                     ↓
            Exception/Response
```

- **Controller Layer**: Handles HTTP requests, validation via pipes
- **Service Layer**: Contains business logic, database operations
- **Repository Layer**: TypeORM handles data access
- **Exception Handling**: Global filters catch and format errors

### 2. **Dependency Injection**

Uses NestJS's built-in DI container:

```typescript
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {
    // Service is injected automatically
  }
}
```

### 3. **DTO Pattern (Data Transfer Objects)**

Separate classes for input validation:

```typescript
// Validation happens automatically before reaching controller
@Post()
create(@Body() createUserDto: CreateUserDto) {
  return this.usersService.create(createUserDto);
}
```

### 4. **Module Organization**

Feature modules encapsulate related functionality:

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Share with other modules
})
export class UsersModule {}
```

### 5. **Service Layer Pattern**

Business logic separated from HTTP concerns:

```typescript
@Injectable()
export class UsersService {
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Pure business logic
    // Database operations
    // Error handling
  }
}
```

---

## Data Flow

### Create User Request

```
1. HTTP POST /users with JSON body
   ↓
2. Global ValidationPipe validates against CreateUserDto
   ↓
3. UsersController.create() receives validated DTO
   ↓
4. UsersService.create() handles business logic
   - Check for duplicate email
   - Create user with TypeORM
   - Return saved user
   ↓
5. Controller serializes response to JSON
   ↓
6. HTTP 201 response with user object
```

### Error Handling

```
TypeORM Error
   ↓
Service catches and throws HttpException
   ↓
Global HttpExceptionFilter catches
   ↓
Formats response with status code, message, timestamp
   ↓
HTTP error response with proper status code
```

---

## Core Concepts

### TypeORM Entity

Represents database table with decorators:

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
```

**Note**: Definite assignment (`!`) is used because fields are populated by the database, not during instantiation.

### DTOs with Validation

Uses `class-validator` for declarative validation:

```typescript
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  firstName!: string;
}
```

Validation happens automatically in pipes before controller receives data.

### Service with TypeORM

Repository injection for database access:

```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findOne(id: string): Promise<User> {
    return this.usersRepository.findOne({ where: { id } });
  }
}
```

---

## Key Features

### Pagination

Skip/take based pagination for list endpoints:

```typescript
async findAll(skip: number = 0, take: number = 10) {
  const [users, total] = await this.usersRepository.findAndCount({
    skip,
    take,
  });
  return { users, total };
}
```

Request: `GET /users?skip=0&take=10`

### Search

Full-text search with query builder:

```typescript
async search(query: string, skip: number = 0, take: number = 10) {
  return this.usersRepository
    .createQueryBuilder('user')
    .where('user.firstName ILIKE :query', { query: `%${query}%` })
    .orWhere('user.lastName ILIKE :query', { query: `%${query}%` })
    .skip(skip)
    .take(take)
    .getManyAndCount();
}
```

### Validation with Error Handling

Two-tier validation:

1. **Structural**: DTO validation with decorators
2. **Business Logic**: Duplicate email check in service

```typescript
async create(createUserDto: CreateUserDto): Promise<User> {
  // Structural validation happens in pipe automatically
  
  // Business logic validation
  const existing = await this.usersRepository.findOne({
    where: { email: createUserDto.email },
  });
  if (existing) {
    throw new BadRequestException('Email already exists');
  }

  return this.usersRepository.save(
    this.usersRepository.create(createUserDto),
  );
}
```

---

## Exception Handling

### Global Exception Filter

Catches all exceptions and formats responses:

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Format error response with:
    // - statusCode
    // - message
    // - timestamp
    // - path
  }
}
```

Applied globally in `main.ts`:

```typescript
app.useGlobalFilters(new AllExceptionsFilter());
```

---

## Testing Architecture

### Unit Tests (Service Layer)

Mock repository for isolated testing:

```typescript
describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: any;

  beforeEach(() => {
    // Setup mock repository
    mockRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    
    // Inject mock into service
  });

  it('should create a user', async () => {
    // Test service logic
  });
});
```

### E2E Tests

Full integration tests:

```typescript
describe('UsersController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Create test module with real database
    app = await Test.createTestingModule({
      imports: [UsersModule],
    }).createNestApplication();
  });

  it('should create a user via HTTP', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({ ... })
      .expect(201);
  });
});
```

---

## Database Design

### Schema

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  firstName VARCHAR(255) NOT NULL,
  lastName VARCHAR(255) NOT NULL,
  phone VARCHAR(255),
  bio TEXT,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_firstName ON users(firstName);
CREATE INDEX idx_users_lastName ON users(lastName);
```

### Relationships

Users table currently has no foreign keys. To add relationships (e.g., to another entity), follow the pattern:

```typescript
@OneToMany(() => Post, post => post.user)
posts!: Post[];
```

---

## Configuration Management

### Environment Variables

Default values provided if env vars not set:

```typescript
host: process.env.DATABASE_HOST || 'localhost',
port: parseInt(process.env.DATABASE_PORT || '5432', 10),
```

### Configuration Service

Centralized config access:

```typescript
constructor(private config: ConfigService) {
  const port = this.config.port;
  const db = this.config.database;
}
```

---

## Middleware & Pipes

### Request Validation (Pipes)

Applied globally to all endpoints:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // Remove unknown properties
    forbidNonWhitelisted: true,   // Reject unknown properties
    transform: true,              // Convert types
  }),
);
```

### Logging Middleware

Logs HTTP requests:

```typescript
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Log method, URL, status, duration
    next();
  }
}
```

---

## Security Considerations

### Input Validation

- DTO validation with `class-validator`
- Email format checking
- Phone number validation
- String length constraints

### Data Safety

- No direct SQL queries (TypeORM protects against SQL injection)
- Parameterized queries via TypeORM
- UUID IDs (harder to predict than sequential integers)

### Error Messages

- Generic messages for security (don't expose internal errors)
- Detailed logging on server side
- User-friendly error responses

### Future Enhancements

- Rate limiting: `@nestjs/throttler`
- Authentication: `@nestjs/jwt`, `@nestjs/passport`
- Authorization: Role-based access control
- Encryption: Hash passwords, encrypt sensitive data
- API Key validation
- CORS configuration

---

## Performance Optimization

### Pagination

Always use pagination for list endpoints to avoid loading all data.

### Indexing

Database indexes on frequently queried fields:
- `email` (unique)
- `firstName`, `lastName` (search fields)

### Connection Pooling

TypeORM handles connection pooling automatically.

### Query Optimization

- Select only needed columns
- Use eager/lazy loading for relationships
- Avoid N+1 queries with proper joins

Example optimized query:

```typescript
await this.usersRepository
  .createQueryBuilder('user')
  .select(['user.id', 'user.email', 'user.firstName'])
  .skip(skip)
  .take(take)
  .getMany();
```

---

## Deployment Considerations

### Environment-Specific Config

```typescript
if (process.env.NODE_ENV === 'production') {
  // Enable SSL
  // Disable logging
  // Set stricter validation
}
```

### Database Migrations

Use TypeORM migrations for schema changes in production:

```bash
npm run migration:generate -- src/migrations/MyMigration
npm run migration:run
```

### Docker

Provided `docker-compose.yml` includes:
- PostgreSQL container
- pgAdmin for database management
- Volume persistence
- Health checks

---

## Extension Points

### Adding New Features

1. Create new entity in `src/entities/`
2. Create DTOs in `src/module-name/dto/`
3. Create service in `src/module-name/module.service.ts`
4. Create controller in `src/module-name/module.controller.ts`
5. Create module in `src/module-name/module.module.ts`
6. Import module in `app.module.ts`

### Custom Decorators

Create reusable validation decorators:

```typescript
@ValidatorConstraint()
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  // Custom validation logic
}
```

### Middleware Chain

Add custom middleware to processing chain:

```typescript
app.use(loggingMiddleware);
app.use(authenticationMiddleware);
```

---

This architecture provides a solid foundation for a scalable, maintainable NestJS application.
