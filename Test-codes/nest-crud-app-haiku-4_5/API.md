# API Documentation

Complete reference for all API endpoints and their usage.

## Base URL

```
http://localhost:3000
```

---

## Users Endpoints

### 1. Create User

**Endpoint:** `POST /users`

**Description:** Create a new user with validation

**Request Body:**
```json
{
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "bio": "Software Developer"
}
```

**Required Fields:**
- `email` (string, email format, unique)
- `firstName` (string, 2-255 characters)
- `lastName` (string, 2-255 characters)

**Optional Fields:**
- `phone` (string, valid phone format)
- `bio` (string)

**Response:** `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "bio": "Software Developer",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

`400 Bad Request` - Invalid data or duplicate email
```json
{
  "statusCode": 400,
  "message": "User with email john@example.com already exists",
  "error": "Bad Request"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

---

### 2. Get All Users (Paginated)

**Endpoint:** `GET /users`

**Description:** Retrieve all users with pagination

**Query Parameters:**
- `skip` (number, default: 0) - Number of records to skip
- `take` (number, default: 10, max: 100) - Number of records to retrieve

**Response:** `200 OK`
```json
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "bio": "Software Developer",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 1
}
```

**Examples:**
```bash
# Get first 10 users
curl http://localhost:3000/users

# Get next 10 users
curl http://localhost:3000/users?skip=10&take=10

# Get 20 users from beginning
curl http://localhost:3000/users?take=20
```

---

### 3. Get User by ID

**Endpoint:** `GET /users/:id`

**Description:** Retrieve a specific user by unique ID

**Path Parameters:**
- `id` (UUID) - User's unique identifier

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "bio": "Software Developer",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

`404 Not Found` - User doesn't exist
```json
{
  "statusCode": 404,
  "message": "User with ID 550e8400-e29b-41d4-a716-446655440000 not found",
  "error": "Not Found"
}
```

`400 Bad Request` - Invalid UUID format
```json
{
  "statusCode": 400,
  "message": "Validation failed (uuid is expected)",
  "error": "Bad Request"
}
```

**Example:**
```bash
curl http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000
```

---

### 4. Search Users

**Endpoint:** `GET /users/search`

**Description:** Search users by first name, last name, or email

**Query Parameters:**
- `q` (string, required) - Search query
- `skip` (number, default: 0) - Number of records to skip
- `take` (number, default: 10, max: 100) - Number of records to retrieve

**Response:** `200 OK`
```json
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "bio": "Software Developer",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 1
}
```

**Note:** Search is case-insensitive and matches partial strings.

**Examples:**
```bash
# Search for users containing "john"
curl http://localhost:3000/users/search?q=john

# Search with pagination
curl http://localhost:3000/users/search?q=john&skip=0&take=5

# Search by email
curl http://localhost:3000/users/search?q=john@example.com
```

---

### 5. Update User

**Endpoint:** `PATCH /users/:id`

**Description:** Update one or more user fields

**Path Parameters:**
- `id` (UUID) - User's unique identifier

**Request Body:** (all fields optional)
```json
{
  "email": "johnny@example.com",
  "firstName": "Jonathan",
  "lastName": "Smith",
  "phone": "+9876543210",
  "bio": "Senior Software Developer",
  "isActive": true
}
```

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "johnny@example.com",
  "firstName": "Jonathan",
  "lastName": "Smith",
  "phone": "+9876543210",
  "bio": "Senior Software Developer",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:35:00.000Z"
}
```

**Error Responses:**

`404 Not Found` - User doesn't exist
```json
{
  "statusCode": 404,
  "message": "User with ID 550e8400-e29b-41d4-a716-446655440000 not found",
  "error": "Not Found"
}
```

`400 Bad Request` - Invalid data (e.g., duplicate email)
```json
{
  "statusCode": 400,
  "message": "User with email johnny@example.com already exists",
  "error": "Bad Request"
}
```

**Examples:**
```bash
# Update single field
curl -X PATCH http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Jonathan"}'

# Update multiple fields
curl -X PATCH http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jonathan",
    "bio": "Senior Developer",
    "isActive": true
  }'

# Clear optional field (set to null)
curl -X PATCH http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"phone": null}'
```

---

### 6. Delete User

**Endpoint:** `DELETE /users/:id`

**Description:** Delete a user permanently

**Path Parameters:**
- `id` (UUID) - User's unique identifier

**Response:** `200 OK`
```json
{
  "message": "User with ID 550e8400-e29b-41d4-a716-446655440000 successfully deleted"
}
```

**Error Responses:**

`404 Not Found` - User doesn't exist
```json
{
  "statusCode": 404,
  "message": "User with ID 550e8400-e29b-41d4-a716-446655440000 not found",
  "error": "Not Found"
}
```

**Example:**
```bash
curl -X DELETE http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000
```

---

## Response Format

### Success Response

All successful responses follow this format:

```json
{
  "id": "UUID",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "phone": "string | null",
  "bio": "string | null",
  "isActive": "boolean",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

### Error Response

```json
{
  "statusCode": "number",
  "message": "string",
  "error": "string",
  "timestamp": "ISO 8601 timestamp",
  "path": "string"
}
```

---

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid input, duplicate email, validation failed |
| 404 | Not Found | User doesn't exist |
| 500 | Internal Server Error | Server error |

---

## Validation Rules

### Email
- Must be valid email format
- Must be unique across all users
- Required field

### First Name & Last Name
- String type
- 2-255 characters
- Required fields

### Phone
- Must be valid phone format (if provided)
- Optional field

### Bio
- String type
- Optional field
- Can be null or empty string

### IsActive
- Boolean type
- Default: true
- Optional field

---

## Common Errors

### Duplicate Email
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "firstName": "John", "lastName": "Doe"}'
```
Response (if email already exists):
```json
{
  "statusCode": 400,
  "message": "User with email john@example.com already exists",
  "error": "Bad Request"
}
```

### Invalid Email Format
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid", "firstName": "John", "lastName": "Doe"}'
```
Response:
```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

### Invalid UUID
```bash
curl http://localhost:3000/users/invalid-uuid
```
Response:
```json
{
  "statusCode": 400,
  "message": "Validation failed (uuid is expected)",
  "error": "Bad Request"
}
```

### User Not Found
```bash
curl http://localhost:3000/users/550e8400-e29b-41d4-a716-000000000000
```
Response:
```json
{
  "statusCode": 404,
  "message": "User with ID 550e8400-e29b-41d4-a716-000000000000 not found",
  "error": "Not Found"
}
```

---

## Rate Limiting (Future Enhancement)

Currently not implemented. To add rate limiting:

```bash
npm install @nestjs/throttler
```

Then implement in `app.module.ts`:

```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,        // Time window in ms
        limit: 10,         // Max requests per window
      },
    ]),
  ],
})
export class AppModule {}
```

---

## Pagination Best Practices

### Efficient Pagination

```bash
# Get page 1 (skip 0, take 10)
GET /users?skip=0&take=10

# Get page 2 (skip 10, take 10)
GET /users?skip=10&take=10

# Get page 3 with 20 items per page (skip 40, take 20)
GET /users?skip=40&take=20
```

### Calculating Pagination

```javascript
const pageNumber = 2;
const pageSize = 10;
const skip = (pageNumber - 1) * pageSize;
// skip = 10

// Request
GET /users?skip=10&take=10
```

---

## Complete cURL Examples

### Create Multiple Users

```bash
# User 1
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }'

# User 2
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "firstName": "Jane",
    "lastName": "Smith"
  }'
```

### Workflow Example

```bash
# 1. Create user
USER_ID=$(curl -s -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }' | jq -r '.id')

# 2. Get user
curl http://localhost:3000/users/$USER_ID

# 3. Update user
curl -X PATCH http://localhost:3000/users/$USER_ID \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Jonathan"}'

# 4. Search users
curl http://localhost:3000/users/search?q=jonathan

# 5. Delete user
curl -X DELETE http://localhost:3000/users/$USER_ID
```

---

## Testing Endpoints

### Using curl

See examples above for each endpoint.

### Using Postman

Import the provided `postman-collection.json` file for all endpoints with examples.

### Using Thunder Client (VS Code)

Create requests following the endpoint specifications above.

### Using httpie

```bash
# Create user
http POST http://localhost:3000/users \
  email=john@example.com \
  firstName=John \
  lastName=Doe

# Get users
http http://localhost:3000/users

# Get specific user
http http://localhost:3000/users/{id}
```

---

For more information, see [README.md](./README.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).
