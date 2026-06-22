import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 50,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
    super({ adapter: new PrismaPg(pool) });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  // Bilingual full-text search helper
  async searchJsonFields(
    table: 'Product' | 'Category',
    jsonField: 'name' | 'description',
    term: string,
  ): Promise<string[]> {
    const safe = (s: string) => s.replace(/['"\\;]/g, '');
    const t = safe(table);
    const f = safe(jsonField);
    const words = term.trim().split(/\s+/);
    const conditions = words
      .map(
        (w) =>
          `("${f}"->>'en' ILIKE '%${safe(w)}%' OR "${f}"->>'ar' ILIKE '%${safe(w)}%')`,
      )
      .join(' AND ');
    const rows: { id: string }[] = await this.$queryRawUnsafe(
      `SELECT id FROM "${t}" WHERE ${conditions}`,
    );
    return rows.map((r) => r.id);
  }
}
