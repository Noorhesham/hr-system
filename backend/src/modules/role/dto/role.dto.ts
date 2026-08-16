import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'Custom HR' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [String], example: ['VIEW_EMPLOYEE', 'MANAGE_LEAVES'] })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissionActions: string[];
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'Custom HR' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissionActions?: string[];
}

export class AssignUserRoleDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  roleId: string;
}

export class UnassignUsersDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  userIds: string[];
}
