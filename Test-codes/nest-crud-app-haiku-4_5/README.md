# NestJS Users CRUD API

Complete, production-ready NestJS Users CRUD application with PostgreSQL using TypeORM.

## Features

✅ **CRUD Operations**: Create, Read, Update, Delete users  
✅ **Validation**: Class-validator with comprehensive DTO validation  
✅ **Pagination**: Skip/take based pagination on list endpoints  
✅ **Search**: Full-text search on user fields  
✅ **Error Handling**: Custom exception handling with proper HTTP status codes  
✅ **UUID-based IDs**: UUID primary keys for better security  
✅ **Timestamps**: Automatic createdAt/updatedAt tracking  
✅ **TypeORM**: Industry-standard ORM for PostgreSQL  
✅ **Testing**: Unit tests and E2E test examples  
✅ **Type Safety**: Full TypeScript strict mode enabled  

## Project Structure

```
src/
├── main.ts                    # Application entry point
├── app.module.ts              # Root module with database config
└── users/
    ├── entities/
    │   └── user.entity.ts     # User database entity
    ├── dto/
    │   ├── create-user.dto.ts # Create user validation DTO
    │   └── update-user.dto.ts # Update user validation DTO
    ├── users.service.ts       # Business logic layer
    ├── users.controller.ts    # Route handlers
    ├── users.module.ts        # Users feature module
    └── users.service.spec.ts  # Unit tests
test/
└── users.e2e-spec.ts         # End-to-end tests
```

## Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm, yarn, or pnpm

### 1. Install Dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Configure Database

Create a `.env` file in the root directory:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=nest_crud_db
NODE_ENV=development
```

### 3. Create PostgreSQL Database
```bash
createdb nest_crud_db
```

Or using psql:
```bash
psql -U postgres -c "CREATE DATABASE nest_crud_db;"
```

### 4. Run the Application

**Development mode** (with auto-reload):
```bash
npm run start:dev
```

**Production mode**:
```bash
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Create User
```http
POST /users
Content-Type: application/json

{
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "bio": "Software developer"
}
```

**Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "bio": "Software developer",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Get All Users (with Pagination)
```http
GET /users?skip=0&take=10
```

**Response** (200 OK):
```json
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "bio": "Software developer",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 1
}
```

### Get User by ID
```http
GET /users/550e8400-e29b-41d4-a716-446655440000
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "bio": "Software developer",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Search Users
```http
GET /users/search?q=john&skip=0&take=10
```

**Response** (200 OK):
```json
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "bio": "Software developer",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 1
}
```

### Update User
```http
PATCH /users/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "firstName": "Jonathan",
  "bio": "Senior software engineer"
}
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "firstName": "Jonathan",
  "lastName": "Doe",
  "phone": "+1234567890",
  "bio": "Senior software engineer",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:35:00.000Z"
}
```

### Delete User
```http
DELETE /users/550e8400-e29b-41d4-a716-446655440000
```

**Response** (200 OK):
```json
{
  "message": "User with ID 550e8400-e29b-41d4-a716-446655440000 successfully deleted"
}
```

## Validation Rules

### CreateUserDto
- `email`: Valid email format, required, unique
- `firstName`: String, required, 2-255 characters
- `lastName`: String, required, 2-255 characters
- `phone`: Valid phone number format, optional
- `bio`: String, optional

### UpdateUserDto
- All fields are optional
- Email uniqueness is checked against other users
- Same validation rules apply to provided fields

## Error Handling

The API uses standard HTTP status codes:

| Code | Scenario |
|------|----------|
| 201 | User created successfully |
| 200 | Request successful |
| 400 | Bad request (duplicate email, invalid data) |
| 404 | User not found |
| 500 | Internal server error |

**Error Response Example**:
```json
{
  "statusCode": 400,
  "message": "User with email john@example.com already exists",
  "error": "Bad Request"
}
```

## Database Schema

### users table

| Column | Type | Properties |
|--------|------|-----------|
| id | UUID | Primary Key, Auto-generated |
| email | VARCHAR(255) | Unique, indexed |
| firstName | VARCHAR(255) | Not null |
| lastName | VARCHAR(255) | Not null |
| phone | VARCHAR(255) | Nullable |
| bio | TEXT | Nullable |
| isActive | BOOLEAN | Default: true |
| createdAt | TIMESTAMP | Auto-set on creation |
| updatedAt | TIMESTAMP | Auto-updated |

## Testing

### Run Unit Tests
```bash
npm run test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:cov
```

### Run E2E Tests
```bash
npm run test:e2e
```

## Development

### Linting
```bash
npm run lint
```

### Code Formatting
```bash
npm run format
```

### Database Migrations (TypeORM)

If using migrations instead of synchronize:

```bash
npm run migration:generate -- src/migrations/YourMigrationName
npm run migration:run
npm run migration:revert
```

## Advanced Features

### Pagination Example
```bash
# Skip first 10, take 20
curl "http://localhost:3000/users?skip=10&take=20"
```

### Search Functionality
The search endpoint searches across `firstName`, `lastName`, and `email` fields using case-insensitive pattern matching:

```bash
# Search for user containing "john"
curl "http://localhost:3000/users/search?q=john"

# With pagination
curl "http://localhost:3000/users/search?q=john&skip=0&take=5"
```

### Input Sanitization
- `whitelist: true` - Only defined properties are accepted
- `forbidNonWhitelisted: true` - Reject unknown properties
- `transform: true` - Auto-convert types based on DTO

## Type Safety Notes

All entity fields use definite assignment (`!`) in strict TypeScript mode:
```typescript
@Column()
firstName!: string;  // Will be set by database
```

This is necessary because framework-populated fields from the database aren't immediately available during class instantiation. See [NestJS TypeScript strict mode guide](https://docs.nestjs.com/techniques/database) for details.

## Dependencies

### Core
- `@nestjs/common` - NestJS common utilities
- `@nestjs/core` - NestJS core framework
- `@nestjs/platform-express` - Express adapter
- `reflect-metadata` - Required for decorators
- `rxjs` - Reactive programming library

### Database
- `@nestjs/typeorm` - NestJS TypeORM integration
- `typeorm` - ORM for database operations
- `pg` - PostgreSQL client

### Validation
- `class-validator` - DTO validation decorators
- `class-transformer` - DTO transformation

### Development
- `typescript` - Language and compiler
- `jest` - Test framework
- `ts-jest` - TypeScript preprocessor for Jest
- `@nestjs/testing` - NestJS testing utilities

## Production Considerations

1. **Environment Variables**: Use `.env` for sensitive data
2. **Database Connection Pooling**: Configure in TypeORM options
3. **HTTPS**: Use reverse proxy (nginx, Caddy) in production
4. **CORS**: Configure for your frontend domain
5. **Rate Limiting**: Implement using `@nestjs/throttler`
6. **Logging**: Use bunyan or winston for structured logs
7. **API Documentation**: Generate with `@nestjs/swagger`

## License

MIT

## Contributing

Feel free to submit Issues and Enhancement requests.
