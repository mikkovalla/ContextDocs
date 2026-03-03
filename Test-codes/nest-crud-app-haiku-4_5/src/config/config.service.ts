import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  get isDevelopment(): boolean {
    return process.env.NODE_ENV !== 'production';
  }

  get isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  get port(): number {
    return parseInt(process.env.PORT || '3000', 10);
  }

  get database() {
    return {
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      name: process.env.DATABASE_NAME || 'nest_crud_db',
    };
  }

  get credentials() {
    return {
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
    };
  }
}
