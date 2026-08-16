import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Tenant, CurrentUser } from '../tenant/decorators/tenant.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { RequestService } from './request.service';
import {
  CreateRequestDto,
  QueryRequestsDto,
  RejectRequestDto,
} from './dto/request.dto';

@ApiTags('Requests')
@ApiBearerAuth()
@Controller('requests')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, PermissionsGuard)
export class RequestController {
  constructor(private readonly requests: RequestService) {}

  @Post()
  @ApiBody({ type: CreateRequestDto })
  create(
    @Tenant() companyId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateRequestDto,
  ) {
    return this.requests.create(companyId, actor, dto);
  }

  @Get()
  findAll(
    @Tenant() companyId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: QueryRequestsDto,
  ) {
    return this.requests.findAll(companyId, actor, query);
  }

  @Get(':id')
  findOne(
    @Tenant() companyId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.requests.findOne(companyId, actor, id);
  }

  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(
    @Tenant() companyId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.requests.approve(companyId, actor, id);
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: RejectRequestDto })
  reject(
    @Tenant() companyId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RejectRequestDto,
  ) {
    return this.requests.reject(companyId, actor, id, dto);
  }

  @Delete(':id')
  cancel(
    @Tenant() companyId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.requests.cancel(companyId, actor, id);
  }
}
