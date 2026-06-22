import { IsString, IsNotEmpty } from 'class-validator';
import { Prisma } from '@prisma/client';

export class MultilingualDto {
  @IsString()
  @IsNotEmpty()
  en: string;

  @IsString()
  @IsNotEmpty()
  ar: string;

  static toJson(dto: MultilingualDto): Prisma.InputJsonValue {
    return { en: dto.en, ar: dto.ar } as any;
  }
}
