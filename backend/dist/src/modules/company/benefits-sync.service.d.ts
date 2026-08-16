import { DatabaseService } from '../../database/database.service';
export declare const BENEFIT_COMPONENT_NAMES: {
    readonly housing: "Housing Allowance";
    readonly transport: "Transport Allowance";
    readonly annualTickets: "Annual Tickets Allowance";
};
export declare class BenefitsSyncService {
    private readonly db;
    constructor(db: DatabaseService);
    syncEmployeeBenefits(companyId: string, employeeIds?: string[]): Promise<void>;
    private syncOne;
    private upsertOrDelete;
}
