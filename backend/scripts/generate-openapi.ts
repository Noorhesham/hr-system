/**
 * Generates a static `openapi.json` at the backend root for offline import into
 * APIDog / Postman.  Run with: `npm run openapi:export`.
 *
 * For the richest schemas, prefer importing the live URL `/docs-json` while the
 * app runs (the @nestjs/swagger CLI plugin is active during `nest start`).
 */
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../src/app.module';
import { buildOpenApiConfig } from '../src/openapi.config';

async function run() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const document = SwaggerModule.createDocument(app, buildOpenApiConfig());
  const outFile = join(process.cwd(), 'openapi.json');
  writeFileSync(outFile, JSON.stringify(document, null, 2));
  await app.close();
  console.log(`OpenAPI spec written to ${outFile}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
