import { OnboardingService } from './onboarding.service';
import { UpdateOnboardingStateDto } from './dto/update-onboarding-state.dto';
export declare class OnboardingController {
    private readonly onboarding;
    constructor(onboarding: OnboardingService);
    getState(userId: string): Promise<{
        step: import("@prisma/client").$Enums.OnboardingStep | null;
        completedAt: Date | null;
    }>;
    updateState(userId: string, dto: UpdateOnboardingStateDto): Promise<{
        step: import("@prisma/client").$Enums.OnboardingStep | null;
        completedAt: Date | null;
    }>;
    complete(userId: string): Promise<{
        step: import("@prisma/client").$Enums.OnboardingStep | null;
        completedAt: Date | null;
    }>;
}
