import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';

describe('UsersController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DATABASE_HOST || 'localhost',
          port: parseInt(process.env.DATABASE_PORT || '5432', 10),
          username: process.env.DATABASE_USER || 'postgres',
          password: process.env.DATABASE_PASSWORD || 'postgres',
          database: process.env.DATABASE_NAME || 'nest_crud_db_test',
          entities: [User],
          synchronize: true,
          dropSchema: true,
        }),
        UsersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /users', () => {
    it('should create a new user', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe('john@example.com');
        });
    });

    it('should fail with invalid email', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'invalid-email',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /users', () => {
    it('should return all users', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('users');
          expect(res.body).toHaveProperty('total');
        });
    });
  });

  describe('GET /users/:id', () => {
    let userId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer()).post('/users').send({
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
      });
      userId = response.body.id;
    });

    it('should return a user by id', () => {
      return request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.id).toBe(userId);
        });
    });

    it('should return 404 for invalid id', () => {
      return request(app.getHttpServer()).get('/users/invalid-uuid').expect(HttpStatus.BAD_REQUEST);
    });
  });
});
