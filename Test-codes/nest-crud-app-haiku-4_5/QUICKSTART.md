# Quick Start Guide

Get the NestJS Users CRUD API running in 5 minutes.

## Option 1: Using Docker (Recommended)

### 1. Start PostgreSQL
```bash
docker-compose up -d
```

This starts:
- PostgreSQL on `localhost:5432` (credentials: postgres/postgres)
- pgAdmin on `http://localhost:5050` (credentials: admin@admin.com/admin)

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Application
```bash
npm run start:dev
```

### 4. Test the API
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

---

## Option 2: Using Local PostgreSQL

### 1. Create Database
```bash
createdb nest_crud_db
```

### 2. Configure Environment
Create `.env`:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=nest_crud_db
NODE_ENV=development
```

### 3. Install & Run
```bash
npm install
npm run start:dev
```

### 4. Test
```bash
curl http://localhost:3000/users
```

---

## Available Commands

| Command | Purpose |
|---------|---------|
| `npm run start:dev` | Run in development with auto-reload |
| `npm run build` | Build for production |
| `npm run start:prod` | Run production build |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint code |
| `npm run format` | Format code with Prettier |

---

## API Quick Reference

### Create User
```bash
POST /users
{
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "bio": "Developer"
}
```

### Get All Users
```bash
GET /users?skip=0&take=10
```

### Get User by ID
```bash
GET /users/{id}
```

### Search Users
```bash
GET /users/search?q=john&skip=0&take=10
```

### Update User
```bash
PATCH /users/{id}
{
  "firstName": "Jonathan"
}
```

### Delete User
```bash
DELETE /users/{id}
```

---

## Troubleshooting

### Connection Refused Error
- Ensure PostgreSQL is running: `docker-compose ps`
- Verify database credentials in `.env`
- Check if port 5432 is accessible

### Database Not Found
```bash
# Create the database
createdb nest_crud_db

# Or restart docker compose
docker-compose down -v
docker-compose up
```

### Port Already in Use
Change the port in package.json or environment, or kill the process:
```bash
lsof -i :3000
kill -9 <PID>
```

---

## Next Steps

- Read [README.md](./README.md) for detailed documentation
- Check `src/users/` folder for code structure
- Run tests: `npm run test`
- View database logs: `docker logs nest_crud_postgres`

Enjoy! 🚀
