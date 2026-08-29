import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource } from "typeorm";

config();

const configService = new ConfigService();
export default new DataSource({
    type: 'postgres',
    host: configService.get('POSTGRES_HOST'),
    port: configService.get('POSTGRES_PORT'),
    username: configService.get('POSTGRES_USER'),
    password: configService.get('POSTGRES_PASSWORD'),
    database: configService.get('POSTGRES_DB'),
    entities: [__dirname + '/../**/*.entity.ts', __dirname + '/../**/*.entity.js'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
    extra: {
        charset: 'utf8mb4_unicode_ci',
    },
    synchronize: true,
    logging: true,


});
//docker compose exec server npm run typeorm:generate-migration --name=add-vaccination-coverage
//docker compose cp server:/app/migrations/1786377203765-add-vaccination-coverage.ts ./migrations/
// docker compose exec server npm run typeorm:run-migrations