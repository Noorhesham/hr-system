import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

/** Creates a PENDING loan/advance for an employee. */
export class CreateLoanDto {
  @ApiProperty({
    example: 12000,
    description: 'Total loan amount (must be positive).',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  totalAmount: number;
}
