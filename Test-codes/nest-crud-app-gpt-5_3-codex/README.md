# NestJS 11 Users CRUD (PostgreSQL)

Complete NestJS Users CRUD example using:

- NestJS 11
- TypeORM
- PostgreSQL (`pg` driver)
- DTO validation with `ValidationPipe` + `class-validator`

## 1. Install

```bash
npm install
```

## 2. Configure DB

Copy `.env.example` values into your shell env (or `.env` if you wire dotenv yourself).

Supported connection modes:

- `DATABASE_URL=postgres://...`
- or individual vars: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`

By default, this app reads from `process.env` and uses these fallbacks:

- host `localhost`
- port `5432`
- username `postgres`
- password `postgres`
- database `nestdb`

## 3. Run

```bash
npm run start:dev
```

Server starts on `http://localhost:3000` (or `PORT` if set).

## Users API

Base route: `/users`

1. Create user

```bash
curl -X POST http://localhost:3000/users \
	-H "Content-Type: application/json" \
	-d '{
		"firstName": "Ada",
		"lastName": "Lovelace",
		"email": "ada@example.com",
		"isActive": true
	}'
```

2. List users

```bash
curl http://localhost:3000/users
```

3. Get user by id

```bash
curl http://localhost:3000/users/1
```

4. Update user (partial)

```bash
curl -X PATCH http://localhost:3000/users/1 \
	-H "Content-Type: application/json" \
	-d '{
		"lastName": "Byron",
		"isActive": false
	}'
```

5. Delete user

```bash
curl -X DELETE http://localhost:3000/users/1
```

## Project Structure

```text
src/
	main.ts
	app.module.ts
	users/
		user.entity.ts
		users.module.ts
		users.service.ts
		users.controller.ts
		dto/
			create-user.dto.ts
			update-user.dto.ts
```

## Notes

- `ValidationPipe` is global with:
	- `transform: true`
	- `whitelist: true`
	- `forbidNonWhitelisted: true`
- `synchronize: true` is enabled for fast local setup only.
	Use migrations and set `synchronize: false` for production.
