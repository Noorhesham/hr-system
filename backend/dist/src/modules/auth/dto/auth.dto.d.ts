export declare class RegisterDto {
    companyName: string;
    email: string;
    fullName?: string;
    phone?: string;
    jobTitle?: string;
    password: string;
    establishmentNumber?: string;
    planId?: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
export declare class UpdateProfileDto {
    fullName?: string;
    phone?: string;
    jobTitle?: string;
}
export declare class ForgotPasswordDto {
    email: string;
}
export declare class VerifyResetOtpDto {
    email: string;
    code: string;
}
export declare class ResetPasswordDto {
    resetToken: string;
    newPassword: string;
}
