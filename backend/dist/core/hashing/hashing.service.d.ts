export declare class HashingService {
    private readonly saltRounds;
    hash(plainText: string): Promise<string>;
    compare(plainText: string, hash: string): Promise<boolean>;
}
