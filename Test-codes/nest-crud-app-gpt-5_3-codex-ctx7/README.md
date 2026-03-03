# NestJS Users CRUD (PostgreSQL)

Standalone NestJS CRUD example for a `users` resource using TypeORM and PostgreSQL.

## Features

- `POST /users` create user
- `GET /users` list users
- `GET /users/:id` get user by id
- `PATCH /users/:id` update user
- `DELETE /users/:id` delete user
- Global request validation (`whitelist`, `forbidNonWhitelisted`, `transform`)

## Requirements

- Node.js 20+
- PostgreSQL available and reachable via connection string

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Edit `.env` and set your database URL:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/myapp
PORT=3000
```

4. Start the API:

```bash
npm run start:dev
```

## Quick Test

Create user:

```bash
curl -X POST http://localhost:3000/users \
	-H "Content-Type: application/json" \
	-d '{"name":"Ada Lovelace","email":"ada@example.com"}'
```

List users:

```bash
curl http://localhost:3000/users
```

Get one:

```bash
curl http://localhost:3000/users/1
```

Update:

```bash
curl -X PATCH http://localhost:3000/users/1 \
	-H "Content-Type: application/json" \
	-d '{"name":"Ada L."}'
```

Delete:

```bash
curl -X DELETE http://localhost:3000/users/1
```

## Notes

- This sample uses `synchronize: true` for local development convenience.
- Do not use `synchronize: true` in production.
