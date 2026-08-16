import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Dummy checkout payload for POST /company/subscribe. */
export class SubscribeDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  @IsNotEmpty()
  planId: string;

  @ApiProperty({ enum: ['MONTHLY', 'ANNUAL'], example: 'MONTHLY' })
  @IsString()
  @IsIn(['MONTHLY', 'ANNUAL'])
  billingCycle: 'MONTHLY' | 'ANNUAL';

  @ApiProperty({ example: 'Mohab Mohamed', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  cardHolderName: string;

  @ApiProperty({
    example: '4242424242424242',
    description:
      'Digits only or spaced. Card numbers ending in 0000 are deliberately declined (dummy fail rule).',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(12)
  @MaxLength(23)
  cardNumber: string;

  @ApiProperty({ example: '123', minLength: 3, maxLength: 4 })
  @IsString()
  @Matches(/^\d{3,4}$/, { message: 'cvv must be 3 or 4 digits' })
  cvv: string;

  @ApiProperty({ example: '12/28', description: 'MM/YY' })
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/, {
    message: 'expiry must be MM/YY',
  })
  expiry: string;

  @ApiProperty({ example: 'الشارع، رقم المبنى، الحي', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  billingAddress: string;

  @ApiProperty({ example: 'الرياض', maxLength: 80 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  city: string;

  @ApiProperty({ example: '12345', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  postalCode: string;

  @ApiProperty({ example: 'SA', maxLength: 80 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  country: string;

  @ApiPropertyOptional({ example: 'WELCOME20', maxLength: 40 })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  promoCode?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  savePaymentMethod?: boolean;
}
