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
import { Tenant } from '../tenant/decorators/tenant.decorator';
import { CurrentUser } from '../tenant/decorators/tenant.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { LeaveService } from './leave.service';
import { CreateLeaveDto, RejectLeaveDto } from './dto/create-leave.dto';
import { QueryLeavesDto } from './dto/query-leaves.dto';

@ApiTags('Leaves')
@ApiBearerAuth()
@Controller('leaves')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, PermissionsGuard)
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post()
  @ApiBody({ type: CreateLeaveDto })
  create(
    @Tenant() companyId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateLeaveDto,
  ) {
    return this.leaveService.create(companyId, actor, dto);
  }

  @Get()
  findAll(
    @Tenant() companyId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: QueryLeavesDto,
  ) {
    return this.leaveService.findAll(companyId, actor, query);
  }

  @Get(':id')
  findOne(
    @Tenant() companyId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.leaveService.findOne(companyId, actor, id);
  }

  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(
    @Tenant() companyId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.leaveService.approve(companyId, actor, id);
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: RejectLeaveDto })
  reject(
    @Tenant() companyId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RejectLeaveDto,
  ) {
    return this.leaveService.reject(companyId, actor, id, dto);
  }

  @Delete(':id')
  remove(
    @Tenant() companyId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.leaveService.remove(companyId, actor, id);
  }
}
