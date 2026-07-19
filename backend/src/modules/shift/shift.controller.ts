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
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '../tenant/decorators/tenant.decorator';
import { COMPANY_OWNER_ROLE } from '../../common/constants/roles.constant';

@ApiTags('Shifts')
@ApiBearerAuth()
@Controller('shifts')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @Post()
  @Roles(COMPANY_OWNER_ROLE)
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
  @Roles(COMPANY_OWNER_ROLE)
  update(
    @Tenant() companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateShiftDto,
  ) {
    return this.shiftService.update(companyId, id, dto);
  }

  @Delete(':id')
  @Roles(COMPANY_OWNER_ROLE)
  remove(@Tenant() companyId: string, @Param('id') id: string) {
    return this.shiftService.remove(companyId, id);
  }
}
