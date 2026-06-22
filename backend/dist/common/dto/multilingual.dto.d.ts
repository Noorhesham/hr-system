import { Prisma } from '@prisma/client';
export declare class MultilingualDto {
    en: string;
    ar: string;
    static toJson(dto: MultilingualDto): Prisma.InputJsonValue;
}
