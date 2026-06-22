import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
          connectTimeout: 10_000,
          maxRetriesPerRequest: 1,
          lazyConnect: true,
        });
        client.on('error', (err) => console.error('Redis error:', err));
        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
