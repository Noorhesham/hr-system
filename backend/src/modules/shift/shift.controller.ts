import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { ShiftService } from './shift.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { QueryShiftsDto } from './dto/query-shifts.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { Tenant } from '../tenant/decorators/tenant.decorator';

@ApiTags('Shifts')
@ApiBearerAuth()
@Controller('shifts')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, PermissionsGuard)
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @Post()
  @Permissions(PERMISSIONS.MANAGE_SHIFTS)
  @ApiBody({
    type: CreateShiftDto,
    examples: {
      default: {
        summary: 'Morning shift',
        value: {
          name: 'Morning',
          startTime: '08:00',
          endTime: '17:00',
          gracePeriodMinutes: 15,
        },
      },
      overnight: {
        summary: 'Night shift (crosses midnight)',
        value: {
          name: 'Night',
          startTime: '22:00',
          endTime: '06:00',
          gracePeriodMinutes: 10,
        },
      },
    },
  })
  create(@Tenant() companyId: string, @Body() dto: CreateShiftDto) {
    return this.shiftService.create(companyId, dto);
  }

  @Get()
  findAll(@Tenant() companyId: string, @Query() query: QueryShiftsDto) {
    return this.shiftService.findAll(companyId, query);
  }

  @Get(':id')
  findOne(@Tenant() companyId: string, @Param('id') id: string) {
    return this.shiftService.findOne(companyId, id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.MANAGE_SHIFTS)
  update(
    @Tenant() companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateShiftDto,
  ) {
    return this.shiftService.update(companyId, id, dto);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.MANAGE_SHIFTS)
  remove(@Tenant() companyId: string, @Param('id') id: string) {
    return this.shiftService.remove(companyId, id);
  }
}
