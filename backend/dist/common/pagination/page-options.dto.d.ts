export declare class PageOptionsDto {
    order: 'asc' | 'desc';
    orderBy: string;
    page: number;
    limit: number;
    search?: string;
    get skip(): number;
}
