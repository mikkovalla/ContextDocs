# NestJS Users CRUD

NestJS 11 Users CRUD API with PostgreSQL + TypeORM.

## Setup

```bash
npm install
```

## Environment

Configure via env vars or defaults apply:

| Variable       | Default     |
|----------------|-------------|
| `DATABASE_URL` | —           |
| `DB_HOST`      | `localhost` |
| `DB_PORT`      | `5432`      |
| `DB_USERNAME`  | `postgres`  |
| `DB_PASSWORD`  | `postgres`  |
| `DB_NAME`      | `nestdb`    |
| `PORT`         | `3000`      |

If `DATABASE_URL` is set it takes precedence over the individual `DB_*` vars.

## Run

```bash
npm run start:dev
```

## API Endpoints

| Method   | Path         | Description        |
|----------|--------------|--------------------|
| `POST`   | `/users`     | Create a user      |
| `GET`    | `/users`     | List all users     |
| `GET`    | `/users/:id` | Get user by ID     |
| `PATCH`  | `/users/:id` | Update user by ID  |
| `DELETE` | `/users/:id` | Delete user by ID  |

### Create User

```json
POST /users
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "isActive": true
}
```
