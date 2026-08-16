import {
  Body,
  Controller,
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
import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { CurrentUser, Tenant } from '../tenant/decorators/tenant.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('attendance')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, PermissionsGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  /**
   * Live check-in.
   * Portal employee → punches for self (omit employeeId).
   * Company Owner → must pass employeeId; employee must have a shift assigned.
   * Allowed only from shift startTime through endTime (use `at` to test).
   * Before start or after end → 400. Manual POST /attendance can still backfill.
   */
  @Post('check-in')
  @HttpCode(HttpStatus.OK)
  @ApiBody({
    type: CheckInDto,
    examples: {
      owner: {
        summary: 'Owner punches for an employee',
        value: { employeeId: 'employee-uuid' },
      },
      portal: {
        summary: 'Employee self check-in (empty body)',
        value: {},
      },
    },
  })
  checkIn(
    @CurrentUser() actor: AuthenticatedUser,
    @Tenant() companyId: string,
    @Body() dto: CheckInDto,
  ) {
    return this.attendanceService.checkIn(actor, companyId, dto);
  }

  /**
   * Live check-out — closes the most recent open record (overnight-safe).
   * Same actor rules as check-in.
   */
  @Post('check-out')
  @HttpCode(HttpStatus.OK)
  @ApiBody({
    type: CheckOutDto,
    examples: {
      owner: {
        summary: 'Owner punches out for an employee',
        value: { employeeId: 'employee-uuid' },
      },
      portal: {
        summary: 'Employee self check-out',
        value: {},
      },
    },
  })
  checkOut(
    @CurrentUser() actor: AuthenticatedUser,
    @Tenant() companyId: string,
    @Body() dto: CheckOutDto,
  ) {
    return this.attendanceService.checkOut(actor, companyId, dto);
  }

  /** Manual create/upsert of a day's record (Company Owner only). */
  @Post()
  @Permissions(PERMISSIONS.MANAGE_ATTENDANCE)
  @ApiBody({
    type: UpsertAttendanceDto,
    examples: {
      default: {
        summary: 'Manual entry (needs shift on employee)',
        value: {
          employeeId: 'employee-uuid',
          date: '2026-06-29',
          checkIn: '2026-06-29T08:05:00+03:00',
          checkOut: '2026-06-29T17:30:00+03:00',
        },
      },
      leave: {
        summary: 'Mark a leave day',
        value: { employeeId: 'employee-uuid', date: '2026-06-29', status: 'LEAVE' },
      },
    },
  })
  upsert(@Tenant() companyId: string, @Body() dto: UpsertAttendanceDto) {
    return this.attendanceService.upsert(companyId, dto);
  }

  /** Bulk import (JSON); per-row partial success (Company Owner only). */
  @Post('bulk')
  @Permissions(PERMISSIONS.MANAGE_ATTENDANCE)
  @ApiBody({
    type: BulkAttendanceDto,
    examples: {
      default: {
        summary: 'Two rows',
        value: {
          records: [
            {
              employeeId: 'employee-uuid',
              date: '2026-06-29',
              checkIn: '2026-06-29T08:00:00+03:00',
              checkOut: '2026-06-29T17:10:00+03:00',
            },
            {
              employeeId: 'employee-uuid-2',
              date: '2026-06-29',
              status: 'ABSENT',
            },
          ],
        },
      },
    },
  })
  bulk(@Tenant() companyId: string, @Body() dto: BulkAttendanceDto) {
    return this.attendanceService.bulkUpsert(companyId, dto);
  }

  /** List attendance. Portal users only see their own records. */
  @Get()
  findAll(
    @CurrentUser() actor: AuthenticatedUser,
    @Tenant() companyId: string,
    @Query() query: QueryAttendanceDto,
  ) {
    return this.attendanceService.findAll(actor, companyId, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() actor: AuthenticatedUser,
    @Tenant() companyId: string,
    @Param('id') id: string,
  ) {
    return this.attendanceService.findOne(actor, companyId, id);
  }

  /** Correct a record; recomputes metrics (Company Owner only). */
  @Patch(':id')
  @Permissions(PERMISSIONS.MANAGE_ATTENDANCE)
  update(
    @Tenant() companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.attendanceService.update(companyId, id, dto);
  }
}
