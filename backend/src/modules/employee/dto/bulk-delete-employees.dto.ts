import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class BulkDeleteEmployeesDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    example: ['employee-uuid-1', 'employee-uuid-2'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  ids: string[];
}
