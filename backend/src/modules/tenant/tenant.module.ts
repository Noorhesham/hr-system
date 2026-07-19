import { Module } from '@nestjs/common';
import { TenantGuard } from './guards/tenant.guard';

/**
 * Groups the cross-cutting multi-tenancy concerns. The `@Tenant()` /
 * `@CurrentUser()` param decorators live alongside this module; `TenantGuard`
 * is provided/exported here so any feature module can reuse it via DI.
 *
 * (Future request-scoped tenant context providers would also belong here.)
 */
@Module({
  providers: [TenantGuard],
  exports: [TenantGuard],
})
export class TenantModule {}
