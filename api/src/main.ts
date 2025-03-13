import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import * as dotenv from 'dotenv';

/**
 * Initializes and starts the NestJS application.
 *
 * This function sets up the NestJS application with the provided AppModule,
 * configures environment variables using dotenv, enables CORS,
 * and sets up JSON body parsing using Express.
 *
 * @returns {Promise<import("@nestjs/common").INestApplication>} - A promise that resolves to the NestJS application instance.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  dotenv.config();
  app.enableCors();
  app.use(express.json());
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
