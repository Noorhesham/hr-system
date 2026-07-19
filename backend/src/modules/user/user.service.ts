import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

/**
 * Reusable, non-transactional read access to `User` records.
 *
 * Tenant note: lookups here are by globally-unique keys (`email`, `id`) for
 * authentication. Any *listing* of users must be scoped by `companyId` — add
 * such methods with an explicit tenant filter when the User CRUD phase lands.
 */
@Injectable()
export class UserService {
  constructor(private readonly db: DatabaseService) {}

  /** Used by login — includes role + linked employee for the JWT. */
  findByEmail(email: string) {
    return this.db.user.findUnique({
      where: { email },
      include: {
        role: { select: { name: true } },
        employee: { select: { id: true } },
      },
    });
  }

  findById(id: string) {
    return this.db.user.findUnique({
      where: { id },
      include: {
        role: { select: { name: true } },
        employee: { select: { id: true } },
      },
    });
  }
}
